import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { appendAtendimento, updateMigracao } from "./googleSheets";
import {
  getAllowedEmails,
  isEmailAllowed,
  isEmailAdmin,
  addAllowedEmail,
  updateAllowedEmail,
  deleteAllowedEmail,
  getEmailEntry,
  getChecklistsForUser,
  getChecklistById,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  getItemsByChecklist,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  getCompletionsForUser,
  toggleCompletion,
  createSession,
  closeSession,
  heartbeatSession,
  recordPageView,
  recordUserAction,
  getStatsOverview,
  getUserStatsList,
  getRecentSessions,
  getRecentActions,
  getMostVisitedPages,
  getClientComments,
  upsertClientComment,
  deleteClientComment,
  getAppKanbanCards,
  getAppKanbanCardsByStage,
  createAppKanbanCard,
  updateAppKanbanCard,
  deleteAppKanbanCard,
  moveAppKanbanCard,
  getAppKanbanHistory,
  getAppKanbanChecklist,
  upsertAppKanbanChecklist,
  markLossesAsAcknowledged,
  checkLossesAcknowledged,
} from "./db";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { appKanbanCards } from "../drizzle/schema";
import { getDb } from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: router({
    ...systemRouter._def.procedures,
    analyzeWithLLM: publicProcedure
      .input(
        z.object({
          systemPrompt: z.string(),
          userMessage: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: input.systemPrompt },
            { role: "user", content: input.userMessage },
          ],
        });
        const content = response.choices?.[0]?.message?.content;
        return typeof content === "string" ? content : "Não foi possível processar a resposta.";
      }),
  }),
  migracao: router({
    atualizar: publicProcedure
      .input(
        z.object({
          empresa: z.string(),
          dataInicio: z.string(),
          levantamentoDados: z.string().optional(),
          envioDados: z.string().optional(),
          situacao: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Verificar se o usuário está autenticado
        if (!ctx.user || !ctx.user.email) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Você precisa estar autenticado para atualizar migrações.' });
        }
        const result = await updateMigracao({
          empresa: input.empresa,
          dataInicio: input.dataInicio,
          levantamentoDados: input.levantamentoDados,
          envioDados: input.envioDados,
          situacao: input.situacao,
        });
        return { success: result.success, row: result.row, sheetName: result.sheetName };
      }),
  }),
  atendimento: router({
    gravar: publicProcedure
      .input(
        z.object({
          cliente: z.string(),
          tipo: z.string(),
          situacao: z.string(),
          razao: z.string(),
          resumo: z.string(),
          duracao: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Verificar se o usuário está autenticado e tem e-mail permitido
        if (!ctx.user || !ctx.user.email) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Você precisa estar autenticado para lançar atendimentos.' });
        }
        const entry = await getEmailEntry(ctx.user.email);
        if (!entry) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado. Seu e-mail não está na lista de usuários autorizados.' });
        }
        if (entry.canLaunch !== 1) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado. Você não tem permissão para lançar atendimentos.' });
        }
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        
        // Normalizar duração para apenas números (minutos)
        const normalizarDuracao = (duracao: string): string => {
          const lower = duracao.toLowerCase().trim();
          
          // Verificar se é em horas
          const horasMatch = lower.match(/(\d+)\s*(horas?|h)/);
          if (horasMatch) {
            const horas = parseInt(horasMatch[1], 10);
            return (horas * 60).toString();
          }
          
          // Verificar se é em minutos
          const minutosMatch = lower.match(/(\d+)\s*(minutos?|min)?/);
          if (minutosMatch) {
            return minutosMatch[1];
          }
          
          return '0';
        };
        
        const result = await appendAtendimento({
          data: dataFormatada,
          cliente: input.cliente,
          tipo: input.tipo,
          situacao: input.situacao,
          razao: input.razao,
          resumo: input.resumo,
          duracao: normalizarDuracao(input.duracao),
          usuario: ctx.user.name ?? ctx.user.email,
        });
        return { success: true, row: result.row, sheetName: result.sheetName };
      }),
    checkPermission: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user || !ctx.user.email) return { allowed: false, isAdmin: false, canLaunch: false };
      const [allowed, admin, entry] = await Promise.all([
        isEmailAllowed(ctx.user.email),
        isEmailAdmin(ctx.user.email),
        getEmailEntry(ctx.user.email),
      ]);
      const canLaunch = entry ? entry.canLaunch === 1 : false;
      return { allowed, isAdmin: admin, canLaunch };
    }),
  }),
  config: router({
    listEmails: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const admin = await isEmailAdmin(ctx.user.email);
      if (!admin) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      return getAllowedEmails();
    }),
    addEmail: publicProcedure
      .input(z.object({ email: z.string().email(), label: z.string().optional(), isAdmin: z.boolean().default(false), canLaunch: z.boolean().default(true), canMoveAppKanban: z.boolean().default(false), onlyAppKanban: z.boolean().default(false) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const admin = await isEmailAdmin(ctx.user.email);
        if (!admin) throw new TRPCError({ code: 'FORBIDDEN' });
        await addAllowedEmail({ email: input.email, label: input.label ?? null, isAdmin: input.isAdmin ? 1 : 0, canLaunch: input.canLaunch ? 1 : 0, canMoveAppKanban: input.canMoveAppKanban ? 1 : 0, onlyAppKanban: input.onlyAppKanban ? 1 : 0 });
        return { success: true };
      }),
    updateEmail: publicProcedure
      .input(z.object({ id: z.number(), email: z.string().email().optional(), label: z.string().optional(), isAdmin: z.boolean().optional(), canLaunch: z.boolean().optional(), canMoveAppKanban: z.boolean().optional(), onlyAppKanban: z.boolean().optional(), allowedPages: z.array(z.string()).nullable().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const admin = await isEmailAdmin(ctx.user.email);
        if (!admin) throw new TRPCError({ code: 'FORBIDDEN' });
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = {};
        if (data.email !== undefined) updateData.email = data.email.toLowerCase();
        if (data.label !== undefined) updateData.label = data.label;
        if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin ? 1 : 0;
        if (data.canLaunch !== undefined) updateData.canLaunch = data.canLaunch ? 1 : 0;
        if (data.canMoveAppKanban !== undefined) updateData.canMoveAppKanban = data.canMoveAppKanban ? 1 : 0;
        if (data.onlyAppKanban !== undefined) updateData.onlyAppKanban = data.onlyAppKanban ? 1 : 0;
        if (data.allowedPages !== undefined) updateData.allowedPages = data.allowedPages === null ? null : JSON.stringify(data.allowedPages);
        await updateAllowedEmail(id, updateData as Parameters<typeof updateAllowedEmail>[1]);
        return { success: true };
      }),
    deleteEmail: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const admin = await isEmailAdmin(ctx.user.email);
        if (!admin) throw new TRPCError({ code: 'FORBIDDEN' });
        await deleteAllowedEmail(input.id);
        return { success: true };
      }),
    // Retorna as abas permitidas para o usuário atual
    myPermissions: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user || !ctx.user.email) return { allowedPages: null, isAdmin: false, isAllowed: false, canMoveAppKanban: false, onlyAppKanban: false };
      const entry = await getEmailEntry(ctx.user.email);
      if (!entry) return { allowedPages: null, isAdmin: false, isAllowed: false, canMoveAppKanban: false, onlyAppKanban: false };
      const allowedPages = entry.allowedPages ? JSON.parse(entry.allowedPages) as string[] : null;
      return { allowedPages, isAdmin: entry.isAdmin === 1, isAllowed: true, canMoveAppKanban: entry.canMoveAppKanban === 1, onlyAppKanban: entry.onlyAppKanban === 1 };
    }),
  }),
  checklists: router({
    // Listar checklists visíveis para o usuário
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const admin = await isEmailAdmin(ctx.user.email);
      const lists = await getChecklistsForUser(ctx.user.email, admin);
      // Para cada checklist, buscar itens e completions do dia
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
      const completions = await getCompletionsForUser(ctx.user.email, today);
      const completedItemIds = new Set(completions.map(c => c.itemId));
      const result = await Promise.all(lists.map(async (cl) => {
        const items = await getItemsByChecklist(cl.id);
        return {
          ...cl,
          items: items.sort((a, b) => a.order - b.order).map(item => ({
            ...item,
            completed: completedItemIds.has(item.id),
          })),
          isOwner: cl.ownerEmail === ctx.user!.email,
        };
      }));
      return result;
    }),
    create: publicProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        resetType: z.enum(['daily', 'manual', 'none', 'unique']).default('daily'),
        isAdminChecklist: z.boolean().default(false),
        items: z.array(z.string()).default([]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const allowed = await isEmailAllowed(ctx.user.email);
        if (!allowed) throw new TRPCError({ code: 'FORBIDDEN' });
        const admin = await isEmailAdmin(ctx.user.email);
        const checklistId = await createChecklist({
          ownerEmail: ctx.user.email,
          title: input.title,
          description: input.description ?? null,
          resetType: input.resetType,
          isAdminChecklist: (input.isAdminChecklist && admin) ? 1 : 0,
        });
        for (let i = 0; i < input.items.length; i++) {
          if (input.items[i].trim()) {
            await addChecklistItem({ checklistId, text: input.items[i].trim(), order: i });
          }
        }
        return { success: true, id: checklistId };
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        resetType: z.enum(['daily', 'manual', 'none', 'unique']).optional(),
        isAdminChecklist: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const cl = await getChecklistById(input.id);
        if (!cl) throw new TRPCError({ code: 'NOT_FOUND' });
        if (cl.ownerEmail !== ctx.user.email) throw new TRPCError({ code: 'FORBIDDEN' });
        const admin = await isEmailAdmin(ctx.user.email);
        const updateData: Record<string, unknown> = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.resetType !== undefined) updateData.resetType = input.resetType;
        if (input.isAdminChecklist !== undefined) updateData.isAdminChecklist = (input.isAdminChecklist && admin) ? 1 : 0;
        await updateChecklist(input.id, updateData as Parameters<typeof updateChecklist>[1]);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const cl = await getChecklistById(input.id);
        if (!cl) throw new TRPCError({ code: 'NOT_FOUND' });
        if (cl.ownerEmail !== ctx.user.email) throw new TRPCError({ code: 'FORBIDDEN' });
        await deleteChecklist(input.id);
        return { success: true };
      }),
    addItem: publicProcedure
      .input(z.object({ checklistId: z.number(), text: z.string().min(1).max(500), order: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const cl = await getChecklistById(input.checklistId);
        if (!cl) throw new TRPCError({ code: 'NOT_FOUND' });
        if (cl.ownerEmail !== ctx.user.email) throw new TRPCError({ code: 'FORBIDDEN' });
        const id = await addChecklistItem({ checklistId: input.checklistId, text: input.text, order: input.order ?? 0 });
        return { success: true, id };
      }),
    updateItem: publicProcedure
      .input(z.object({ id: z.number(), text: z.string().min(1).max(500).optional(), order: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const { id, ...data } = input;
        await updateChecklistItem(id, data);
        return { success: true };
      }),
    deleteItem: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        await deleteChecklistItem(input.id);
        return { success: true };
      }),
    toggleItem: publicProcedure
      .input(z.object({ itemId: z.number(), completed: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
        await toggleCompletion(input.itemId, ctx.user.email, today, input.completed);
        return { success: true };
      }),
  }),
  // ---- Tracking procedures ----
  tracking: router({
    startSession: publicProcedure
      .input(z.object({ userAgent: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.email) return { sessionId: null };
        const ip = (ctx.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || ctx.req.socket?.remoteAddress || null;
        const sessionId = await createSession({
          userEmail: ctx.user.email,
          userName: ctx.user.name ?? null,
          ipAddress: ip,
          userAgent: input.userAgent ?? null,
        });
        return { sessionId };
      }),
    endSession: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.email) return { success: false };
        await closeSession(input.sessionId, new Date());
        return { success: true };
      }),
    heartbeat: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.email) return { success: false };
        await heartbeatSession(input.sessionId);
        return { success: true };
      }),
    trackPage: publicProcedure
      .input(z.object({ page: z.string(), sessionId: z.number().nullable().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.email) return { success: false };
        await recordPageView({ userEmail: ctx.user.email, page: input.page, sessionId: input.sessionId ?? null });
        return { success: true };
      }),
    trackAction: publicProcedure
      .input(z.object({ actionType: z.string(), description: z.string().optional(), metadata: z.string().optional(), sessionId: z.number().nullable().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.email) return { success: false };
        await recordUserAction({ userEmail: ctx.user.email, actionType: input.actionType, description: input.description ?? null, metadata: input.metadata ?? null, sessionId: input.sessionId ?? null });
        return { success: true };
      }),
  }),
  // ---- Statistics procedures (admin only) ----
  stats: router({
    overview: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const admin = await isEmailAdmin(ctx.user.email);
      if (!admin) throw new TRPCError({ code: 'FORBIDDEN' });
      return getStatsOverview();
    }),
    userList: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const admin = await isEmailAdmin(ctx.user.email);
      if (!admin) throw new TRPCError({ code: 'FORBIDDEN' });
      return getUserStatsList();
    }),
    recentSessions: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const admin = await isEmailAdmin(ctx.user.email);
      if (!admin) throw new TRPCError({ code: 'FORBIDDEN' });
      return getRecentSessions(50);
    }),
    recentActions: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const admin = await isEmailAdmin(ctx.user.email);
      if (!admin) throw new TRPCError({ code: 'FORBIDDEN' });
      return getRecentActions(100);
    }),
    topPages: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const admin = await isEmailAdmin(ctx.user.email);
      if (!admin) throw new TRPCError({ code: 'FORBIDDEN' });
      return getMostVisitedPages();
    }),
  }),
  clientComments: router({
    list: publicProcedure
      .input(z.object({ monthYear: z.string() }))
      .query(async ({ input }) => {
        return getClientComments(input.monthYear);
      }),
    upsert: publicProcedure
      .input(z.object({
        clientName: z.string(),
        comment: z.string(),
        monthYear: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return upsertClientComment({
          clientName: input.clientName,
          comment: input.comment,
          monthYear: input.monthYear,
          authorEmail: ctx.user?.email || undefined,
          authorName: ctx.user?.name || undefined,
        });
      }),
    delete: publicProcedure
      .input(z.object({
        clientName: z.string(),
        monthYear: z.string(),
      }))
      .mutation(async ({ input }) => {
        return deleteClientComment(input.clientName, input.monthYear);
      }),
  }),
  appKanban: router({
    list: protectedProcedure.query(async () => {
      return getAppKanbanCards();
    }),
    listByStage: protectedProcedure
      .input(z.object({ stage: z.string() }))
      .query(async ({ input }) => {
        return getAppKanbanCardsByStage(input.stage);
      }),
    create: protectedProcedure
      .input(z.object({
        companyName: z.string(),
        csm: z.string(),
        comercial: z.string(),
        startDate: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas admin pode criar cards' });
        }
        const cardId = await createAppKanbanCard({
          companyName: input.companyName,
          csm: input.csm,
          comercial: input.comercial,
          startDate: new Date(input.startDate),
          stage: 'venda_feita',
          order: 0,
          createdBy: ctx.user.email || 'unknown',
        });
        return { id: cardId, ...input, stage: 'venda_feita' };
      }),
    move: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        fromStage: z.string(),
        toStage: z.string(),
        newOrder: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.email) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Você precisa estar autenticado' });
        }
        // Verificar se é admin OU se tem permissão canMoveAppKanban
        const isAdmin = ctx.user.role === 'admin';
        const entry = await getEmailEntry(ctx.user.email);
        const canMove = isAdmin || (entry?.canMoveAppKanban === 1);
        if (!canMove) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não tem permissão para mover cards' });
        }
        await moveAppKanbanCard(input.cardId, input.fromStage, input.toStage, ctx.user.email || 'unknown', input.newOrder);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ cardId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas admin pode deletar cards' });
        }
        await deleteAppKanbanCard(input.cardId);
        return { success: true };
      }),
    history: protectedProcedure
      .input(z.object({ cardId: z.number() }))
      .query(async ({ input }) => {
        return getAppKanbanHistory(input.cardId);
      }),
    getChecklist: protectedProcedure
      .input(z.object({ cardId: z.number() }))
      .query(async ({ input }) => {
        return getAppKanbanChecklist(input.cardId);
      }),
    updateChecklist: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        logomarca: z.boolean().optional(),
        descricaoCurta: z.boolean().optional(),
        descricaoLonga: z.boolean().optional(),
        politicaPrivacidade: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.email) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Você precisa estar autenticado' });
        }
        // Apenas admins (allowed_emails.isAdmin) podem atualizar o checklist
        const isAdmin = await isEmailAdmin(ctx.user.email);
        if (!isAdmin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem atualizar o checklist' });
        }
        const { cardId, ...data } = input;
        return upsertAppKanbanChecklist(cardId, data);
      }),
    updatePriority: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        priority: z.number().int().positive(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.email) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Voce precisa estar autenticado' });
        }
        const isAdmin = await isEmailAdmin(ctx.user.email);
        if (!isAdmin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem atualizar prioridade' });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados nao disponivel' });
        
        await db.update(appKanbanCards).set({ priority: input.priority }).where(eq(appKanbanCards.id, input.cardId));
        const updated = await db.select().from(appKanbanCards).where(eq(appKanbanCards.id, input.cardId));
        return updated[0];
      }),
    updateRefusalReason: protectedProcedure
      .input(z.object({
        cardId: z.number(),
        refusalReason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.email) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Voce precisa estar autenticado' });
        }
        const isAdmin = await isEmailAdmin(ctx.user.email);
        if (!isAdmin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem atualizar motivo de recusa' });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados nao disponivel' });
        
        await db.update(appKanbanCards).set({ refusalReason: input.refusalReason || null }).where(eq(appKanbanCards.id, input.cardId));
        const updated = await db.select().from(appKanbanCards).where(eq(appKanbanCards.id, input.cardId));
        return updated[0];
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  urs: router({
    generateInsights: protectedProcedure
      .input(z.object({
        csvData: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Parse CSV: Coluna A: Cliente, E: Qtd Atual, F: Variação 7 dias, G: Variação 1 dia
          const lines = input.csvData.trim().split('\n').filter((l: string) => l.trim());
          
          // Pular header se existir
          const dataLines = lines.slice(1);
          
          // Agrupar por cliente (pegar o último registro de cada um)
          const clientData: Record<string, { qtdAtual: number; var7dias: number; var1dia: number }> = {};
          
          for (const line of dataLines) {
            const parts = line.split(',');
            if (parts.length < 7) continue;
            
            const cliente = parts[0]?.trim() || 'Desconhecido';
            const qtdAtual = parseInt(parts[4]?.trim() || '0'); // Coluna E (índice 4)
            const var7dias = parseInt(parts[5]?.trim() || '0'); // Coluna F (índice 5)
            const var1dia = parseInt(parts[6]?.trim() || '0');  // Coluna G (índice 6)
            
            // Sempre pegar o último registro (mais recente)
            clientData[cliente] = { qtdAtual, var7dias, var1dia };
          }
          
          // Ordenar por variação 7 dias (maiores perdas = menores números)
          const sortedByVar7 = Object.entries(clientData)
            .sort((a, b) => a[1].var7dias - b[1].var7dias)
            .slice(0, 5);
          
          const sortedByGains7 = Object.entries(clientData)
            .sort((a, b) => b[1].var7dias - a[1].var7dias)
            .slice(0, 5);
          
          // Calcular métricas gerais
          const totalClientes = Object.keys(clientData).length;
          const totalPlacas = Object.values(clientData).reduce((sum, d) => sum + d.qtdAtual, 0);
          const totalPerdasSemanal = Object.values(clientData)
            .filter(d => d.var7dias < 0)
            .reduce((sum, d) => sum + Math.abs(d.var7dias), 0);
          const totalGanhosSemanal = Object.values(clientData)
            .filter(d => d.var7dias > 0)
            .reduce((sum, d) => sum + d.var7dias, 0);
          
          // Gerar análise criativa
          let analysis = '## 📊 Análise de Ganhos e Perdas de Placas (Últimos 7 Dias)\n\n';
          analysis += `### 📋 Resumo Executivo\n- **Total de empresas**: ${totalClientes}\n- **Total de placas em circulação**: ${totalPlacas.toLocaleString('pt-BR')}\n- **Ganhos na semana**: +${totalGanhosSemanal} placas\n- **Perdas na semana**: -${totalPerdasSemanal} placas\n- **Saldo**: ${totalGanhosSemanal - totalPerdasSemanal > 0 ? '+' : ''}${totalGanhosSemanal - totalPerdasSemanal} placas\n\n`;
          
          if (sortedByVar7.length > 0) {
            analysis += '### 🔴 Empresas Críticas - TOP 5 (Maiores Perdas)\n\n';
            let rank = 1;
            for (const [cliente, data] of sortedByVar7) {
              if (data.var7dias < 0) {
                const percentualPerda = ((Math.abs(data.var7dias) / data.qtdAtual) * 100).toFixed(1);
                const urgencia = Math.abs(data.var7dias) > 100 ? '\ud83d\udea8 URGENTE' : Math.abs(data.var7dias) > 50 ? '\u26a0\ufe0f ATENÇÃO' : '\ud83d\udd20 Monitor';
                analysis += `**${rank}. ${cliente}** ${urgencia}\n`;
                analysis += `   - Perdeu ${Math.abs(data.var1dia)} placa(s) ontem\n`;
                analysis += `   - Perdeu ${Math.abs(data.var7dias)} placas em 7 dias (-${percentualPerda}%)\n`;
                analysis += `   - Saldo atual: ${data.qtdAtual} placas\n\n`;
                rank++;
              }
            }
          }
          
          if (sortedByGains7.length > 0) {
            analysis += '### 🟢 Empresas em Crescimento - TOP 5 (Maiores Ganhos)\n\n';
            let rank = 1;
            for (const [cliente, data] of sortedByGains7) {
              if (data.var7dias > 0) {
                const percentualGanho = ((data.var7dias / data.qtdAtual) * 100).toFixed(1);
                analysis += `**${rank}. ${cliente}** \ud83c\udf1f DESTAQUE\n`;
                analysis += `   - Ganhou ${data.var7dias} placas em 7 dias (+${percentualGanho}%)\n`;
                analysis += `   - Saldo atual: ${data.qtdAtual} placas\n\n`;
                rank++;
              }
            }
          }
          
          analysis += '### 💭 Insights e Recomendações\n';
          if (totalPerdasSemanal > totalGanhosSemanal) {
            analysis += `- ⚠\ufe0f **Tendência Negativa**: Perdas (${totalPerdasSemanal}) superam ganhos (${totalGanhosSemanal}). Recomenda-se intensificar contatos com clientes em risco.\n`;
          } else {
            analysis += `- \ud83c\udf1f **Tendência Positiva**: Ganhos (${totalGanhosSemanal}) superam perdas (${totalPerdasSemanal}). Manter estratégia atual.\n`;
          }
          analysis += `- \ud83d\udcc4 Priorize contato com as 3 primeiras empresas críticas para entender causas das perdas.\n`;
          analysis += `- \ud83c\udf86 Estude casos de sucesso das empresas em crescimento para replicar estratégias.\n`;
          
          if (Object.keys(clientData).length === 0) {
            analysis += '\nNenhum dado disponível para análise.';
          }
          
          return {
            success: true,
            insights: analysis + '\n',
          };
        } catch (error: any) {
          console.error('[generateInsights] Erro:', error?.message || error);
          return {
            success: true,
            insights: '## 📊 Análise Indisponível\n\nDesculpe, não conseguimos processar os dados no momento. Tente novamente.',
          };
        }
      }),
  }),
  // === Aviso de Perdas de URs (primeira entrada do dia) ===
  dailyLosses: router({
    getAlert: publicProcedure.query(async () => {
      // Cache server-side de 5 minutos
      const CACHE_KEY = '__dailyLossesCache';
      const CACHE_DURATION = 5 * 60 * 1000;
      const global = globalThis as any;
      const cached = global[CACHE_KEY];
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
      }

      try {
        const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSLsjnFmBMUVU4KF_uCsoRJ9OF0LyEu_ZNxYUClHITba3sfkjyKz-kdSNzQ6CMtdXTiGwkion6m-XJj/pub?gid=1969284070&single=true&output=csv';
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const csv = await response.text();
        const lines = csv.split('\n');

        // Col A = Cliente, Col B = Perda (SUM de Dif1Dia), Col C = Qtd Atual, Col D = % Perdida
        const losses: { cliente: string; perda: number; qtdAtual: string; percentual: string }[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          // Parse CSV respeitando aspas
          const cols: string[] = [];
          let current = '';
          let inQuotes = false;
          for (const char of line) {
            if (char === '"') { inQuotes = !inQuotes; }
            else if (char === ',' && !inQuotes) { cols.push(current); current = ''; }
            else { current += char; }
          }
          cols.push(current);

          const cliente = (cols[0] || '').replace(/^SSX_/, '').trim();
          const perdaStr = (cols[1] || '').replace(/\./g, '').replace(',', '.').trim();
          const perda = parseFloat(perdaStr);
          const qtdAtual = (cols[2] || '').trim();
          const percentual = (cols[3] || '').trim();

          // Apenas clientes com perda (valor negativo)
          if (!isNaN(perda) && perda < 0) {
            losses.push({ cliente, perda, qtdAtual, percentual });
          }
        }

        // Ordenar por maior perda (mais negativo primeiro)
        losses.sort((a, b) => a.perda - b.perda);

        const result = { losses, totalPerdas: losses.reduce((sum, l) => sum + l.perda, 0), count: losses.length };
        global[CACHE_KEY] = { data: result, timestamp: Date.now() };
        return result;
      } catch (error: any) {
        console.error('[getDailyLossesAlert] Erro:', error?.message || error);
        return { losses: [], totalPerdas: 0, count: 0 };
      }
    }),
    markAsAcknowledged: protectedProcedure
      .input(z.object({ acknowledgedDate: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
        await markLossesAsAcknowledged(ctx.user.id, input.acknowledgedDate);
        return { success: true };
      }),
    checkAcknowledged: protectedProcedure
      .input(z.object({ acknowledgedDate: z.string() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.id) return false;
        return await checkLossesAcknowledged(ctx.user.id, input.acknowledgedDate);
      }),
  }),
});

export type AppRouter = typeof appRouter;
