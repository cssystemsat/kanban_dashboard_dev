import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de e-mails autorizados a lançar atendimentos
export const allowedEmails = mysqlTable("allowed_emails", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  label: text("label"), // nome/descrição opcional
  isAdmin: int("isAdmin").default(0).notNull(), // 1 = pode acessar Configurações
  canLaunch: int("canLaunch").default(1).notNull(), // 1 = pode lançar atendimentos
  // JSON array de IDs de abas permitidas, ex: ["dashboard","marcos","ongoing"]
  // null = acesso a todas as abas (comportamento padrão para admins)
  allowedPages: text("allowedPages"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AllowedEmail = typeof allowedEmails.$inferSelect;
export type InsertAllowedEmail = typeof allowedEmails.$inferInsert;

// Tabela de checklists (criados por usuários ou admins)
export const checklists = mysqlTable("checklists", {
  id: int("id").autoincrement().primaryKey(),
  ownerEmail: varchar("ownerEmail", { length: 320 }).notNull(), // e-mail do criador
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isAdminChecklist: int("isAdminChecklist").default(0).notNull(), // 1 = criado por admin, visível para todos
  resetType: varchar("resetType", { length: 32 }).default("daily").notNull(), // "daily" | "manual" | "none" | "unique"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = typeof checklists.$inferInsert;

// Itens de um checklist
export const checklistItems = mysqlTable("checklist_items", {
  id: int("id").autoincrement().primaryKey(),
  checklistId: int("checklistId").notNull(),
  text: varchar("text", { length: 500 }).notNull(),
  order: int("order").default(0).notNull(),
  dueDate: varchar("dueDate", { length: 10 }), // "YYYY-MM-DD" para tipo "unique"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;

// Histórico de versões de itens (para rastrear alterações)
export const checklistItemHistory = mysqlTable("checklist_item_history", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  previousText: varchar("previousText", { length: 500 }).notNull(),
  previousDueDate: varchar("previousDueDate", { length: 10 }),
  changedBy: varchar("changedBy", { length: 320 }).notNull(), // e-mail do usuário
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type ChecklistItemHistory = typeof checklistItemHistory.$inferSelect;
export type InsertChecklistItemHistory = typeof checklistItemHistory.$inferInsert;

// Completions: registro de quais itens foram marcados por qual usuário e em qual data
export const checklistCompletions = mysqlTable("checklist_completions", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  completedDate: varchar("completedDate", { length: 10 }).notNull(), // "YYYY-MM-DD" (UTC-3)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChecklistCompletion = typeof checklistCompletions.$inferSelect;
export type InsertChecklistCompletion = typeof checklistCompletions.$inferInsert;

// Sessões de usuário: login/logout e tempo ativo
export const userSessions = mysqlTable("user_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  userName: text("userName"),
  loginAt: timestamp("loginAt").defaultNow().notNull(),
  logoutAt: timestamp("logoutAt"),
  durationSeconds: int("durationSeconds"), // preenchido ao fazer logout ou heartbeat
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

// Visualizações de página por usuário
export const pageViews = mysqlTable("page_views", {
  id: int("id").autoincrement().primaryKey(),
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  page: varchar("page", { length: 128 }).notNull(), // ex: "marcos", "ongoing", "dashboard"
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  sessionId: int("sessionId"), // FK para user_sessions
});

export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;

// Ações realizadas por usuário (atendimentos lançados, checklists completados, etc.)
export const userActions = mysqlTable("user_actions", {
  id: int("id").autoincrement().primaryKey(),
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  actionType: varchar("actionType", { length: 64 }).notNull(), // ex: "atendimento_gravado", "checklist_item_completed"
  description: text("description"), // detalhes da ação
  metadata: text("metadata"), // JSON com dados extras
  performedAt: timestamp("performedAt").defaultNow().notNull(),
  sessionId: int("sessionId"),
});

export type UserAction = typeof userActions.$inferSelect;
export type InsertUserAction = typeof userActions.$inferInsert;
// Comentários sobre clientes no painel de Evolução de UR's
export const clientComments = mysqlTable("client_comments", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  comment: text("comment").notNull(),
  monthYear: varchar("monthYear", { length: 7 }).notNull(), // "YYYY-MM" para separar por mês
  authorEmail: varchar("authorEmail", { length: 320 }),
  authorName: text("authorName"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientComment = typeof clientComments.$inferSelect;
export type InsertClientComment = typeof clientComments.$inferInsert;
