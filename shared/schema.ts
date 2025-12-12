import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (Replit Auth requirement)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - Replit authenticated users
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Replit user ID (from sub claim)
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  tokens: integer("tokens").notNull().default(0), // Subscription tokens (reset monthly)
  purchasedTokens: integer("purchased_tokens").notNull().default(0), // One-time purchased tokens (never expire)
  subscriptionTier: text("subscription_tier"), // null (none), 'basic' ($5/month for 10k tokens), 'premium' ($20/month for 50k tokens)
  subscriptionStatus: text("subscription_status"), // 'active', 'canceled', 'past_due', null
  tokensResetDate: timestamp("tokens_reset_date"), // When subscription tokens reset
  stripeCustomerId: text("stripe_customer_id").unique(), // For subscription management
  stripeSubscriptionId: text("stripe_subscription_id").unique(), // Current subscription ID
  demoProfilesCreated: boolean("demo_profiles_created").notNull().default(false), // Track if demo profiles were created
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Gift recipient profiles - represents a PERSON (Mom, Dad, Sarah, etc.)
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Person's name (e.g., "Mom", "Dad", "Sarah")
  color: text("color").notNull().default('#3B82F6'), // Profile card color (hex or preset key)
  
  // Questionnaire fields - all optional until questionnaire is completed
  ageRange: text("age_range"), // 'Child (0-12)', 'Teen (13-19)', 'Young Adult (20-30)', 'Adult 1 (31-50)', 'Adult 2 (51-70)', 'Senior 70+'
  gender: text("gender"), // 'Male', 'Female', or custom text if 'Other'
  personalityTraits: text("personality_traits").array().default(sql`ARRAY[]::text[]`), // Multi-select: Adventurous, Thoughtful, Other, etc.
  interests: text("interests"), // Hobbies and interests (text field)
  relationship: text("relationship"), // Partner, Family, Friend, Coworker, Acquaintance, Classmate
  closeness: text("closeness"), // Very close, Somewhat close, Casual
  budget: text("budget"), // Under $25, $25-$50, $50-$100, $100-$500, $500-$1,000, $1,000+, $10,000+
  giftPreferences: text("gift_preferences").array().default(sql`ARRAY[]::text[]`), // Multi-select: Practical, Sentimental, Experiences, Funny/novelty
  dislikes: text("dislikes"), // No-go areas (text field)
  giftStyle: text("gift_style"), // 'unique-thoughtful' or 'safe-popular'
  location: text("location"), // City/country
  additionalNotes: text("additional_notes"), // Extra context (2000 char limit)
  
  // Important dates for this person
  birthdayDate: text("birthday_date"), // MM-DD format (e.g., "12-25")
  anniversaryDate: text("anniversary_date"), // MM-DD format (e.g., "06-15")
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chat messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // In cents
  tokens: integer("tokens").notNull(), // Tokens purchased
  type: text("type").notNull(), // 'one-time', 'subscription'
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  status: text("status").notNull(), // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Manual idea structure for storing in manualIdeasJson
export const manualIdeaSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number(),
  purchased: z.boolean().default(false),
  createdAt: z.string(),
});

export type ManualIdea = z.infer<typeof manualIdeaSchema>;

// Gift lists - represents an OCCASION for a person (Birthday, Christmas, General, etc.)
export const giftLists = pgTable("gift_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // Occasion name (e.g., "Birthday", "Christmas", "General")
  eventDate: timestamp("event_date"), // Optional date of the event/occasion
  // Manual gift ideas (free feature) - legacy string array
  manualIdeas: text("manual_ideas").array().notNull().default(sql`ARRAY[]::text[]`),
  // Manual gift ideas as JSON with order and purchased status
  manualIdeasJson: jsonb("manual_ideas_json").$type<ManualIdea[]>().default([]),
  // AI-generated gift ideas (premium feature)
  premiumResults: text("premium_results"), // JSON string of premium AI results: Array<{id, title, reason, createdAt}>
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});


// Relations
export const usersRelations = relations(users, ({ many }) => ({
  profiles: many(profiles),
  transactions: many(transactions),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  messages: many(messages),
  giftLists: many(giftLists),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  profile: one(profiles, {
    fields: [messages.profileId],
    references: [profiles.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const giftListsRelations = relations(giftLists, ({ one }) => ({
  profile: one(profiles, {
    fields: [giftLists.profileId],
    references: [profiles.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  tokens: true,
  subscriptionTier: true,
  subscriptionStatus: true,
  tokensResetDate: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  createdAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  personalityTraits: true,
  giftPreferences: true,
}).extend({
  name: z.string().min(1).max(20), // 20 character limit for profile names
  color: z.string().optional(), // Hex color or preset key
  
  // Questionnaire fields - all optional
  ageRange: z.enum(['Child (0-12)', 'Teen (13-19)', 'Young Adult (20-30)', 'Adult 1 (31-50)', 'Adult 2 (51-70)', 'Senior 70+']).optional(),
  gender: z.string().max(500).optional(), // Male, Female, or custom text (500 char limit for custom)
  personalityTraits: z.array(z.enum(['Adventurous', 'Thoughtful', 'Funny/Lighthearted', 'Introverted', 'Outgoing', 'Artistic', 'Tech-savvy', 'Sentimental', 'Other'])).optional(),
  interests: z.string().max(500).optional(), // Text field for interests
  relationship: z.enum(['Partner', 'Family', 'Friend', 'Coworker', 'Acquaintance', 'Classmate']).optional(),
  closeness: z.enum(['Very close', 'Somewhat close', 'Casual']).optional(),
  budget: z.enum(['Under $25', '$25-$50', '$50-$100', '$100-$500', '$500-$1,000', '$1,000+', '$10,000+']).optional(),
  giftPreferences: z.array(z.enum(['Practical gifts', 'Sentimental/personalized gifts', 'Experiences', 'Funny/novelty items'])).optional(),
  dislikes: z.string().max(500).optional(), // No-go areas
  giftStyle: z.enum(['unique-thoughtful', 'safe-popular']).optional(),
  location: z.string().max(500).optional(), // City/country
  additionalNotes: z.string().max(2000).optional(), // Extra context
  
  // Important dates
  birthdayDate: z.string().regex(/^\d{2}-\d{2}$/).optional(), // MM-DD format
  anniversaryDate: z.string().regex(/^\d{2}-\d{2}$/).optional(), // MM-DD format
});

// Premium result type for storing in premiumResults JSON
export const premiumResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  reason: z.string(),
  createdAt: z.string(),
});

export type PremiumResult = z.infer<typeof premiumResultSchema>;

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(5000), // Character limit
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertGiftListSchema = createInsertSchema(giftLists).omit({
  id: true,
  manualIdeas: true,
  premiumResults: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1).max(20), // 20 character limit for list names
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert; // For Replit Auth upsert

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type GiftList = typeof giftLists.$inferSelect;
export type InsertGiftList = z.infer<typeof insertGiftListSchema>;
