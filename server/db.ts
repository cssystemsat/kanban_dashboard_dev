import { and, eq, desc, asc, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, InsertAllowedEmail, allowedEmails, users,
  checklists, checklistItems, checklistCompletions,
  InsertChecklist, InsertChecklistItem,
  userSessions, pageViews, userActions,
  InsertUserSession, InsertPageView, InsertUserAction,
  clientComments, InsertClientComment,
  appKanbanCards, appKanbanHistory, appKanbanChecklist,
  InsertAppKanbanCard, InsertAppKanbanHistory, InsertAppKanbanChecklist,
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

export async function updateLastDailyAlert(email: string) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const today = new Date();
  await db.update(allowedEmails).set({ lastDailyAlertSeen: today }).where(eq(allowedEmails.email, email.toLowerCase()));
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

// ---- Tracking helpers ----

export async function createSession(data: InsertUserSession) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(userSessions).values(data);
  return result[0].insertId as number;
}

export async function closeSession(sessionId: number, logoutAt: Date) {
  const db = await getDb();
  if (!db) return;
  const session = await db.select().from(userSessions).where(eq(userSessions.id, sessionId)).limit(1);
  if (session.length > 0) {
    const loginAt = session[0].loginAt;
    const durationSeconds = Math.floor((logoutAt.getTime() - loginAt.getTime()) / 1000);
    await db.update(userSessions).set({ logoutAt, durationSeconds }).where(eq(userSessions.id, sessionId));
  }
}

export async function heartbeatSession(sessionId: number) {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  const session = await db.select().from(userSessions).where(eq(userSessions.id, sessionId)).limit(1);
  if (session.length > 0) {
    const durationSeconds = Math.floor((now.getTime() - session[0].loginAt.getTime()) / 1000);
    await db.update(userSessions).set({ durationSeconds }).where(eq(userSessions.id, sessionId));
  }
}

export async function recordPageView(data: InsertPageView) {
  const db = await getDb();
  if (!db) return;
  await db.insert(pageViews).values(data);
}

export async function recordUserAction(data: InsertUserAction) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userActions).values(data);
}

// ---- Statistics queries ----

export async function getStatsOverview() {
  const db = await getDb();
  if (!db) return null;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalSessions] = await db.select({ count: sql<number>`count(*)` }).from(userSessions);
  const [activeLast30] = await db.select({ count: sql<number>`count(distinct ${userSessions.userEmail})` })
    .from(userSessions).where(gte(userSessions.loginAt, thirtyDaysAgo));
  const [totalActions] = await db.select({ count: sql<number>`count(*)` }).from(userActions);
  const [totalPageViews] = await db.select({ count: sql<number>`count(*)` }).from(pageViews);

  return {
    totalSessions: totalSessions.count,
    activeUsersLast30Days: activeLast30.count,
    totalActions: totalActions.count,
    totalPageViews: totalPageViews.count,
  };
}

export async function getUserStatsList() {
  const db = await getDb();
  if (!db) return [];

  // Buscar todos os e-mails únicos com sessão
  const sessionRows = await db.select().from(userSessions).orderBy(desc(userSessions.loginAt));
  const actionRows = await db.select().from(userActions);
  const pageViewRows = await db.select().from(pageViews);

  // Agrupar por e-mail
  const map = new Map<string, {
    email: string; name: string | null;
    totalSessions: number; totalDurationSeconds: number;
    lastLogin: Date | null; totalActions: number; totalPageViews: number;
    pageBreakdown: Record<string, number>; actionBreakdown: Record<string, number>;
  }>();

  for (const s of sessionRows) {
    const e = s.userEmail;
    if (!map.has(e)) map.set(e, { email: e, name: s.userName ?? null, totalSessions: 0, totalDurationSeconds: 0, lastLogin: null, totalActions: 0, totalPageViews: 0, pageBreakdown: {}, actionBreakdown: {} });
    const u = map.get(e)!;
    u.totalSessions++;
    u.totalDurationSeconds += s.durationSeconds ?? 0;
    if (!u.lastLogin || s.loginAt > u.lastLogin) u.lastLogin = s.loginAt;
  }

  for (const a of actionRows) {
    const e = a.userEmail;
    if (!map.has(e)) map.set(e, { email: e, name: null, totalSessions: 0, totalDurationSeconds: 0, lastLogin: null, totalActions: 0, totalPageViews: 0, pageBreakdown: {}, actionBreakdown: {} });
    const u = map.get(e)!;
    u.totalActions++;
    u.actionBreakdown[a.actionType] = (u.actionBreakdown[a.actionType] ?? 0) + 1;
  }

  for (const p of pageViewRows) {
    const e = p.userEmail;
    if (!map.has(e)) map.set(e, { email: e, name: null, totalSessions: 0, totalDurationSeconds: 0, lastLogin: null, totalActions: 0, totalPageViews: 0, pageBreakdown: {}, actionBreakdown: {} });
    const u = map.get(e)!;
    u.totalPageViews++;
    u.pageBreakdown[p.page] = (u.pageBreakdown[p.page] ?? 0) + 1;
  }

  return Array.from(map.values()).sort((a, b) => (b.lastLogin?.getTime() ?? 0) - (a.lastLogin?.getTime() ?? 0));
}

export async function getRecentSessions(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userSessions).orderBy(desc(userSessions.loginAt)).limit(limit);
}

export async function getRecentActions(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userActions).orderBy(desc(userActions.performedAt)).limit(limit);
}

export async function getMostVisitedPages() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    page: pageViews.page,
    count: sql<number>`count(*) as count`,
  }).from(pageViews).groupBy(pageViews.page);
  return rows.sort((a, b) => b.count - a.count);
}

// ─── Client Comments (Evolução de UR's) ───

export async function getClientComments(monthYear: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientComments).where(eq(clientComments.monthYear, monthYear));
}

export async function upsertClientComment(data: {
  clientName: string;
  comment: string;
  monthYear: string;
  authorEmail?: string;
  authorName?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  // Check if comment exists for this client+month
  const existing = await db.select().from(clientComments)
    .where(and(
      eq(clientComments.clientName, data.clientName),
      eq(clientComments.monthYear, data.monthYear)
    ));

  if (existing.length > 0) {
    // Update existing
    await db.update(clientComments)
      .set({ comment: data.comment, authorEmail: data.authorEmail, authorName: data.authorName })
      .where(eq(clientComments.id, existing[0].id));
    return { ...existing[0], comment: data.comment };
  } else {
    // Insert new
    const result = await db.insert(clientComments).values({
      clientName: data.clientName,
      comment: data.comment,
      monthYear: data.monthYear,
      authorEmail: data.authorEmail || null,
      authorName: data.authorName || null,
    });
    return { id: result[0].insertId, ...data };
  }
}

export async function deleteClientComment(clientName: string, monthYear: string) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(clientComments).where(
    and(
      eq(clientComments.clientName, clientName),
      eq(clientComments.monthYear, monthYear)
    )
  );
  return true;
}


// ─── App Kanban Cards ───

export async function getAppKanbanCards() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appKanbanCards).orderBy(asc(appKanbanCards.order));
}

export async function getAppKanbanCardsByStage(stage: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appKanbanCards).where(eq(appKanbanCards.stage, stage as any)).orderBy(asc(appKanbanCards.order));
}

export async function createAppKanbanCard(data: InsertAppKanbanCard) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  
  const cardData = {
    ...data,
    stage: 'venda_feita' as const,
    order: 0,
    createdBy: 'system',
  };
  
  const result = await db.insert(appKanbanCards).values(cardData);
  const cardId = result[0].insertId;
  
  // Retornar o card criado
  const cards = await db.select().from(appKanbanCards).where(eq(appKanbanCards.id, cardId));
  return cards[0];
}

export async function updateAppKanbanCard(id: number, data: Partial<InsertAppKanbanCard>) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.update(appKanbanCards).set(data).where(eq(appKanbanCards.id, id));
}

export async function deleteAppKanbanCard(id: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  // Deletar histórico primeiro
  await db.delete(appKanbanHistory).where(eq(appKanbanHistory.cardId, id));
  await db.delete(appKanbanCards).where(eq(appKanbanCards.id, id));
}

export async function moveAppKanbanCard(cardId: number, fromStage: string, toStage: string, movedBy: string, newOrder: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  
  // Atualizar card
  const validStages = ['venda_feita', 'formulario', 'revisao_dados', 'desenvolvimento', 'envio_lojas', 'teste_liberacao', 'app_entregue'];
  const stage = validStages.includes(toStage) ? (toStage as any) : 'venda_feita';
  await db.update(appKanbanCards).set({ stage, order: newOrder }).where(eq(appKanbanCards.id, cardId));
  
  // Registrar no histórico
  await db.insert(appKanbanHistory).values({
    cardId,
    fromStage,
    toStage,
    movedBy,
  });
}

export async function getAppKanbanHistory(cardId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appKanbanHistory).where(eq(appKanbanHistory.cardId, cardId)).orderBy(desc(appKanbanHistory.movedAt));
}

// === App Kanban Checklist ===

export async function getAppKanbanChecklist(cardId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(appKanbanChecklist).where(eq(appKanbanChecklist.cardId, cardId));
  return rows[0] || null;
}

export async function upsertAppKanbanChecklist(cardId: number, data: { logomarca?: boolean; descricaoCurta?: boolean; descricaoLonga?: boolean; politicaPrivacidade?: boolean }) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(appKanbanChecklist).where(eq(appKanbanChecklist.cardId, cardId));
  if (existing.length > 0) {
    await db.update(appKanbanChecklist).set(data).where(eq(appKanbanChecklist.cardId, cardId));
    const updated = await db.select().from(appKanbanChecklist).where(eq(appKanbanChecklist.cardId, cardId));
    return updated[0];
  } else {
    await db.insert(appKanbanChecklist).values({ cardId, logomarca: data.logomarca ?? false, descricaoCurta: data.descricaoCurta ?? false, descricaoLonga: data.descricaoLonga ?? false, politicaPrivacidade: data.politicaPrivacidade ?? false });
    const inserted = await db.select().from(appKanbanChecklist).where(eq(appKanbanChecklist.cardId, cardId));
    return inserted[0];
  }
}
