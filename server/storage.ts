// Database storage implementation - referenced from javascript_database blueprint
import { users, profiles, messages, transactions, giftLists, type User, type InsertUser, type UpsertUser, type Profile, type InsertProfile, type Message, type InsertMessage, type Transaction, type InsertTransaction, type GiftList, type InsertGiftList } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>; // For Replit Auth
  updateUserTokens(id: string, tokens: number): Promise<User>;

  // Profiles
  getProfilesByUserId(userId: string): Promise<Profile[]>;
  getProfile(id: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile>;
  deleteProfile(id: string): Promise<void>;

  // Messages
  getMessagesByProfileId(profileId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string): Promise<Transaction>;

  // Gift Lists
  getGiftListsByProfileId(profileId: string): Promise<GiftList[]>;
  getGiftList(id: string): Promise<GiftList | undefined>;
  createGiftList(list: InsertGiftList): Promise<GiftList>;
  updateGiftList(id: string, updates: Partial<GiftList>): Promise<GiftList>;
  deleteGiftList(id: string): Promise<void>;
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
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

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values({
        ...insertProfile,
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
  async getGiftListsByProfileId(profileId: string): Promise<GiftList[]> {
    return await db
      .select()
      .from(giftLists)
      .where(eq(giftLists.profileId, profileId))
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

  async updateGiftList(id: string, updates: Partial<GiftList>): Promise<GiftList> {
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
}

export const storage = new DatabaseStorage();
