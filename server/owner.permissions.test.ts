import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getEmailEntry: vi.fn().mockResolvedValue(null),
    isEmailAllowed: vi.fn().mockResolvedValue(false),
    isEmailAdmin: vi.fn().mockResolvedValue(false),
  };
});

function createOwnerContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: ENV.ownerOpenId,
      email: "owner@example.com",
      name: "Project Owner",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAuthenticatedContext(): TrpcContext {
  const ctx = createOwnerContext();
  return {
    ...ctx,
    user: {
      ...ctx.user!,
      id: 2,
      openId: "regular-user-open-id",
      email: "regular@example.com",
      name: "Regular User",
      role: "user",
    },
  };
}

describe("project owner permissions", () => {
  it("returns unrestricted page access for the project owner", async () => {
    expect(ENV.ownerOpenId).not.toBe("");
    const caller = appRouter.createCaller(createOwnerContext());

    await expect(caller.config.myPermissions()).resolves.toEqual({
      allowedPages: null,
      isAdmin: true,
      isAllowed: true,
      canMoveAppKanban: true,
      onlyAppKanban: false,
    });
  });

  it("allows the project owner to launch and administer operations", async () => {
    const caller = appRouter.createCaller(createOwnerContext());

    await expect(caller.atendimento.checkPermission()).resolves.toEqual({
      allowed: true,
      isAdmin: true,
      canLaunch: true,
    });
  });

  it("grants all operational pages to any authenticated user without making them admin", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());

    await expect(caller.config.myPermissions()).resolves.toEqual({
      allowedPages: null,
      isAdmin: false,
      isAllowed: true,
      canMoveAppKanban: true,
      onlyAppKanban: false,
    });
    await expect(caller.atendimento.checkPermission()).resolves.toEqual({
      allowed: true,
      isAdmin: false,
      canLaunch: true,
    });
  });
});
