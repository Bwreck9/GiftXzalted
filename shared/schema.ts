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
  tokens: integer("tokens").notNull().default(0), // AI generation tokens
  subscriptionTier: text("subscription_tier"), // null (none), 'basic' ($5/month for 10k tokens), 'premium' ($20/month for 50k tokens)
  subscriptionStatus: text("subscription_status"), // 'active', 'canceled', 'past_due', null
  tokensResetDate: timestamp("tokens_reset_date"), // When subscription tokens reset
  stripeCustomerId: text("stripe_customer_id").unique(), // For subscription management
  stripeSubscriptionId: text("stripe_subscription_id").unique(), // Current subscription ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Gift recipient profiles (gift lists)
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default('#3B82F6'), // Profile card color (hex or preset key)
  shoppingFor: text("shopping_for"), // 'self' or 'another' - optional until questionnaire filled
  age: integer("age"), // Optional until questionnaire filled
  event: text("event"), // Birthday, Anniversary, Christmas, Valentine's Day, Other - optional
  gender: text("gender"), // Optional until questionnaire filled
  relationship: text("relationship"), // Only if shoppingFor is 'another'
  personality: text("personality"), // Optional until questionnaire filled
  interests: text("interests"), // Optional until questionnaire filled
  manualIdeas: text("manual_ideas").array().notNull().default(sql`ARRAY[]::text[]`), // Free manual notes/ideas as array
  premiumResults: text("premium_results"), // JSON string of premium AI results: Array<{id, title, reason, createdAt}>
  aiResponse: text("ai_response"), // Legacy field - keeping for backward compatibility
  manualNotes: text("manual_notes"), // Legacy field - keeping for backward compatibility
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

// Gift lists (free feature - user's custom gift idea lists)
export const giftLists = pgTable("gift_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Gift items (individual items within a gift list)
export const giftItems = pgTable("gift_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listId: varchar("list_id").notNull().references(() => giftLists.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  profiles: many(profiles),
  transactions: many(transactions),
  giftLists: many(giftLists),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  messages: many(messages),
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

export const giftListsRelations = relations(giftLists, ({ one, many }) => ({
  user: one(users, {
    fields: [giftLists.userId],
    references: [users.id],
  }),
  items: many(giftItems),
}));

export const giftItemsRelations = relations(giftItems, ({ one }) => ({
  list: one(giftLists, {
    fields: [giftItems.listId],
    references: [giftLists.id],
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
  manualIdeas: true,
  premiumResults: true,
  aiResponse: true,
  manualNotes: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  color: z.string().optional(), // Hex color or preset key
  age: z.number().min(1).max(120).optional(), // Optional until questionnaire filled
  shoppingFor: z.enum(['self', 'another']).optional(), // Optional until questionnaire filled
  event: z.enum(['Birthday', 'Anniversary', 'Christmas', "Valentine's Day", 'Other']).optional(), // Optional until questionnaire filled
  gender: z.string().optional(), // Optional until questionnaire filled
  relationship: z.string().optional(), // Optional until questionnaire filled
  personality: z.string().min(1).max(1000).optional(), // Optional until questionnaire filled
  interests: z.string().min(1).max(1000).optional(), // Optional until questionnaire filled
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
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(1).max(200),
});

export const insertGiftItemSchema = createInsertSchema(giftItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  text: z.string().min(1).max(500),
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

export type GiftItem = typeof giftItems.$inferSelect;
export type InsertGiftItem = z.infer<typeof insertGiftItemSchema>;
