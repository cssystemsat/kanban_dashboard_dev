import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { appendAtendimento } from "./googleSheets";

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
          resumo: z.string(),
          duracao: z.string(),
        })
      )
      .mutation(async ({ input }) => {
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
          resumo: input.resumo,
          duracao: input.duracao,
        });
        return { success: true, row: result.row, sheetName: result.sheetName };
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
