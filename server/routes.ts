// API routes - integrates Stripe (javascript_stripe blueprint) and OpenAI
import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { getGiftRecommendations } from "./openai";
import { insertProfileSchema, insertMessageSchema, users } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { requireAuth, type AuthRequest } from "./middleware/auth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

const CREDITS_PER_PURCHASE = 10; // $5 gets you 10 queries
const PURCHASE_AMOUNT = 5; // $5

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

      const validated = insertProfileSchema.parse({
        ...req.body,
        userId,
      });

      const profile = await storage.createProfile(validated);
      res.json(profile);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid profile data", details: error.errors });
      }
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
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

      const validated = insertProfileSchema.partial().parse(req.body);
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

      // Check credits
      const user = await storage.getUser(userId);
      
      if (!user || user.credits <= 0) {
        return res.status(402).json({ error: "Insufficient credits" });
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

      // Deduct credit
      await storage.updateUserCredits(userId, user.credits - 1);

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
      const amount = PURCHASE_AMOUNT;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId,
          credits: CREDITS_PER_PURCHASE.toString(),
        },
      });

      // Create transaction record
      await storage.createTransaction({
        userId,
        amount: amount * 100,
        credits: CREDITS_PER_PURCHASE,
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Error creating payment intent: " + error.message });
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
        const credits = parseInt(paymentIntent.metadata.credits);

        if (userId && credits) {
          const user = await storage.getUser(userId);
          
          if (user) {
            await storage.updateUserCredits(userId, user.credits + credits);
          }

          // Update transaction status
          await storage.createTransaction({
            userId,
            amount: paymentIntent.amount,
            credits,
            stripePaymentIntentId: paymentIntent.id,
            status: 'completed',
          });
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
