// API routes - integrates Replit Auth, Stripe and OpenAI
import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { getGiftRecommendations } from "./openai";
import { insertProfileSchema, insertMessageSchema, insertGiftListSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});

const TOKENS_PER_ONETIME_PURCHASE = 5000; // $5 gets you 5,000 tokens
const ONETIME_PURCHASE_AMOUNT = 5; // $5
const TOKENS_PER_GENERATION = 500; // Each AI generation costs 500 tokens

// Profile limits based on subscription tier
const PROFILE_LIMITS = {
  free: 5,
  basic: 10,
  premium: 20,
  enterprise: 100
};

// Helper function to get profile limit for a user
function getProfileLimit(subscriptionTier: string | null): number {
  if (!subscriptionTier) return PROFILE_LIMITS.free;
  const tier = subscriptionTier.toLowerCase();
  return PROFILE_LIMITS[tier as keyof typeof PROFILE_LIMITS] || PROFILE_LIMITS.free;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Get current user (Replit Auth route)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // If user doesn't exist in DB yet, create them from session claims
      if (!user) {
        const claims = req.user.claims;
        user = await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name,
          lastName: claims.last_name,
          profileImageUrl: claims.profile_image_url,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all profiles for current user
  app.get("/api/profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profiles = await storage.getProfilesByUserId(userId);
      res.json(profiles);
    } catch (error: any) {
      console.error("Error getting profiles:", error);
      res.status(500).json({ error: "Failed to get profiles" });
    }
  });

  // Get single profile
  app.get("/api/profiles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

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
  app.post("/api/profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { generateResponse, ...profileData } = req.body;

      // Get user to check subscription tier and profile limit
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check profile limit based on subscription tier
      const existingProfiles = await storage.getProfilesByUserId(userId);
      const profileLimit = getProfileLimit(user.subscriptionTier);
      
      if (existingProfiles.length >= profileLimit) {
        return res.status(400).json({ 
          error: "Profile limit reached", 
          limit: profileLimit,
          current: existingProfiles.length
        });
      }

      const validated = insertProfileSchema.parse({
        ...profileData,
        userId,
      });

      // If AI generation requested, check tokens and generate response
      let aiResponse: string | undefined = undefined;
      if (generateResponse === true) {
        // Verify minimum required fields for AI generation
        if (!validated.interests || !validated.personalityTraits || validated.personalityTraits.length === 0) {
          return res.status(400).json({ error: "Missing required questionnaire fields for AI generation. Please complete personality traits and interests." });
        }

        if (user.tokens < TOKENS_PER_GENERATION) {
          return res.status(400).json({ error: "Insufficient tokens", required: TOKENS_PER_GENERATION });
        }

        // Deduct tokens
        await storage.updateUserTokens(userId, user.tokens - TOKENS_PER_GENERATION);

        // Generate AI response
        try {
          aiResponse = await getGiftRecommendations(
            {
              name: validated.name,
              ageRange: validated.ageRange || null,
              gender: validated.gender || null,
              relationship: validated.relationship || null,
              personalityTraits: validated.personalityTraits || [],
              interests: validated.interests || '',
              closeness: validated.closeness || null,
              budget: validated.budget || null,
              giftPreferences: validated.giftPreferences || [],
              dislikes: validated.dislikes || null,
              giftStyle: validated.giftStyle || null,
              location: validated.location || null,
              additionalNotes: validated.additionalNotes || null,
            } as any,
            `Generate thoughtful gift recommendations for ${validated.name} based on their profile.`,
            []
          );
        } catch (error) {
          // Refund tokens if AI generation fails
          await storage.updateUserTokens(userId, user.tokens);
          throw error;
        }
      }

      const profile = await storage.createProfile(validated);
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
  app.patch("/api/profiles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

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
  app.delete("/api/profiles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

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

  // Clear profile data (manual ideas and premium results)
  app.post("/api/profiles/:id/clear", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const profile = await storage.getProfile(id);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      if (profile.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Clear manual ideas and premium results
      const updated = await storage.updateProfile(id, {
        manualIdeas: [],
        premiumResults: null,
        aiResponse: null, // Also clear legacy field
      } as any);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error clearing profile:", error);
      res.status(500).json({ error: "Failed to clear profile" });
    }
  });

  // Get messages for a profile
  app.get("/api/messages/:profileId", isAuthenticated, async (req: any, res) => {
    try {
      const { profileId } = req.params;
      const userId = req.user.claims.sub;

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
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

      // Verify profile has questionnaire data
      if (!profile.interests || !profile.personalityTraits || profile.personalityTraits.length === 0) {
        return res.status(400).json({ error: "Profile questionnaire not completed. Please fill out the profile details first." });
      }

      // Get AI response
      const aiResponse = await getGiftRecommendations(
        {
          name: profile.name,
          ageRange: profile.ageRange || null,
          gender: profile.gender || null,
          relationship: profile.relationship || null,
          personalityTraits: profile.personalityTraits || [],
          interests: profile.interests || '',
          closeness: profile.closeness || null,
          budget: profile.budget || null,
          giftPreferences: profile.giftPreferences || [],
          dislikes: profile.dislikes || null,
          giftStyle: profile.giftStyle || null,
          location: profile.location || null,
          additionalNotes: profile.additionalNotes || null,
        } as any,
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
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Gift Lists - occasions within a profile
  
  // Get all gift lists for a profile
  app.get("/api/profiles/:profileId/gift-lists", isAuthenticated, async (req: any, res) => {
    try {
      const { profileId } = req.params;
      const userId = req.user.claims.sub;

      // Verify profile ownership
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      if (profile.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const lists = await storage.getGiftListsByProfileId(profileId);
      res.json(lists);
    } catch (error: any) {
      console.error("Error getting gift lists:", error);
      res.status(500).json({ error: "Failed to get gift lists" });
    }
  });

  // Get single gift list
  app.get("/api/gift-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const list = await storage.getGiftList(id);
      
      if (!list) {
        return res.status(404).json({ error: "Gift list not found" });
      }

      // Verify ownership through profile
      const profile = await storage.getProfile(list.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(list);
    } catch (error: any) {
      console.error("Error getting gift list:", error);
      res.status(500).json({ error: "Failed to get gift list" });
    }
  });

  // Create gift list for a profile
  app.post("/api/profiles/:profileId/gift-lists", isAuthenticated, async (req: any, res) => {
    try {
      const { profileId } = req.params;
      const userId = req.user.claims.sub;

      // Verify profile ownership
      const profile = await storage.getProfile(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      if (profile.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const validated = insertGiftListSchema.parse({
        ...req.body,
        profileId,
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
  app.patch("/api/gift-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const list = await storage.getGiftList(id);
      
      if (!list) {
        return res.status(404).json({ error: "Gift list not found" });
      }

      // Verify ownership through profile
      const profile = await storage.getProfile(list.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Don't allow changing profileId
      const { profileId: _, ...updates } = req.body;
      const updatedList = await storage.updateGiftList(id, updates);
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
  app.delete("/api/gift-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const list = await storage.getGiftList(id);
      
      if (!list) {
        return res.status(404).json({ error: "Gift list not found" });
      }

      // Verify ownership through profile
      const profile = await storage.getProfile(list.profileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteGiftList(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting gift list:", error);
      res.status(500).json({ error: "Failed to delete gift list" });
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
