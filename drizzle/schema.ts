import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, boolean } from "drizzle-orm/mysql-core";

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
  canMoveAppKanban: int("canMoveAppKanban").default(0).notNull(), // 1 = pode mover cards no App Personalizado
  onlyAppKanban: int("onlyAppKanban").default(0).notNull(), // 1 = vê apenas a aba App Personalizado
  lastDailyAlertSeen: date("lastDailyAlertSeen"), // data do ultimo aviso diario visto
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;

// Histórico de versões de itens (para rastrear alterações)
export const checklistItemHistory = mysqlTable("checklist_item_history", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  previousText: varchar("previousText", { length: 500 }).notNull(),

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

// Tabela de migrações para controlar movimentações de dados
export const migrations = mysqlTable("migrations", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["planejamento", "em_progresso", "concluido", "cancelado"]).default("planejamento").notNull(),
  sourceSystem: varchar("sourceSystem", { length: 128 }), // Sistema de origem
  targetSystem: varchar("targetSystem", { length: 128 }), // Sistema de destino
  estimatedRecords: int("estimatedRecords"), // Quantidade estimada de registros
  processedRecords: int("processedRecords").default(0), // Quantidade processada
  owner: varchar("owner", { length: 320 }), // E-mail do responsável
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  priority: mysqlEnum("priority", ["baixa", "media", "alta"]).default("media").notNull(),
  notes: text("notes"), // Notas adicionais
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Migration = typeof migrations.$inferSelect;
export type InsertMigration = typeof migrations.$inferInsert;

// Tabela de veículos migrados para cada migração
export const migratedVehicles = mysqlTable("migrated_vehicles", {
  id: int("id").autoincrement().primaryKey(),
  migrationId: int("migrationId").notNull(), // FK para migrations
  status: mysqlEnum("status", ["enviar", "enviado", "aguardando", "comunicou"]).default("enviar").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  vehicleName: varchar("vehicleName", { length: 255 }).notNull(),
  model: varchar("model", { length: 128 }),
  vehicleId: varchar("vehicleId", { length: 128 }).notNull(), // ID do veículo
  apn: varchar("apn", { length: 128 }),
  apnLogin: varchar("apnLogin", { length: 128 }),
  apnPassword: varchar("apnPassword", { length: 128 }),
  command: text("command"), // Comando a ser enviado
  lineNumber: varchar("lineNumber", { length: 64 }), // Número da linha/chip
  sentAt: timestamp("sentAt"), // Quando foi enviado
  communicatedAt: timestamp("communicatedAt"), // Quando comunicou
  notes: text("notes"), // Notas adicionais
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MigratedVehicle = typeof migratedVehicles.$inferSelect;
export type InsertMigratedVehicle = typeof migratedVehicles.$inferInsert;

// Tabela de empresas no Kanban de App Personalizado
export const appKanbanCards = mysqlTable("app_kanban_cards", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  csm: varchar("csm", { length: 255 }).notNull(),
  comercial: varchar("comercial", { length: 255 }).notNull(),
  startDate: date("startDate").notNull(),
  stage: mysqlEnum("stage", [
    "venda_feita",
    "formulario",
    "revisao_dados",
    "desenvolvimento",
    "envio_lojas",
    "teste_liberacao",
    "app_entregue"
  ]).default("venda_feita").notNull(),
  order: int("order").default(0).notNull(), // Para ordenação dentro de cada etapa
  priority: int("priority").default(0).notNull(), // Prioridade (1 até N) apenas para estágio "desenvolvimento"
  refusalReason: text("refusalReason"), // Motivo da recusa quando em "teste_liberacao"
  createdBy: varchar("createdBy", { length: 320 }).notNull(), // E-mail do admin que criou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppKanbanCard = typeof appKanbanCards.$inferSelect;
export type InsertAppKanbanCard = typeof appKanbanCards.$inferInsert;

// Tabela de histórico de movimentações de cards
export const appKanbanHistory = mysqlTable("app_kanban_history", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(), // FK para app_kanban_cards
  fromStage: varchar("fromStage", { length: 64 }).notNull(),
  toStage: varchar("toStage", { length: 64 }).notNull(),
  movedBy: varchar("movedBy", { length: 320 }).notNull(), // E-mail do usuário
  movedAt: timestamp("movedAt").defaultNow().notNull(),
});

export type AppKanbanHistory = typeof appKanbanHistory.$inferSelect;
export type InsertAppKanbanHistory = typeof appKanbanHistory.$inferInsert;

// Tabela de checklist do App Personalizado
export const appKanbanChecklist = mysqlTable("app_kanban_checklist", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(), // FK para app_kanban_cards
  logomarca: boolean("logomarca").default(false).notNull(),
  descricaoCurta: boolean("descricaoCurta").default(false).notNull(),
  descricaoLonga: boolean("descricaoLonga").default(false).notNull(),
  politicaPrivacidade: boolean("politicaPrivacidade").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppKanbanChecklist = typeof appKanbanChecklist.$inferSelect;
export type InsertAppKanbanChecklist = typeof appKanbanChecklist.$inferInsert;

// Tabela para rastrear reconhecimento diário de perdas de URs
export const dailyLossesAcknowledgments = mysqlTable("daily_losses_acknowledgments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK para users
  acknowledgedDate: date("acknowledgedDate").notNull(), // data do reconhecimento (YYYY-MM-DD)
  acknowledgedAt: timestamp("acknowledgedAt").defaultNow().notNull(), // timestamp do reconhecimento
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyLossesAcknowledgment = typeof dailyLossesAcknowledgments.$inferSelect;
export type InsertDailyLossesAcknowledgment = typeof dailyLossesAcknowledgments.$inferInsert;

// Tabela de pontuação atual e histórico dos analistas para o ranking
export const analystScores = mysqlTable("analyst_scores", {
  id: int("id").autoincrement().primaryKey(),
  analystName: varchar("analystName", { length: 128 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(), // 'onboarding' | 'ongoing' | 'geral'
  yearMonth: varchar("yearMonth", { length: 7 }).notNull(), // 'YYYY-MM'
  score: int("score").default(100).notNull(),
  penaltiesJson: text("penaltiesJson").notNull(), // JSON com histórico de penalizações e motivos (ex: [{date, points, reason}])
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnalystScore = typeof analystScores.$inferSelect;
export type InsertAnalystScore = typeof analystScores.$inferInsert;

export const analystScoreHistory = mysqlTable("analyst_score_history", {
  id: int("id").autoincrement().primaryKey(),
  analystName: varchar("analystName", { length: 128 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  yearMonth: varchar("yearMonth", { length: 7 }).notNull(), // mês fechado (YYYY-MM)
  finalScore: int("finalScore").notNull(),
  penaltiesJson: text("penaltiesJson").notNull(),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type AnalystScoreHistory = typeof analystScoreHistory.$inferSelect;
export type InsertAnalystScoreHistory = typeof analystScoreHistory.$inferInsert;

// Registra os IDs dos jobs automáticos responsáveis pelo ranking
export const analystScoreSchedules = mysqlTable("analyst_score_schedules", {
  id: int("id").autoincrement().primaryKey(),
  jobType: varchar("jobType", { length: 32 }).notNull(), // 'weekly_penalty' | 'monthly_reset'
  taskUid: varchar("taskUid", { length: 65 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnalystScoreSchedule = typeof analystScoreSchedules.$inferSelect;
export type InsertAnalystScoreSchedule = typeof analystScoreSchedules.$inferInsert;
