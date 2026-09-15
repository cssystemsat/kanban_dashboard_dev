import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const { invokeLLM } = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./_core/llm", () => ({ invokeLLM }));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getEmailEntry: vi
      .fn()
      .mockResolvedValue({ allowedPages: null, isAdmin: 0, canLaunch: 1 }),
  };
});

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const authenticatedUser = {
  id: 1,
  openId: "marcos-insights-test-open-id",
  name: "CSM Teste",
  email: "csm@systemsat.com.br",
  loginMethod: "google",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("marcos.generateInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeLLM.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              insights: [
                {
                  id: "JDF-1",
                  resumo: "Cliente com sinais de atraso e perda financeira.",
                  motivos: ["Marco atrasado", "Diferença negativa"],
                  proximaAcao: "Fazer contato prioritário.",
                },
              ],
            }),
          },
        },
      ],
    });
  });

  it("envia uma análise estruturada e devolve explicações por cliente", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));

    const result = await caller.marcos.generateInsights({
      clients: [
        {
          id: "JDF-1",
          nome: "JDF",
          score: 72,
          signals: [
            { label: "Marco atrasado", value: "Prazo vencido" },
            { label: "Diferença negativa", value: "R$ -500,00" },
          ],
        },
      ],
    });

    expect(result.insights[0]).toMatchObject({
      id: "JDF-1",
      resumo: expect.stringContaining("atraso"),
    });
    expect(invokeLLM).toHaveBeenCalledOnce();
    expect(invokeLLM.mock.calls[0][0].response_format.json_schema.strict).toBe(
      true
    );
  });

  it("limita a entrada a no máximo 30 clientes", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));
    const clients = Array.from({ length: 31 }, (_, index) => ({
      id: `client-${index}`,
      nome: `Cliente ${index}`,
      score: 10,
      signals: [{ label: "Marco pendente", value: "Sem atualização" }],
    }));

    await expect(
      caller.marcos.generateInsights({ clients })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
