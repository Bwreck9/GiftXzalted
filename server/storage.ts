// Database storage implementation - referenced from javascript_database blueprint
import { users, profiles, messages, transactions, giftLists, giftItems, type User, type InsertUser, type Profile, type InsertProfile, type Message, type InsertMessage, type Transaction, type InsertTransaction, type GiftList, type InsertGiftList, type GiftItem, type InsertGiftItem } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(id: string, tokens: number): Promise<User>;

  // Profiles
  getProfilesByUserId(userId: string): Promise<Profile[]>;
  getProfile(id: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile, aiResponse?: string): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile>;
  deleteProfile(id: string): Promise<void>;

  // Messages
  getMessagesByProfileId(profileId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string): Promise<Transaction>;

  // Gift Lists
  getGiftListsByUserId(userId: string): Promise<GiftList[]>;
  getGiftList(id: string): Promise<GiftList | undefined>;
  createGiftList(list: InsertGiftList): Promise<GiftList>;
  updateGiftList(id: string, updates: Partial<InsertGiftList>): Promise<GiftList>;
  deleteGiftList(id: string): Promise<void>;

  // Gift Items
  getGiftItemsByListId(listId: string): Promise<GiftItem[]>;
  createGiftItem(item: InsertGiftItem): Promise<GiftItem>;
  updateGiftItem(id: string, updates: Partial<InsertGiftItem>): Promise<GiftItem>;
  deleteGiftItem(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { id?: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser as any)
      .returning();
    return user;
  }

  async updateUserTokens(id: string, tokens: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ tokens })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Profiles
  async getProfilesByUserId(userId: string): Promise<Profile[]> {
    return await db.select().from(profiles).where(eq(profiles.userId, userId));
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile || undefined;
  }

  async createProfile(insertProfile: InsertProfile, aiResponse?: string): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values({
        ...insertProfile,
        aiResponse: aiResponse || null,
        updatedAt: new Date(),
      })
      .returning();
    return profile;
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile> {
    const [profile] = await db
      .update(profiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
      .returning();
    return profile;
  }

  async deleteProfile(id: string): Promise<void> {
    await db.delete(profiles).where(eq(profiles.id, id));
  }

  // Messages
  async getMessagesByProfileId(profileId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.profileId, profileId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  // Transactions
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateTransactionStatus(id: string, status: string): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({ status })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  // Gift Lists
  async getGiftListsByUserId(userId: string): Promise<GiftList[]> {
    return await db
      .select()
      .from(giftLists)
      .where(eq(giftLists.userId, userId))
      .orderBy(desc(giftLists.updatedAt));
  }

  async getGiftList(id: string): Promise<GiftList | undefined> {
    const [list] = await db.select().from(giftLists).where(eq(giftLists.id, id));
    return list || undefined;
  }

  async createGiftList(insertList: InsertGiftList): Promise<GiftList> {
    const [list] = await db
      .insert(giftLists)
      .values({
        ...insertList,
        updatedAt: new Date(),
      })
      .returning();
    return list;
  }

  async updateGiftList(id: string, updates: Partial<InsertGiftList>): Promise<GiftList> {
    const [list] = await db
      .update(giftLists)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(giftLists.id, id))
      .returning();
    return list;
  }

  async deleteGiftList(id: string): Promise<void> {
    await db.delete(giftLists).where(eq(giftLists.id, id));
  }

  // Gift Items
  async getGiftItemsByListId(listId: string): Promise<GiftItem[]> {
    return await db
      .select()
      .from(giftItems)
      .where(eq(giftItems.listId, listId))
      .orderBy(giftItems.order, giftItems.createdAt);
  }

  async createGiftItem(insertItem: InsertGiftItem): Promise<GiftItem> {
    const [item] = await db
      .insert(giftItems)
      .values({
        ...insertItem,
        updatedAt: new Date(),
      })
      .returning();
    return item;
  }

  async updateGiftItem(id: string, updates: Partial<InsertGiftItem>): Promise<GiftItem> {
    const [item] = await db
      .update(giftItems)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(giftItems.id, id))
      .returning();
    return item;
  }

  async deleteGiftItem(id: string): Promise<void> {
    await db.delete(giftItems).where(eq(giftItems.id, id));
  }
}

export const storage = new DatabaseStorage();
