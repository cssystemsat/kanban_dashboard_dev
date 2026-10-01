import { desc, eq, inArray } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  InsertWootricResponse,
  wootricResponseAcknowledgments,
  wootricResponses,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";

const WOOTRIC_API_BASE_URL = "https://api.wootric.com";
const TOKEN_ENDPOINT = `${WOOTRIC_API_BASE_URL}/oauth/token`;
const RESPONSE_ENDPOINT = `${WOOTRIC_API_BASE_URL}/v1/responses`;

type WootricUser = {
  id?: number | string;
  email?: string | null;
  external_id?: string | null;
  properties?: Record<string, unknown> | null;
};

export type WootricResponseInput = {
  id: number | string;
  email?: string | null;
  external_id?: string | null;
  end_user_id?: number | string | null;
  survey_id?: number | string | null;
  score: number;
  text?: string | null;
  tags?: string[] | null;
  end_user?: WootricUser | null;
  end_user_properties?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  excluded_from_calculations?: boolean;
};

type WootricApiResponse = WootricResponseInput & {
  end_user?: WootricUser;
};

type WootricWebhookPayload = {
  response?: WootricResponseInput;
  event_name?: "created" | "updated" | string;
};

function parseExternalDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function jsonOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function normalizeWootricResponse(
  response: WootricResponseInput,
  rawPayload: unknown = response
): InsertWootricResponse {
  const endUser = response.end_user ?? null;
  const endUserProperties =
    response.end_user_properties ?? endUser?.properties ?? null;

  return {
    wootricId: String(response.id),
    externalId: response.external_id ?? endUser?.external_id ?? null,
    email: response.email ?? endUser?.email ?? null,
    endUserId:
      response.end_user_id === null || response.end_user_id === undefined
        ? endUser?.id === undefined
          ? null
          : String(endUser.id)
        : String(response.end_user_id),
    surveyId:
      response.survey_id === null || response.survey_id === undefined
        ? null
        : String(response.survey_id),
    score: Math.max(0, Math.min(10, Math.round(response.score))),
    text: response.text ?? null,
    tags: jsonOrNull(response.tags ?? []),
    properties: jsonOrNull(endUserProperties),
    createdAtWootric: parseExternalDate(response.created_at),
    updatedAtWootric: parseExternalDate(response.updated_at),
    rawPayload: jsonOrNull(rawPayload),
  };
}

async function getAccessToken(): Promise<string> {
  if (!ENV.wootricClientId || !ENV.wootricClientSecret) {
    throw new Error("Credenciais OAuth da Wootric não configuradas.");
  }

  const form = new FormData();
  form.set("grant_type", "client_credentials");
  form.set("client_id", ENV.wootricClientId);
  form.set("client_secret", ENV.wootricClientSecret);

  const response = await fetch(TOKEN_ENDPOINT, { method: "POST", body: form });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Wootric OAuth ${response.status}: ${detail.slice(0, 500)}`);
  }
  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error("Wootric não retornou access_token.");
  return payload.access_token;
}

export async function fetchWootricResponses(options?: {
  createdGte?: Date;
  updatedGte?: Date;
}): Promise<WootricApiResponse[]> {
  const token = await getAccessToken();
  const responses: WootricApiResponse[] = [];
  for (let page = 1; page <= 30; page += 1) {
    const params = new URLSearchParams({
      page: String(page),
      per_page: "50",
      sort_order: "asc",
      sort_key: "created_at",
    });
    if (options?.createdGte) {
      params.set("created[gte]", String(Math.floor(options.createdGte.getTime() / 1000)));
    }
    if (options?.updatedGte) {
      params.set("updated[gte]", String(Math.floor(options.updatedGte.getTime() / 1000)));
    }

    const response = await fetch(`${RESPONSE_ENDPOINT}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Wootric responses ${response.status}: ${detail.slice(0, 500)}`);
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) break;
    const pageResponses = payload as WootricApiResponse[];
    responses.push(...pageResponses);
    if (pageResponses.length < 50) break;
  }
  return responses;
}

export async function upsertWootricResponse(
  response: WootricResponseInput,
  rawPayload: unknown = response
) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const values = normalizeWootricResponse(response, rawPayload);
  const existing = await db
    .select()
    .from(wootricResponses)
    .where(eq(wootricResponses.wootricId, values.wootricId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(wootricResponses)
      .set({
        ...values,
        receivedAt: existing[0].receivedAt,
      })
      .where(eq(wootricResponses.id, existing[0].id));
    const updated = await db
      .select()
      .from(wootricResponses)
      .where(eq(wootricResponses.id, existing[0].id))
      .limit(1);
    return { row: updated[0], inserted: false };
  }

  const result = await db.insert(wootricResponses).values(values);
  const inserted = await db
    .select()
    .from(wootricResponses)
    .where(eq(wootricResponses.id, result[0].insertId))
    .limit(1);
  return { row: inserted[0], inserted: true };
}

export async function syncWootricResponses() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const latest = await db
    .select({ createdAtWootric: wootricResponses.createdAtWootric })
    .from(wootricResponses)
    .orderBy(desc(wootricResponses.createdAtWootric))
    .limit(1);

  const createdGte = latest[0]?.createdAtWootric
    ? new Date(latest[0].createdAtWootric.getTime() - 5 * 60_000)
    : new Date(Date.now() - 7 * 24 * 60 * 60_000);
  const responses = await fetchWootricResponses({ createdGte });
  let inserted = 0;
  let updated = 0;
  for (const response of responses) {
    const result = await upsertWootricResponse(response, response);
    if (result.inserted) inserted += 1;
    else updated += 1;
  }
  return { fetched: responses.length, inserted, updated };
}

export async function handleWootricWebhook(payload: WootricWebhookPayload) {
  if (!payload.response || !["created", "updated"].includes(payload.event_name ?? "created")) {
    return { accepted: true, ignored: true };
  }
  const result = await upsertWootricResponse(payload.response, payload);
  return { accepted: true, ignored: false, inserted: result.inserted };
}

export function verifyWootricWebhookSignature(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  const expected = `sha1=${createHmac("sha1", secret).update(rawBody).digest("hex")}`;
  const received = Buffer.from(signature);
  const calculated = Buffer.from(expected);
  return received.length === calculated.length && timingSafeEqual(received, calculated);
}

export async function getPendingWootricResponses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const [responses, acknowledgments] = await Promise.all([
    db.select().from(wootricResponses).orderBy(desc(wootricResponses.createdAtWootric)).limit(50),
    db
      .select({ responseId: wootricResponseAcknowledgments.responseId })
      .from(wootricResponseAcknowledgments)
      .where(eq(wootricResponseAcknowledgments.userId, userId)),
  ]);
  const acknowledged = new Set(acknowledgments.map(row => row.responseId));
  return responses.filter(response => !acknowledged.has(response.id));
}

export async function acknowledgeWootricResponses(responseIds: number[], userId: number) {
  const db = await getDb();
  if (!db || responseIds.length === 0) return { acknowledged: 0 };
  const uniqueIds = [...new Set(responseIds)];
  const existing = await db
    .select({ responseId: wootricResponseAcknowledgments.responseId })
    .from(wootricResponseAcknowledgments)
    .where(
      inArray(wootricResponseAcknowledgments.responseId, uniqueIds)
    );
  const alreadyAcknowledged = new Set(existing.map(row => row.responseId));
  const pendingIds = uniqueIds.filter(id => !alreadyAcknowledged.has(id));
  if (pendingIds.length > 0) {
    await db.insert(wootricResponseAcknowledgments).values(
      pendingIds.map(responseId => ({ responseId, userId }))
    );
  }
  return { acknowledged: pendingIds.length };
}
