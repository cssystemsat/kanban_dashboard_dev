import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { isEmailAllowed } from "../db";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  accessRestricted?: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let accessRestricted = false;

  try {
    const authenticatedUser = await sdk.authenticateRequest(opts.req);
    const allowed = Boolean(
      authenticatedUser.email && (await isEmailAllowed(authenticatedUser.email))
    );
    if (allowed) {
      user = authenticatedUser;
    } else {
      accessRestricted = true;
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    accessRestricted,
  };
}
