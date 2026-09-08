import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const { appendFriccao } = vi.hoisted(() => ({
  appendFriccao: vi.fn(),
}));

vi.mock("./googleSheets", () => ({
  appendFriccao,
}));

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
  openId: "friccao-test-open-id",
  name: "CSM Teste",
  email: "csm@systemsat.com.br",
  loginMethod: "google",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("friccao.gravar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appendFriccao.mockResolvedValue({ row: 42, sheetName: "Fricções" });
  });

  it("grava as colunas A:G e identifica o CSM autenticado", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));

    const result = await caller.friccao.gravar({
      cliente: "SSX CENTRAL TESTE",
      titulo: "Integração pendente",
      setor: "Suporte",
      tag: "Problema",
      descricao: "A etapa de integração não foi concluída.",
    });

    expect(result).toMatchObject({
      success: true,
      row: 42,
      sheetName: "Fricções",
    });
    expect(appendFriccao).toHaveBeenCalledWith(
      expect.objectContaining({
        central: "SSX CENTRAL TESTE",
        titulo: "Integração pendente",
        setor: "Suporte",
        tag: "Problema",
        descricao: "A etapa de integração não foi concluída.",
        usuario: "CSM Teste",
        data: expect.stringMatching(/^\d{2}\/\d{2}\/\d{4}$/),
      })
    );
  });

  it("rejeita opções que não pertencem ao catálogo da Fricção", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));

    await expect(
      caller.friccao.gravar({
        cliente: "SSX CENTRAL TESTE",
        titulo: "Título",
        setor: "Produto" as never,
        tag: "Problema",
        descricao: "Descrição",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejeita lançamento sem autenticação", async () => {
    const caller = appRouter.createCaller(createContext(null));

    await expect(
      caller.friccao.gravar({
        cliente: "SSX CENTRAL TESTE",
        titulo: "Título",
        setor: "CSM",
        tag: "Operação",
        descricao: "Descrição",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
