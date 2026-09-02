import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  exchangeCodeForToken: vi.fn(),
  getUserInfo: vi.fn(),
  createSessionToken: vi.fn(),
  isEmailAllowed: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: {
    authenticateRequest: mocks.authenticateRequest,
    exchangeCodeForToken: mocks.exchangeCodeForToken,
    getUserInfo: mocks.getUserInfo,
    createSessionToken: mocks.createSessionToken,
  },
}));

vi.mock("./db", () => ({
  isEmailAllowed: mocks.isEmailAllowed,
  upsertUser: mocks.upsertUser,
}));

import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";

const authorizedUser = {
  id: 1,
  openId: "authorized-open-id",
  name: "Authorized User",
  email: "authorized@example.com",
  loginMethod: "google",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createRequest(): Parameters<typeof createContext>[0] {
  return {
    req: {
      headers: {},
      protocol: "https",
      query: {},
    } as unknown as Parameters<typeof createContext>[0]["req"],
    res: {} as Parameters<typeof createContext>[0]["res"],
    info: {} as never,
  };
}

describe("allowlist access control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockRejectedValue(new Error("no session"));
    mocks.isEmailAllowed.mockResolvedValue(false);
  });

  it("keeps unauthenticated requests public but not operationally authorized", async () => {
    const context = await createContext(createRequest());

    expect(context.user).toBeNull();
    expect(context.accessRestricted).toBe(false);
  });

  it("accepts an existing session only when its email is allowlisted", async () => {
    mocks.authenticateRequest.mockResolvedValue(authorizedUser);
    mocks.isEmailAllowed.mockResolvedValue(true);

    const context = await createContext(createRequest());

    expect(context.user).toEqual(authorizedUser);
    expect(context.accessRestricted).toBe(false);
    expect(mocks.isEmailAllowed).toHaveBeenCalledWith("authorized@example.com");
  });

  it("marks an authenticated non-allowlisted session as restricted", async () => {
    mocks.authenticateRequest.mockResolvedValue(authorizedUser);

    const context = await createContext(createRequest());

    expect(context.user).toBeNull();
    expect(context.accessRestricted).toBe(true);
  });
});

describe("OAuth allowlist gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCodeForToken.mockResolvedValue({ accessToken: "token" });
    mocks.getUserInfo.mockResolvedValue({
      openId: "google-open-id",
      name: "Google User",
      email: "not-allowed@example.com",
      loginMethod: "google",
    });
    mocks.isEmailAllowed.mockResolvedValue(false);
  });

  it("redirects a non-allowlisted email without upserting or creating a session", async () => {
    let callback: ((req: Request, res: Response) => Promise<void>) | undefined;
    const app = {
      get: vi.fn((_path: string, handler: typeof callback) => {
        callback = handler;
      }),
    };
    registerOAuthRoutes(app as never);

    const redirect = vi.fn();
    await callback?.(
      { query: { code: "code", state: "state" } } as unknown as Request,
      { redirect } as unknown as Response
    );

    expect(redirect).toHaveBeenCalledWith(302, "/?access=restricted");
    expect(mocks.upsertUser).not.toHaveBeenCalled();
    expect(mocks.createSessionToken).not.toHaveBeenCalled();
  });

  it("continues the normal session flow for an allowlisted email", async () => {
    mocks.isEmailAllowed.mockResolvedValue(true);
    mocks.getUserInfo.mockResolvedValue({
      openId: "google-open-id",
      name: "Google User",
      email: "allowed@example.com",
      loginMethod: "google",
    });
    mocks.createSessionToken.mockResolvedValue("session-token");

    let callback: ((req: Request, res: Response) => Promise<void>) | undefined;
    const app = {
      get: vi.fn((_path: string, handler: typeof callback) => {
        callback = handler;
      }),
    };
    registerOAuthRoutes(app as never);

    const cookie = vi.fn();
    const redirect = vi.fn();
    await callback?.(
      {
        query: { code: "code", state: "state" },
        headers: {},
        protocol: "https",
        secure: true,
      } as unknown as Request,
      {
        cookie,
        redirect,
        status: vi.fn(() => ({ json: vi.fn() })),
      } as unknown as Response
    );

    expect(mocks.upsertUser).toHaveBeenCalledOnce();
    expect(mocks.createSessionToken).toHaveBeenCalledOnce();
    expect(cookie).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith(302, "/");
  });
});

function createCallerContext(accessRestricted: boolean): TrpcContext {
  return {
    user: null,
    accessRestricted,
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("restricted UI status", () => {
  it("keeps auth.me registered and returns no user without a session", async () => {
    const { appRouter } = await import("./routers");
    const result = await appRouter
      .createCaller(createCallerContext(false))
      .auth.me();

    expect(result).toBeNull();
  });

  it("exposes the restricted flag without exposing an operational user", async () => {
    const { appRouter } = await import("./routers");
    const result = await appRouter
      .createCaller(createCallerContext(true))
      .auth.accessStatus();

    expect(result).toEqual({ user: null, accessRestricted: true });
  });
});
