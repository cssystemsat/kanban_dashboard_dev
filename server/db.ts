import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, InsertAllowedEmail, allowedEmails, users,
  checklists, checklistItems, checklistCompletions,
  InsertChecklist, InsertChecklistItem,
} from "../drizzle/schema";
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

export async function getEmailEntry(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(allowedEmails).where(eq(allowedEmails.email, email.toLowerCase())).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ---- Checklist helpers ----

export async function getChecklistsForUser(userEmail: string, isAdmin: boolean) {
  const db = await getDb();
  if (!db) return [];
  // Retorna: checklists próprios + checklists de admin (se não for o próprio admin)
  const all = await db.select().from(checklists);
  return all.filter(c =>
    c.ownerEmail === userEmail ||
    (c.isAdminChecklist === 1 && c.ownerEmail !== userEmail)
  );
}

export async function getChecklistById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(checklists).where(eq(checklists.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createChecklist(data: InsertChecklist) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const result = await db.insert(checklists).values(data);
  return result[0].insertId;
}

export async function updateChecklist(id: number, data: Partial<InsertChecklist>) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.update(checklists).set(data).where(eq(checklists.id, id));
}

export async function deleteChecklist(id: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  // Deletar completions e itens antes
  const items = await db.select().from(checklistItems).where(eq(checklistItems.checklistId, id));
  for (const item of items) {
    await db.delete(checklistCompletions).where(eq(checklistCompletions.itemId, item.id));
  }
  await db.delete(checklistItems).where(eq(checklistItems.checklistId, id));
  await db.delete(checklists).where(eq(checklists.id, id));
}

export async function getItemsByChecklist(checklistId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistItems).where(eq(checklistItems.checklistId, checklistId));
}

export async function addChecklistItem(data: InsertChecklistItem) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const result = await db.insert(checklistItems).values(data);
  return result[0].insertId;
}

export async function updateChecklistItem(id: number, data: Partial<InsertChecklistItem>) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.update(checklistItems).set(data).where(eq(checklistItems.id, id));
}

export async function deleteChecklistItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.delete(checklistCompletions).where(eq(checklistCompletions.itemId, id));
  await db.delete(checklistItems).where(eq(checklistItems.id, id));
}

export async function getCompletionsForUser(userEmail: string, date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistCompletions)
    .where(and(
      eq(checklistCompletions.userEmail, userEmail),
      eq(checklistCompletions.completedDate, date)
    ));
}

export async function toggleCompletion(itemId: number, userEmail: string, date: string, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  if (completed) {
    // Inserir se não existir
    const existing = await db.select().from(checklistCompletions)
      .where(and(
        eq(checklistCompletions.itemId, itemId),
        eq(checklistCompletions.userEmail, userEmail),
        eq(checklistCompletions.completedDate, date)
      )).limit(1);
    if (existing.length === 0) {
      await db.insert(checklistCompletions).values({ itemId, userEmail, completedDate: date });
    }
  } else {
    await db.delete(checklistCompletions)
      .where(and(
        eq(checklistCompletions.itemId, itemId),
        eq(checklistCompletions.userEmail, userEmail),
        eq(checklistCompletions.completedDate, date)
      ));
  }
}
