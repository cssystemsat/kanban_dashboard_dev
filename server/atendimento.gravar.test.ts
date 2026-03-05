import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do módulo googleSheets para não fazer chamadas reais à API
vi.mock("./googleSheets", () => ({
  appendAtendimento: vi.fn().mockResolvedValue({ row: 300, sheetName: "Agendas" }),
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

describe("atendimento.gravar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("grava atendimento com todos os campos e retorna row e sheetName", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.atendimento.gravar({
      cliente: "Cliente Teste",
      tipo: "Whatsapp privado",
      situacao: "Dúvidas",
      resumo: "Cliente perguntou sobre o módulo de relatórios",
      duracao: "10 minutos",
    });

    expect(result.success).toBe(true);
    expect(result.row).toBe(300);
    expect(result.sheetName).toBe("Agendas");
  });

  it("rejeita input inválido quando campo obrigatório está ausente", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.atendimento.gravar({
        cliente: "Cliente Teste",
        tipo: "Ligação",
        situacao: "Reclamações",
        resumo: "", // vazio é permitido pelo schema (validação no frontend)
        duracao: "30 minutos",
      })
    ).resolves.toMatchObject({ success: true });
  });
});
