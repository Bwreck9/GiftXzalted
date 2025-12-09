// API routes - integrates Replit Auth, Stripe and OpenAI
import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { getGiftRecommendations } from "./openai";
import { insertProfileSchema, insertMessageSchema, insertGiftListSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Use production keys when deployed, testing keys in development
// REPLIT_DEPLOYMENT is automatically set to "1" in deployed apps
const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
const stripeSecretKey = isProduction
  ? process.env.STRIPE_SECRET_KEY
  : process.env.TESTING_STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing required Stripe secret: ' + (isProduction ? 'STRIPE_SECRET_KEY' : 'TESTING_STRIPE_SECRET_KEY'));
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-09-30.clover",
});

const TOKENS_PER_ONETIME_PURCHASE = 5000; // $5 gets you 5,000 tokens
const ONETIME_PURCHASE_AMOUNT = 5; // $5
const TOKENS_PER_GENERATION = 200; // Each AI generation costs 200 tokens

// Profile limits based on subscription tier
const PROFILE_LIMITS = {
  free: 5,
  basic: 10,
  premium: 20,
  enterprise: 100
};

// Gift list and idea limits
const GIFT_LIST_LIMIT = 25; // Maximum gift lists per profile
const MANUAL_IDEA_LIMIT = 100; // Maximum manual gift ideas per list

// Monthly subscription tokens (reset monthly, don't stack)
const SUBSCRIPTION_TOKENS = {
  basic: 10000,      // $5/month gets 10,000 tokens/month
  premium: 50000,    // $20/month gets 50,000 tokens/month
  enterprise: 200000 // $100/month gets 200,000 tokens/month
};

// Helper function to get profile limit for a user
function getProfileLimit(subscriptionTier: string | null): number {
  if (!subscriptionTier) return PROFILE_LIMITS.free;
  const tier = subscriptionTier.toLowerCase();
  return PROFILE_LIMITS[tier as keyof typeof PROFILE_LIMITS] || PROFILE_LIMITS.free;
}

// Helper function to get total available tokens (subscription + purchased)
function getTotalTokens(user: { tokens: number; purchasedTokens: number }): number {
  return (user.tokens || 0) + (user.purchasedTokens || 0);
}

// Helper function to deduct tokens (uses purchased tokens first, then subscription tokens)
// Returns details about what was deducted from where for proper refunds
async function deductTokens(userId: string, amount: number) {
  const user = await storage.getUser(userId);
  if (!user) throw new Error("User not found");
  
  const { db } = await import('./db');
  const { users } = await import('@shared/schema');
  const { eq } = await import('drizzle-orm');
  
  let remainingToDeduct = amount;
  const originalPurchasedTokens = user.purchasedTokens || 0;
  const originalSubscriptionTokens = user.tokens || 0;
  let newPurchasedTokens = originalPurchasedTokens;
  let newSubscriptionTokens = originalSubscriptionTokens;
  
  // First, use purchased tokens (one-time tokens that never expire)
  let deductedFromPurchased = 0;
  if (newPurchasedTokens > 0) {
    deductedFromPurchased = Math.min(newPurchasedTokens, remainingToDeduct);
    newPurchasedTokens -= deductedFromPurchased;
    remainingToDeduct -= deductedFromPurchased;
  }
  
  // Then, use subscription tokens if needed
  let deductedFromSubscription = 0;
  if (remainingToDeduct > 0 && newSubscriptionTokens > 0) {
    deductedFromSubscription = Math.min(newSubscriptionTokens, remainingToDeduct);
    newSubscriptionTokens -= deductedFromSubscription;
    remainingToDeduct -= deductedFromSubscription;
  }
  
  // Verify we had enough tokens for the full deduction
  if (remainingToDeduct > 0) {
    throw new Error(`Insufficient tokens: requested ${amount}, available ${originalPurchasedTokens + originalSubscriptionTokens}`);
  }
  
  // Update both token columns
  await db
    .update(users)
    .set({
      tokens: newSubscriptionTokens,
      purchasedTokens: newPurchasedTokens,
    })
    .where(eq(users.id, userId));
    
  return { 
    deductedFromPurchased,
    deductedFromSubscription,
    totalDeducted: deductedFromPurchased + deductedFromSubscription,
    remainingTotal: newSubscriptionTokens + newPurchasedTokens 
  };
}

// Helper function to refund tokens to their original sources
async function refundTokens(userId: string, purchasedAmount: number, subscriptionAmount: number) {
  const user = await storage.getUser(userId);
  if (!user) return;
  
  const { db } = await import('./db');
  const { users } = await import('@shared/schema');
  const { eq } = await import('drizzle-orm');
  
  await db
    .update(users)
    .set({
      purchasedTokens: (user.purchasedTokens || 0) + purchasedAmount,
      tokens: (user.tokens || 0) + subscriptionAmount,
    })
    .where(eq(users.id, userId));
}

// Helper function to check and reset subscription tokens if needed
// Subscription tokens reset monthly without stacking, one-time tokens persist
async function checkAndResetSubscriptionTokens(userId: string) {
  const user = await storage.getUser(userId);
  if (!user) return;

  // Only process if user has an active subscription
  if (!user.subscriptionTier || user.subscriptionStatus !== 'active') {
    return;
  }

  const tier = user.subscriptionTier.toLowerCase() as keyof typeof SUBSCRIPTION_TOKENS;
  const monthlyTokens = SUBSCRIPTION_TOKENS[tier];
  
  if (!monthlyTokens) {
    return; // Free tier or invalid tier
  }

  const now = new Date();
  const resetDate = user.tokensResetDate ? new Date(user.tokensResetDate) : null;

  // Check if we need to reset (either no reset date set, or it's past the reset date)
  const needsReset = !resetDate || now >= resetDate;

  if (needsReset) {
    // Calculate next reset date (first day of next month)
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // Reset ONLY subscription tokens (tokens column), purchased tokens are preserved
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    await db
      .update(users)
      .set({ 
        tokens: monthlyTokens,  // Reset subscription tokens to tier amount
        tokensResetDate: nextReset 
      })
      .where(eq(users.id, userId));
    
    console.log(`Reset subscription tokens for user ${userId}: set to ${monthlyTokens} (purchased tokens: ${user.purchasedTokens || 0} preserved), next reset: ${nextReset.toISOString()}`);
  }
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
      let tokensDeducted = false;
      let deductionResult: any = null;
      
      if (generateResponse === true) {
        // Verify minimum required fields for AI generation
        if (!validated.personalityTraits || validated.personalityTraits.length === 0) {
          return res.status(400).json({ error: "Missing required questionnaire fields for AI generation. Please select at least one personality trait." });
        }

        // Check and reset subscription tokens if needed
        await checkAndResetSubscriptionTokens(userId);
        
        // Refresh user data to get updated token count
        const refreshedUser = await storage.getUser(userId);
        if (!refreshedUser || getTotalTokens(refreshedUser) < TOKENS_PER_GENERATION) {
          return res.status(400).json({ error: "Insufficient tokens", required: TOKENS_PER_GENERATION });
        }

        // Deduct tokens (uses purchased tokens first, then subscription tokens)
        deductionResult = await deductTokens(userId, TOKENS_PER_GENERATION);
        tokensDeducted = true;

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
          // Refund tokens to their original sources if AI generation fails
          await refundTokens(userId, deductionResult.deductedFromPurchased, deductionResult.deductedFromSubscription);
          throw error;
        }
      }

      // Create profile - refund tokens if this fails after AI generation
      let profile;
      try {
        profile = await storage.createProfile(validated);
      } catch (error) {
        // Refund tokens if profile creation fails after AI generation consumed tokens
        if (tokensDeducted && deductionResult) {
          await refundTokens(userId, deductionResult.deductedFromPurchased, deductionResult.deductedFromSubscription);
        }
        throw error;
      }
      
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
      const { userId: _removed, generateResponse, ...updateData } = req.body;
      
      const validated = insertProfileSchema.partial().parse(updateData);
      
      // If AI generation requested, check tokens and generate response
      let tokensDeducted = false;
      let deductionResult: any = null;
      
      if (generateResponse === true) {
        // Merge validated data with existing profile to get complete data for validation
        const completeData = { ...profile, ...validated };
        
        // Verify minimum required fields for AI generation
        if (!completeData.personalityTraits || completeData.personalityTraits.length === 0) {
          return res.status(400).json({ error: "Missing required questionnaire fields for AI generation. Please select at least one personality trait." });
        }

        // Check and reset subscription tokens if needed
        await checkAndResetSubscriptionTokens(userId);
        
        // Refresh user data to get updated token count
        const refreshedUser = await storage.getUser(userId);
        if (!refreshedUser || getTotalTokens(refreshedUser) < TOKENS_PER_GENERATION) {
          return res.status(400).json({ error: "Insufficient tokens", required: TOKENS_PER_GENERATION });
        }

        // Deduct tokens (uses purchased tokens first, then subscription tokens)
        deductionResult = await deductTokens(userId, TOKENS_PER_GENERATION);
        tokensDeducted = true;

        // Generate AI response
        try {
          const aiResponse = await getGiftRecommendations(
            {
              name: completeData.name,
              ageRange: completeData.ageRange || null,
              gender: completeData.gender || null,
              relationship: completeData.relationship || null,
              personalityTraits: completeData.personalityTraits || [],
              interests: completeData.interests || '',
              closeness: completeData.closeness || null,
              budget: completeData.budget || null,
              giftPreferences: completeData.giftPreferences || [],
              dislikes: completeData.dislikes || null,
              giftStyle: completeData.giftStyle || null,
              location: completeData.location || null,
              additionalNotes: completeData.additionalNotes || null,
            } as any,
            `Generate thoughtful gift recommendations for ${completeData.name} based on their profile.`,
            []
          );
          
          // Add AI response to update data
          (validated as any).aiResponse = aiResponse;
        } catch (error) {
          // Refund tokens to their original sources if AI generation fails
          await refundTokens(userId, deductionResult.deductedFromPurchased, deductionResult.deductedFromSubscription);
          throw error;
        }
      }
      
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
      const { profileId, content, giftListId, alreadyGeneratedIdeas } = req.body;

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

      // Check and reset subscription tokens if needed
      await checkAndResetSubscriptionTokens(userId);
      
      // Check tokens
      const user = await storage.getUser(userId);
      
      if (!user || getTotalTokens(user) < TOKENS_PER_GENERATION) {
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

      // Verify profile has at least ONE questionnaire field filled (one-question minimum)
      const hasQuestionnaireData = 
        profile.ageRange ||
        profile.gender ||
        (profile.personalityTraits && profile.personalityTraits.length > 0) ||
        profile.interests ||
        profile.relationship ||
        profile.closeness ||
        profile.budget ||
        (profile.giftPreferences && profile.giftPreferences.length > 0) ||
        profile.dislikes ||
        profile.giftStyle ||
        profile.location ||
        profile.additionalNotes;
      
      if (!hasQuestionnaireData) {
        return res.status(400).json({ error: "Profile questionnaire not completed. Please fill out at least one question from the profile details." });
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
        conversationHistory,
        alreadyGeneratedIdeas || []
      );

      // Deduct tokens FIRST (uses purchased tokens first, then subscription tokens)
      // This prevents saving the AI response if token deduction fails
      let deductionResult;
      try {
        deductionResult = await deductTokens(userId, TOKENS_PER_GENERATION);
      } catch (error: any) {
        // If insufficient tokens, return 402 Payment Required
        if (error.message?.includes('Insufficient tokens')) {
          return res.status(402).json({ error: "Insufficient tokens", required: TOKENS_PER_GENERATION });
        }
        throw error;
      }

      // Save AI response only after successful token deduction
      // If this fails, refund the tokens
      let assistantMessage;
      try {
        assistantMessage = await storage.createMessage({
          profileId,
          role: 'assistant',
          content: aiResponse,
        });
        
        // If this is a gift list generation, also save to gift list premiumResults
        if (giftListId) {
          const giftList = await storage.getGiftList(giftListId);
          
          if (giftList && giftList.profileId === profileId) {
            // Parse the AI response to extract gift recommendations
            // Expected format: JSON array of {id, title, reason}
            try {
              // Remove markdown code blocks if present (case-insensitive)
              let cleanedResponse = aiResponse.trim();
              if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/^```(?:json|JSON)?\s*/i, '').replace(/\s*```$/i, '');
              }
              
              const recommendations = JSON.parse(cleanedResponse);
              
              // Validate it's an array
              if (Array.isArray(recommendations)) {
                await storage.updateGiftList(giftListId, {
                  premiumResults: JSON.stringify(recommendations),
                });
                console.log(`Saved ${recommendations.length} gift recommendations to list ${giftListId}`);
              } else {
                console.error("AI response is not an array:", recommendations);
              }
            } catch (parseError) {
              console.error("Failed to parse AI response as JSON:", parseError);
              console.log("AI Response:", aiResponse);
              // Continue anyway - the message was saved
            }
          }
        }
      } catch (error: any) {
        // Refund tokens if message persistence fails
        await refundTokens(userId, deductionResult.deductedFromPurchased, deductionResult.deductedFromSubscription);
        throw error;
      }

      res.json({ 
        ...assistantMessage, 
        aiResponse // Include the raw AI response for frontend session tracking
      });
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
      
      // Validate quantity from request body
      const quantitySchema = z.object({
        quantity: z.number().int().min(1).max(20)
      });
      
      const { quantity } = quantitySchema.parse(req.body);
      
      // Calculate total amount and tokens based on quantity
      const amount = ONETIME_PURCHASE_AMOUNT * quantity;
      const tokens = TOKENS_PER_ONETIME_PURCHASE * quantity;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId,
          tokens: tokens.toString(),
          quantity: quantity.toString(),
        },
      });

      // Create transaction record
      await storage.createTransaction({
        userId,
        amount: amount * 100,
        tokens: tokens,
        type: 'one-time',
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quantity", details: error.errors });
      }
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe subscription route for recurring profile plans (referenced from javascript_stripe blueprint)
  app.post("/api/create-subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ error: "User email not found" });
      }
      
      // Validate plan selection
      const planSchema = z.object({
        planId: z.enum(['basic', 'premium', 'enterprise'])
      });
      
      const { planId } = planSchema.parse(req.body);
      
      // Define plan details
      const planDetails = {
        basic: { price: 5, tokens: 10000, name: 'Basic Plan' },
        premium: { price: 20, tokens: 50000, name: 'Premium Plan' },
        enterprise: { price: 100, tokens: 200000, name: 'Enterprise Plan' },
      };
      
      const plan = planDetails[planId];
      
      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email,
          metadata: { userId },
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        const { db } = await import('./db');
        const { users } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, userId));
      }
      
      // Create a price with inline product data
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: plan.price * 100,
        recurring: { interval: 'month' },
        product_data: {
          name: `Gift Xzalted ${plan.name}`,
        },
      });
      
      // Create subscription using the price ID
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          tier: planId,
        },
      });
      
      // Update user with subscription ID
      const { db } = await import('./db');
      const { users } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      await db
        .update(users)
        .set({ stripeSubscriptionId: subscription.id })
        .where(eq(users.id, userId));
      
      const invoice: any = subscription.latest_invoice;
      const paymentIntent: any = invoice?.payment_intent;
      
      console.log("Subscription created:", {
        subscriptionId: subscription.id,
        hasInvoice: !!invoice,
        hasPaymentIntent: !!paymentIntent,
        clientSecret: paymentIntent?.client_secret ? "present" : "missing"
      });
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid plan selection", details: error.errors });
      }
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Error creating subscription: " + error.message });
    }
  });

  // Stripe Checkout Session for one-time token purchases
  app.post("/api/create-checkout-session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ error: "User email not found" });
      }
      
      // Validate quantity from request body
      const quantitySchema = z.object({
        quantity: z.number().int().min(1).max(20)
      });
      
      const { quantity } = quantitySchema.parse(req.body);
      
      // Calculate total amount and tokens based on quantity
      const amount = ONETIME_PURCHASE_AMOUNT * quantity;
      const tokens = TOKENS_PER_ONETIME_PURCHASE * quantity;
      
      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email,
          metadata: { userId },
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        const { db } = await import('./db');
        const { users } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, userId));
      }
      
      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${tokens.toLocaleString()} Gift Xzalted Tokens`,
                description: `One-time purchase of ${tokens.toLocaleString()} AI tokens`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          tokens: tokens.toString(),
          quantity: quantity.toString(),
          type: 'one-time',
        },
        success_url: `${req.headers.origin || 'https://gift.xzalted.com'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || 'https://gift.xzalted.com'}/payment-cancelled`,
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quantity", details: error.errors });
      }
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Error creating checkout session: " + error.message });
    }
  });

  // Stripe Checkout Session for subscription purchases
  app.post("/api/create-subscription-checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ error: "User email not found" });
      }
      
      // Validate plan selection
      const planSchema = z.object({
        planId: z.enum(['basic', 'premium', 'enterprise'])
      });
      
      const { planId } = planSchema.parse(req.body);
      
      // Define plan details
      const planDetails = {
        basic: { price: 5, tokens: 10000, profiles: 10, name: 'Basic Plan' },
        premium: { price: 20, tokens: 50000, profiles: 20, name: 'Premium Plan' },
        enterprise: { price: 100, tokens: 200000, profiles: 100, name: 'Enterprise Plan' },
      };
      
      const plan = planDetails[planId];
      
      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email,
          metadata: { userId },
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        const { db } = await import('./db');
        const { users } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, userId));
      }
      
      // Create a price for the subscription
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: plan.price * 100,
        recurring: { interval: 'month' },
        product_data: {
          name: `Gift Xzalted ${plan.name}`,
          metadata: {
            tier: planId,
            tokens: plan.tokens.toString(),
            profiles: plan.profiles.toString(),
          },
        },
      });
      
      // Create Stripe Checkout Session for subscription
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          tier: planId,
          tokens: plan.tokens.toString(),
          type: 'subscription',
        },
        subscription_data: {
          metadata: {
            userId,
            tier: planId,
          },
        },
        success_url: `${req.headers.origin || 'https://gift.xzalted.com'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || 'https://gift.xzalted.com'}/payment-cancelled`,
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid plan selection", details: error.errors });
      }
      console.error("Error creating subscription checkout:", error);
      res.status(500).json({ error: "Error creating subscription checkout: " + error.message });
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

      // Check gift list limit
      const existingLists = await storage.getGiftListsByProfileId(profileId);
      if (existingLists.length >= GIFT_LIST_LIMIT) {
        return res.status(400).json({ 
          error: `Gift list limit reached. You can have up to ${GIFT_LIST_LIMIT} lists per profile. Delete some lists to create new ones.`,
          code: 'GIFT_LIST_LIMIT'
        });
      }

      const { eventDate, ...bodyData } = req.body;
      
      const validated = insertGiftListSchema.parse({
        ...bodyData,
        profileId,
        eventDate: eventDate ? new Date(eventDate) : undefined,
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
      const { profileId: _, eventDate, ...updates } = req.body;
      
      // Check manual ideas limit if manualIdeas are being updated
      if (updates.manualIdeas !== undefined) {
        // Filter out empty strings and trim
        const cleanedIdeas = updates.manualIdeas
          .map((idea: string) => idea.trim())
          .filter((idea: string) => idea.length > 0);
        
        if (cleanedIdeas.length > MANUAL_IDEA_LIMIT) {
          return res.status(400).json({ 
            error: `Gift idea limit reached. You can have up to ${MANUAL_IDEA_LIMIT} ideas per list. Delete some ideas to add new ones.`,
            code: 'MANUAL_IDEA_LIMIT'
          });
        }
        
        // Use the cleaned ideas
        updates.manualIdeas = cleanedIdeas;
      }
      
      // Convert eventDate string to Date object if provided
      const processedUpdates: any = { ...updates };
      if (eventDate !== undefined) {
        processedUpdates.eventDate = eventDate ? new Date(eventDate) : null;
      }
      
      const updatedList = await storage.updateGiftList(id, processedUpdates);
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
      // Use production webhook secret when deployed, testing secret in development
      const webhookSecret = isProduction
        ? process.env.STRIPE_WEBHOOK_SECRET
        : process.env.TESTING_STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        const secretName = isProduction ? 'STRIPE_WEBHOOK_SECRET' : 'TESTING_STRIPE_WEBHOOK_SECRET';
        console.error(`CRITICAL: ${secretName} is not set - webhook endpoint is vulnerable!`);
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
        console.log('Payment intent succeeded:', {
          id: paymentIntent.id,
          metadata: paymentIntent.metadata
        });
        
        const userId = paymentIntent.metadata.userId;
        const tokens = parseInt(paymentIntent.metadata.tokens);

        console.log('Extracted from metadata:', { userId, tokens });

        if (userId && tokens) {
          const user = await storage.getUser(userId);
          console.log('User found:', user ? `Yes (id: ${user.id})` : 'No');
          
          if (user) {
            // Add one-time purchased tokens (never expire)
            const { db } = await import('./db');
            const { users } = await import('@shared/schema');
            const { eq } = await import('drizzle-orm');
            
            const oldTokens = user.purchasedTokens || 0;
            const newTokens = oldTokens + tokens;
            
            await db
              .update(users)
              .set({
                purchasedTokens: newTokens,
              })
              .where(eq(users.id, userId));
            
            console.log(`✅ Tokens added for user ${userId}: ${oldTokens} -> ${newTokens} (+${tokens})`);
            
            // Note: Transaction record was already created in create-payment-intent endpoint
            // No need to create duplicate transaction here
          } else {
            console.error(`❌ User not found for userId: ${userId}`);
          }
        } else {
          console.error(`❌ Missing metadata: userId=${userId}, tokens=${tokens}`);
        }
      }
      
      // Handle Checkout Session completed (for Stripe Checkout flow)
      else if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('Checkout session completed:', {
          id: session.id,
          mode: session.mode,
          metadata: session.metadata
        });
        
        const userId = session.metadata?.userId;
        const type = session.metadata?.type;
        
        if (!userId) {
          console.error(`❌ Missing userId in checkout session metadata`);
        } else if (type === 'one-time') {
          // Handle one-time token purchase
          const tokens = parseInt(session.metadata?.tokens || '0');
          
          if (tokens > 0) {
            const user = await storage.getUser(userId);
            if (user) {
              const { db } = await import('./db');
              const { users } = await import('@shared/schema');
              const { eq } = await import('drizzle-orm');
              
              const oldTokens = user.purchasedTokens || 0;
              const newTokens = oldTokens + tokens;
              
              await db
                .update(users)
                .set({
                  purchasedTokens: newTokens,
                })
                .where(eq(users.id, userId));
              
              console.log(`✅ Tokens added for user ${userId}: ${oldTokens} -> ${newTokens} (+${tokens}) via Checkout`);
              
              // Create transaction record
              await storage.createTransaction({
                userId,
                amount: session.amount_total || 0,
                tokens: tokens,
                type: 'one-time',
                stripePaymentIntentId: session.payment_intent as string || session.id,
                status: 'completed',
              });
            } else {
              console.error(`❌ User not found for userId: ${userId}`);
            }
          }
        } else if (type === 'subscription') {
          // Subscription is handled by customer.subscription.created webhook
          // Just log that checkout was successful
          console.log(`✅ Subscription checkout completed for user ${userId}, subscription will be activated by subscription webhook`);
        }
      }
      
      // Handle subscription creation
      else if (event.type === 'customer.subscription.created') {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        
        // Find user by Stripe customer ID
        const { db } = await import('./db');
        const { users } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId));
        
        if (user) {
          // Extract tier from subscription metadata or price ID
          const tier = (subscription.metadata?.tier || 'basic').toLowerCase();
          const monthlyTokens = SUBSCRIPTION_TOKENS[tier as keyof typeof SUBSCRIPTION_TOKENS];
          
          // Calculate next reset date (first day of next month)
          const now = new Date();
          const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          
          // Update user's subscription info and grant initial tokens
          await db
            .update(users)
            .set({
              subscriptionTier: tier,
              subscriptionStatus: subscription.status,
              stripeSubscriptionId: subscription.id,
              tokens: monthlyTokens || 0,
              tokensResetDate: nextReset,
            })
            .where(eq(users.id, user.id));
          
          console.log(`Subscription created for user ${user.id}: ${tier} tier, ${monthlyTokens} tokens`);
        }
      }
      
      // Handle subscription updates (tier changes, upgrades, downgrades)
      else if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        
        const { db } = await import('./db');
        const { users, profiles } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId));
        
        if (user) {
          const oldTier = user.subscriptionTier;
          const newTier = (subscription.metadata?.tier || 'basic').toLowerCase();
          const newMonthlyTokens = SUBSCRIPTION_TOKENS[newTier as keyof typeof SUBSCRIPTION_TOKENS];
          
          // Update subscription status and tier
          await db
            .update(users)
            .set({
              subscriptionTier: newTier,
              subscriptionStatus: subscription.status,
              stripeSubscriptionId: subscription.id,
            })
            .where(eq(users.id, user.id));
          
          // If downgrading, check if user has too many profiles
          const oldLimit = getProfileLimit(oldTier);
          const newLimit = getProfileLimit(newTier);
          
          if (newLimit < oldLimit) {
            // User is downgrading - check profile count
            const userProfiles = await db
              .select()
              .from(profiles)
              .where(eq(profiles.userId, user.id));
            
            if (userProfiles.length > newLimit) {
              // Auto-delete excess profiles (oldest first)
              const profilesToDelete = userProfiles
                .sort((a, b) => {
                  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return dateA - dateB;
                })
                .slice(0, userProfiles.length - newLimit);
              
              for (const profile of profilesToDelete) {
                await storage.deleteProfile(profile.id);
              }
              
              console.log(`Deleted ${profilesToDelete.length} profiles for user ${user.id} due to downgrade from ${oldTier} to ${newTier}`);
            }
          }
          
          console.log(`Subscription updated for user ${user.id}: ${oldTier} -> ${newTier}`);
        }
      }
      
      // Handle subscription cancellation
      else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        
        const { db } = await import('./db');
        const { users, profiles } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId));
        
        if (user) {
          const oldTier = user.subscriptionTier;
          
          // Reset to free tier
          await db
            .update(users)
            .set({
              subscriptionTier: null,
              subscriptionStatus: null,
              stripeSubscriptionId: null,
              tokensResetDate: null,
            })
            .where(eq(users.id, user.id));
          
          // Check if user has too many profiles for free tier
          const userProfiles = await db
            .select()
            .from(profiles)
            .where(eq(profiles.userId, user.id));
          
          const freeLimit = PROFILE_LIMITS.free;
          
          if (userProfiles.length > freeLimit) {
            // Auto-delete excess profiles (oldest first)
            const profilesToDelete = userProfiles
              .sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateA - dateB;
              })
              .slice(0, userProfiles.length - freeLimit);
            
            for (const profile of profilesToDelete) {
              await storage.deleteProfile(profile.id);
            }
            
            console.log(`Deleted ${profilesToDelete.length} profiles for user ${user.id} due to subscription cancellation`);
          }
          
          console.log(`Subscription canceled for user ${user.id}: ${oldTier} -> free`);
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
