import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getClientComments: vi.fn(),
  getClientCommentHistory: vi.fn(),
  getClientsWithComments: vi.fn(),
  upsertClientComment: vi.fn(),
  deleteClientComment: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  ...mocks,
}));

import { appRouter } from "./routers";

function createContext(authenticated = true): TrpcContext {
  return {
    user: authenticated
      ? {
          id: 42,
          openId: "comment-user",
          email: "analista@example.com",
          name: "Analista CS",
          loginMethod: "manus",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("clientComments router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exige autenticação para consultar o relatório", async () => {
    const caller = appRouter.createCaller(createContext(false));
    await expect(
      caller.clientComments.listWithComments({})
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("retorna o histórico consolidado da competência", async () => {
    const rows = [
      {
        id: 1,
        clientName: "Cliente A",
        comment: "Revisado",
        monthYear: "2026-08",
        action: "saved",
      },
    ];
    mocks.getClientCommentHistory.mockResolvedValue(rows);
    const caller = appRouter.createCaller(createContext());

    await expect(
      caller.clientComments.history({ monthYear: "2026-08" })
    ).resolves.toEqual(rows);
    expect(mocks.getClientCommentHistory).toHaveBeenCalledWith("2026-08");
  });

  it("salva comentário com a identidade do usuário autenticado", async () => {
    mocks.upsertClientComment.mockResolvedValue({ id: 7 });
    const caller = appRouter.createCaller(createContext());

    await caller.clientComments.upsert({
      clientName: "Cliente A",
      comment: "Acompanhar consumo",
      monthYear: "2026-08",
    });
    expect(mocks.upsertClientComment).toHaveBeenCalledWith({
      clientName: "Cliente A",
      comment: "Acompanhar consumo",
      monthYear: "2026-08",
      authorEmail: "analista@example.com",
      authorName: "Analista CS",
    });
  });

  it("registra o autor ao remover o comentário atual", async () => {
    mocks.deleteClientComment.mockResolvedValue(true);
    const caller = appRouter.createCaller(createContext());

    await caller.clientComments.delete({
      clientName: "Cliente A",
      monthYear: "2026-08",
    });
    expect(mocks.deleteClientComment).toHaveBeenCalledWith(
      "Cliente A",
      "2026-08",
      {
        email: "analista@example.com",
        name: "Analista CS",
      }
    );
  });
});
