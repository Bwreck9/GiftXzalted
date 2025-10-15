// API routes - integrates Stripe (javascript_stripe blueprint) and OpenAI
import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { getGiftRecommendations } from "./openai";
import { insertProfileSchema, insertMessageSchema, insertGiftListSchema, insertGiftItemSchema, users } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { requireAuth, type AuthRequest } from "./middleware/auth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});

const TOKENS_PER_ONETIME_PURCHASE = 5000; // $5 gets you 5,000 tokens
const ONETIME_PURCHASE_AMOUNT = 5; // $5
const TOKENS_PER_GENERATION = 500; // Each AI generation costs 500 tokens

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth sync - create or update user from Firebase (public endpoint for initial sync)
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { email, displayName, photoURL } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      let user = await storage.getUser(userId);
      
      if (!user) {
        // Create new user with Firebase UID
        const userWithId = { id: userId, email, displayName: displayName || null, photoURL: photoURL || null };
        const [createdUser] = await db.insert(users).values(userWithId).returning();
        user = createdUser;
      }

      res.json(user);
    } catch (error: any) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Get current user data
  app.get("/api/user", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Get all profiles for current user
  app.get("/api/profiles", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const profiles = await storage.getProfilesByUserId(userId);
      res.json(profiles);
    } catch (error: any) {
      console.error("Error getting profiles:", error);
      res.status(500).json({ error: "Failed to get profiles" });
    }
  });

  // Get single profile
  app.get("/api/profiles/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const profile = await storage.getProfile(id);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      if (profile.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(profile);
    } catch (error: any) {
      console.error("Error getting profile:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // Create profile
  app.post("/api/profiles", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { generateResponse, ...profileData } = req.body;

      const validated = insertProfileSchema.parse({
        ...profileData,
        userId,
      });

      // If AI generation requested, check tokens and generate response
      let aiResponse: string | undefined = undefined;
      if (generateResponse === true) {
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (user.tokens < TOKENS_PER_GENERATION) {
          return res.status(400).json({ error: "Insufficient tokens", required: TOKENS_PER_GENERATION });
        }

        // Deduct tokens
        await storage.updateUserTokens(userId, user.tokens - TOKENS_PER_GENERATION);

        // Generate AI response
        try {
          aiResponse = await getGiftRecommendations(
            validated,
            `Generate thoughtful gift recommendations for ${validated.name} based on their profile.`,
            []
          );
        } catch (error) {
          // Refund tokens if AI generation fails
          await storage.updateUserTokens(userId, user.tokens);
          throw error;
        }
      }

      const profile = await storage.createProfile(validated, aiResponse);
      res.json(profile);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid profile data", details: error.errors });
      }
      console.error("Error creating profile:", error);
      res.status(500).json({ error: error.message || "Failed to create profile" });
    }
  });

  // Update profile
  app.patch("/api/profiles/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const profile = await storage.getProfile(id);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      if (profile.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Remove userId from request body to prevent ownership reassignment
      const { userId: _removed, ...updateData } = req.body;
      
      const validated = insertProfileSchema.partial().parse(updateData);
      const updated = await storage.updateProfile(id, validated);
      res.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid profile data", details: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Delete profile
  app.delete("/api/profiles/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const profile = await storage.getProfile(id);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      if (profile.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteProfile(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // Get messages for a profile
  app.get("/api/messages/:profileId", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { profileId } = req.params;
      const userId = req.userId!;

      const profile = await storage.getProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      if (profile.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const messages = await storage.getMessagesByProfileId(profileId);
      res.json(messages);
    } catch (error: any) {
      console.error("Error getting messages:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Send message and get AI response
  app.post("/api/messages", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { profileId, content } = req.body;

      if (!profileId || !content || typeof content !== 'string') {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate message length (5000 character limit)
      if (content.length > 5000) {
        return res.status(400).json({ error: "Message too long (max 5000 characters)" });
      }

      // Validate message
      const validated = insertMessageSchema.parse({
        profileId,
        role: 'user',
        content,
      });

      const profile = await storage.getProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      if (profile.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Check tokens
      const user = await storage.getUser(userId);
      
      if (!user || user.tokens <= 0) {
        return res.status(402).json({ error: "Insufficient tokens" });
      }

      // Save user message
      await storage.createMessage(validated);

      // Get conversation history
      const messages = await storage.getMessagesByProfileId(profileId);
      const conversationHistory = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      // Get AI response
      const aiResponse = await getGiftRecommendations(
        {
          name: profile.name,
          age: profile.age,
          event: profile.event,
          gender: profile.gender,
          relationship: profile.relationship || undefined,
          personality: profile.personality,
          interests: profile.interests,
          shoppingFor: profile.shoppingFor,
        },
        content,
        conversationHistory
      );

      // Save AI response
      const assistantMessage = await storage.createMessage({
        profileId,
        role: 'assistant',
        content: aiResponse,
      });

      // Deduct token (500 tokens per chat message)
      await storage.updateUserTokens(userId, user.tokens - TOKENS_PER_GENERATION);

      res.json(assistantMessage);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });

  // Stripe payment route for one-time payments (referenced from javascript_stripe blueprint)
  app.post("/api/create-payment-intent", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const amount = ONETIME_PURCHASE_AMOUNT;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId,
          tokens: TOKENS_PER_ONETIME_PURCHASE.toString(),
        },
      });

      // Create transaction record
      await storage.createTransaction({
        userId,
        amount: amount * 100,
        tokens: TOKENS_PER_ONETIME_PURCHASE,
        type: 'one-time',
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Error creating payment intent: " + error.message });
    }
  });

  // Gift Lists (Free Feature)
  
  // Get all gift lists for current user
  app.get("/api/gift-lists", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const lists = await storage.getGiftListsByUserId(userId);
      res.json(lists);
    } catch (error: any) {
      console.error("Error getting gift lists:", error);
      res.status(500).json({ error: "Failed to get gift lists" });
    }
  });

  // Get single gift list
  app.get("/api/gift-lists/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const list = await storage.getGiftList(id);
      
      if (!list) {
        return res.status(404).json({ error: "Gift list not found" });
      }

      if (list.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(list);
    } catch (error: any) {
      console.error("Error getting gift list:", error);
      res.status(500).json({ error: "Failed to get gift list" });
    }
  });

  // Create gift list
  app.post("/api/gift-lists", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;

      const validated = insertGiftListSchema.parse({
        ...req.body,
        userId,
      });

      const list = await storage.createGiftList(validated);
      res.json(list);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid gift list data", details: error.errors });
      }
      console.error("Error creating gift list:", error);
      res.status(500).json({ error: "Failed to create gift list" });
    }
  });

  // Update gift list
  app.patch("/api/gift-lists/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const list = await storage.getGiftList(id);
      
      if (!list) {
        return res.status(404).json({ error: "Gift list not found" });
      }

      if (list.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Don't allow changing userId
      const { userId: _, ...updates } = req.body;
      const validated = insertGiftListSchema.partial().parse(updates);

      const updatedList = await storage.updateGiftList(id, validated);
      res.json(updatedList);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid gift list data", details: error.errors });
      }
      console.error("Error updating gift list:", error);
      res.status(500).json({ error: "Failed to update gift list" });
    }
  });

  // Delete gift list
  app.delete("/api/gift-lists/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const list = await storage.getGiftList(id);
      
      if (!list) {
        return res.status(404).json({ error: "Gift list not found" });
      }

      if (list.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteGiftList(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting gift list:", error);
      res.status(500).json({ error: "Failed to delete gift list" });
    }
  });

  // Gift Items
  
  // Get items for a gift list
  app.get("/api/gift-lists/:listId/items", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { listId } = req.params;
      const userId = req.userId!;

      const list = await storage.getGiftList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "Gift list not found" });
      }

      if (list.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const items = await storage.getGiftItemsByListId(listId);
      res.json(items);
    } catch (error: any) {
      console.error("Error getting gift items:", error);
      res.status(500).json({ error: "Failed to get gift items" });
    }
  });

  // Create gift item
  app.post("/api/gift-lists/:listId/items", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { listId } = req.params;
      const userId = req.userId!;

      const list = await storage.getGiftList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "Gift list not found" });
      }

      if (list.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const validated = insertGiftItemSchema.parse({
        ...req.body,
        listId,
      });

      const item = await storage.createGiftItem(validated);
      res.json(item);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid gift item data", details: error.errors });
      }
      console.error("Error creating gift item:", error);
      res.status(500).json({ error: "Failed to create gift item" });
    }
  });

  // Update gift item
  app.patch("/api/gift-lists/:listId/items/:itemId", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { listId, itemId } = req.params;
      const userId = req.userId!;

      const list = await storage.getGiftList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "Gift list not found" });
      }

      if (list.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Don't allow changing listId
      const { listId: _, ...updates } = req.body;
      const validated = insertGiftItemSchema.partial().parse(updates);

      const updatedItem = await storage.updateGiftItem(itemId, validated);
      res.json(updatedItem);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid gift item data", details: error.errors });
      }
      console.error("Error updating gift item:", error);
      res.status(500).json({ error: "Failed to update gift item" });
    }
  });

  // Delete gift item
  app.delete("/api/gift-lists/:listId/items/:itemId", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { listId, itemId } = req.params;
      const userId = req.userId!;

      const list = await storage.getGiftList(listId);
      
      if (!list) {
        return res.status(404).json({ error: "Gift list not found" });
      }

      if (list.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteGiftItem(itemId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting gift item:", error);
      res.status(500).json({ error: "Failed to delete gift item" });
    }
  });

  // Stripe webhook to handle payment success
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("CRITICAL: STRIPE_WEBHOOK_SECRET is not set - webhook endpoint is vulnerable!");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }

      if (!signature) {
        console.error("Webhook request missing stripe-signature header");
        return res.status(400).json({ error: "Missing signature" });
      }

      let event;
      try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
          req.body,
          signature as string,
          webhookSecret
        );
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
      }

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;
        const tokens = parseInt(paymentIntent.metadata.tokens);

        if (userId && tokens) {
          const user = await storage.getUser(userId);
          
          if (user) {
            // Add tokens to user account
            await storage.updateUserTokens(userId, user.tokens + tokens);
            
            // Note: Transaction record was already created in create-payment-intent endpoint
            // No need to create duplicate transaction here
          }
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook failed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
