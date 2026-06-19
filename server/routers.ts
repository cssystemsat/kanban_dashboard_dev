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
} from "./db";
import { TRPCError } from "@trpc/server";

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
        startDate: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas admin pode criar cards' });
        }
        const cardId = await createAppKanbanCard({
          companyName: input.companyName,
          csm: input.csm,
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
        // Verificar se é admin OU se tem permissão canMoveAppKanban
        const isAdmin = ctx.user.role === 'admin';
        const entry = await getEmailEntry(ctx.user.email);
        const canEdit = isAdmin || (entry?.canMoveAppKanban === 1);
        if (!canEdit) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não tem permissão para atualizar o checklist' });
        }
        const { cardId, ...data } = input;
        return upsertAppKanbanChecklist(cardId, data);
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
});

export type AppRouter = typeof appRouter;
