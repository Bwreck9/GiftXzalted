// Database storage implementation - referenced from javascript_database blueprint
import { users, profiles, messages, transactions, giftLists, type User, type InsertUser, type UpsertUser, type Profile, type InsertProfile, type Message, type InsertMessage, type Transaction, type InsertTransaction, type GiftList, type InsertGiftList } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

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
    // First check if user exists by email (in case Replit ID changed)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email));

    if (existingUser && existingUser.id !== userData.id) {
      // User exists with different ID - need to migrate to new ID
      // Strategy: temporarily change email, create new user, migrate profiles, delete old
      
      const tempEmail = `temp_${Date.now()}_${existingUser.email}`;
      
      // Step 1: Change old user's email to temp value to avoid duplicate constraint
      await db
        .update(users)
        .set({ email: tempEmail })
        .where(eq(users.id, existingUser.id));
      
      // Step 2: Create the new user with correct email
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      
      // Step 3: Update all profiles to point to the new user ID
      await db
        .update(profiles)
        .set({ userId: userData.id })
        .where(eq(profiles.userId, existingUser.id));
      
      // Step 4: Delete the old user record
      await db.delete(users).where(eq(users.id, existingUser.id));
      
      // Create demo profiles for new users (one-time only)
      await this.maybeCreateDemoProfiles(newUser.id);
      
      // Re-fetch user to get updated demoProfilesCreated flag
      const [updatedNewUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, newUser.id));
      
      return updatedNewUser;
    }

    // Normal upsert by ID
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Create demo profiles for new users (one-time only)
    await this.maybeCreateDemoProfiles(user.id);
    
    // Re-fetch user to get updated demoProfilesCreated flag
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    
    return updatedUser;
  }

  private async maybeCreateDemoProfiles(userId: string): Promise<void> {
    // Use transaction to ensure atomicity and prevent race conditions
    await db.transaction(async (tx) => {
      // Atomically claim the demo creation operation
      // This UPDATE will only succeed if flag is still false (preventing concurrent duplicates)
      const claimResult = await tx
        .update(users)
        .set({ demoProfilesCreated: true })
        .where(and(eq(users.id, userId), eq(users.demoProfilesCreated, false)))
        .returning();
      
      if (claimResult.length === 0) {
        // Another transaction already claimed this or flag was already true
        return;
      }
      
      // We claimed it! Now check if user has any existing profiles
      const existingProfiles = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId));
      
      if (existingProfiles.length > 0) {
        // Existing user with profiles - flag is already set, just skip demo creation
        return;
      }
      
      // Check if demo profiles already exist (defensive guard)
      const existingDemoProfiles = await tx
        .select()
        .from(profiles)
        .where(and(
          eq(profiles.userId, userId),
          sql`${profiles.name} IN ('Demo: Girlfriend', 'Demo: Wife')`
        ));
      
      if (existingDemoProfiles.length > 0) {
        // Demo profiles already exist, skip creation
        return;
      }
      
      // New user with no profiles - create demo profiles
      const [girlfriendProfile] = await tx
        .insert(profiles)
        .values({
          userId,
          name: 'Demo: Girlfriend',
          color: '#EC4899', // Pink
          ageRange: 'Young Adult (20-30)',
          gender: 'Female',
          personalityTraits: ['Thoughtful', 'Sentimental'],
          interests: 'fashion, coffee, photography, reading',
          relationship: 'Partner',
          closeness: 'Very close',
          budget: '$50-$100',
          giftPreferences: ['Sentimental/personalized gifts', 'Experiences'],
          giftStyle: 'unique-thoughtful',
        })
        .returning();

      const [wifeProfile] = await tx
        .insert(profiles)
        .values({
          userId,
          name: 'Demo: Wife',
          color: '#A855F7', // Purple
          ageRange: 'Adult 1 (31-50)',
          gender: 'Female',
          personalityTraits: ['Thoughtful', 'Artistic'],
          interests: 'cooking, yoga, gardening, travel',
          relationship: 'Partner',
          closeness: 'Very close',
          budget: '$100-$500',
          giftPreferences: ['Sentimental/personalized gifts', 'Practical gifts'],
          giftStyle: 'unique-thoughtful',
        })
        .returning();

      // Create demo gift lists
      await tx.insert(giftLists).values({
        profileId: girlfriendProfile.id,
        title: 'Birthday',
      });

      await tx.insert(giftLists).values({
        profileId: wifeProfile.id,
        title: 'Anniversary',
      });
    });
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
