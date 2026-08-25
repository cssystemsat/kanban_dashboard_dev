import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do módulo LLM para evitar chamadas reais à API
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "Resposta simulada do LLM para análise de dados.",
        },
      },
    ],
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("system.analyzeWithLLM", () => {
  it("deve retornar uma resposta de texto do LLM", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.system.analyzeWithLLM({
      systemPrompt: "Você é um assistente de análise de dados de clientes.",
      userMessage: "Quantos clientes estão no Marco 1?",
    });

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("deve aceitar prompts vazios sem lançar erro", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.system.analyzeWithLLM({
      systemPrompt: "Contexto",
      userMessage: "Pergunta",
    });

    expect(typeof result).toBe("string");
  });
});
