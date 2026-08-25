import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

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
});
