import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { appendAtendimento } from "./googleSheets";
import {
  getAllowedEmails,
  isEmailAllowed,
  isEmailAdmin,
  addAllowedEmail,
  updateAllowedEmail,
  deleteAllowedEmail,
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
        const allowed = await isEmailAllowed(ctx.user.email);
        if (!allowed) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado. Seu e-mail não está na lista de usuários autorizados.' });
        }
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const result = await appendAtendimento({
          data: dataFormatada,
          cliente: input.cliente,
          tipo: input.tipo,
          situacao: input.situacao,
          razao: input.razao,
          resumo: input.resumo,
          duracao: input.duracao,
        });
        return { success: true, row: result.row, sheetName: result.sheetName };
      }),
    checkPermission: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user || !ctx.user.email) return { allowed: false, isAdmin: false };
      const [allowed, admin] = await Promise.all([
        isEmailAllowed(ctx.user.email),
        isEmailAdmin(ctx.user.email),
      ]);
      return { allowed, isAdmin: admin };
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
      .input(z.object({ email: z.string().email(), label: z.string().optional(), isAdmin: z.boolean().default(false) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const admin = await isEmailAdmin(ctx.user.email);
        if (!admin) throw new TRPCError({ code: 'FORBIDDEN' });
        await addAllowedEmail({ email: input.email, label: input.label ?? null, isAdmin: input.isAdmin ? 1 : 0 });
        return { success: true };
      }),
    updateEmail: publicProcedure
      .input(z.object({ id: z.number(), email: z.string().email().optional(), label: z.string().optional(), isAdmin: z.boolean().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || !ctx.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const admin = await isEmailAdmin(ctx.user.email);
        if (!admin) throw new TRPCError({ code: 'FORBIDDEN' });
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = {};
        if (data.email !== undefined) updateData.email = data.email.toLowerCase();
        if (data.label !== undefined) updateData.label = data.label;
        if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin ? 1 : 0;
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
