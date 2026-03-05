import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertAllowedEmail, allowedEmails, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ---- Allowed Emails helpers ----

export async function getAllowedEmails() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(allowedEmails).orderBy(allowedEmails.email);
}

export async function isEmailAllowed(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(allowedEmails).where(eq(allowedEmails.email, email.toLowerCase())).limit(1);
  return result.length > 0;
}

export async function isEmailAdmin(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(allowedEmails).where(eq(allowedEmails.email, email.toLowerCase())).limit(1);
  return result.length > 0 && result[0].isAdmin === 1;
}

export async function addAllowedEmail(data: InsertAllowedEmail) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.insert(allowedEmails).values({ ...data, email: data.email.toLowerCase() });
}

export async function updateAllowedEmail(id: number, data: Partial<InsertAllowedEmail>) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.update(allowedEmails).set(data).where(eq(allowedEmails.id, id));
}

export async function deleteAllowedEmail(id: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.delete(allowedEmails).where(eq(allowedEmails.id, id));
}
