import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";
import { appRouter } from "./routers";
import * as db from "./db";

vi.mock("./db", async importOriginal => {
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

function allowEntry(email: string, isAdmin = false) {
  return {
    id: 1,
    email,
    label: email,
    isAdmin: isAdmin ? 1 : 0,
    canLaunch: 1,
    canMoveAppKanban: 1,
    onlyAppKanban: 0,
    allowedPages: null,
    createdAt: new Date(),
  } as never;
}

describe("project owner permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getEmailEntry).mockResolvedValue(null);
    vi.mocked(db.isEmailAllowed).mockResolvedValue(false);
    vi.mocked(db.isEmailAdmin).mockResolvedValue(false);
  });

  it("returns unrestricted page access for an allowlisted project owner", async () => {
    expect(ENV.ownerOpenId).not.toBe("");
    vi.mocked(db.getEmailEntry).mockResolvedValue(
      allowEntry("owner@example.com", true)
    );
    vi.mocked(db.isEmailAllowed).mockResolvedValue(true);
    vi.mocked(db.isEmailAdmin).mockResolvedValue(true);

    const caller = appRouter.createCaller(createOwnerContext());

    await expect(caller.config.myPermissions()).resolves.toEqual({
      allowedPages: null,
      isAdmin: true,
      isAllowed: true,
      canMoveAppKanban: true,
      onlyAppKanban: false,
    });
  });

  it("allows an allowlisted project owner to launch and administer operations", async () => {
    vi.mocked(db.getEmailEntry).mockResolvedValue(
      allowEntry("owner@example.com", true)
    );
    vi.mocked(db.isEmailAllowed).mockResolvedValue(true);
    vi.mocked(db.isEmailAdmin).mockResolvedValue(true);

    const caller = appRouter.createCaller(createOwnerContext());

    await expect(caller.atendimento.checkPermission()).resolves.toEqual({
      allowed: true,
      isAdmin: true,
      canLaunch: true,
    });
  });

  it("denies an authenticated user whose email is not allowlisted", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());

    await expect(caller.config.myPermissions()).resolves.toEqual({
      allowedPages: [],
      isAdmin: false,
      isAllowed: false,
      canMoveAppKanban: false,
      onlyAppKanban: false,
    });
    await expect(caller.atendimento.checkPermission()).resolves.toEqual({
      allowed: false,
      isAdmin: false,
      canLaunch: false,
    });
  });

  it("preserves configured operational permissions for an allowlisted user", async () => {
    vi.mocked(db.getEmailEntry).mockResolvedValue(
      allowEntry("regular@example.com")
    );
    vi.mocked(db.isEmailAllowed).mockResolvedValue(true);

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
