import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do módulo googleSheets para não fazer chamadas reais à API
vi.mock("./googleSheets", () => ({
  appendAtendimento: vi.fn().mockResolvedValue({ row: 300, sheetName: "Agendas" }),
}));

// Mock do db para simular e-mail permitido
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    isEmailAllowed: vi.fn().mockResolvedValue(true),
    isEmailAdmin: vi.fn().mockResolvedValue(false),
    getEmailEntry: vi.fn().mockResolvedValue({ allowedPages: null, isAdmin: 0 }),
  };
});

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

function createAuthenticatedContext(email = "test@systemsat.com.br"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test User",
      email,
      loginMethod: "google",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
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
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.atendimento.gravar({
      cliente: "Cliente Teste",
      tipo: "Whatsapp privado",
      situacao: "Dúvidas",
      razao: "Web",
      resumo: "Cliente perguntou sobre o módulo de relatórios",
      duracao: "10 minutos",
    });

    expect(result.success).toBe(true);
    expect(result.row).toBe(300);
    expect(result.sheetName).toBe("Agendas");
  });

  it("grava atendimento com resumo vazio (válido pelo schema)", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.atendimento.gravar({
        cliente: "Cliente Teste",
        tipo: "Ligação",
        situacao: "Reclamações",
        razao: "Financeiro",
        resumo: "",
        duracao: "30 minutos",
      })
    ).resolves.toMatchObject({ success: true });
  });

  it("rejeita atendimento sem autenticação", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.atendimento.gravar({
        cliente: "Cliente Teste",
        tipo: "Ligação",
        situacao: "Dúvidas",
        razao: "Web",
        resumo: "Teste",
        duracao: "10 minutos",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
