import { and, desc, eq, gte, inArray, isNull, like, lt } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  InsertWootricResponse,
  wootricResponseAcknowledgments,
  wootricResponses,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { getSheetCsv } from "./googleSheets";

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

type WootricApiResponse = WootricResponseInput;

type WootricEndUser = {
  id?: number | string;
  email?: string | null;
  external_id?: string | null;
  properties?: Record<string, unknown> | null;
};

type WootricWebhookPayload = {
  response?: WootricResponseInput;
  event_name?: "created" | "updated" | string;
};

const ONBOARDING_GID = 0;
const ONGOING_GID = 1152476970;
const CENTRAL_MAP_TTL_MS = 5 * 60_000;
let centralMapCache: { expiresAt: number; values: Map<string, string> } | null = null;
let endUsersByCentralCache: {
  expiresAt: number;
  values: Map<string, WootricEndUser[]>;
} | null = null;

function normalizeLookup(value: unknown): string {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function centralIdFromEmail(value?: string | null): string | null {
  const match = value?.match(/-\s*(\d+)\s*$/);
  return match?.[1] ?? null;
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(value => value)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.some(value => value)) rows.push(row);
  }
  return rows;
}

export function mapCentralIds(csv: string): Map<string, string> {
  const rows = parseCsvRows(csv);
  const header = rows[0] ?? [];
  const clientIndex = header.findIndex(value => normalizeLookup(value).includes("cliente"));
  const centralIdIndex = header.findIndex(value => normalizeLookup(value).includes("id central"));
  const values = new Map<string, string>();
  if (clientIndex < 0 || centralIdIndex < 0) return values;
  for (const row of rows.slice(1)) {
    const clientName = row[clientIndex]?.trim();
    const centralId = row[centralIdIndex]?.trim();
    if (clientName && centralId) values.set(normalizeLookup(centralId), clientName);
  }
  return values;
}

async function getCentralNameMap(): Promise<Map<string, string>> {
  if (centralMapCache && centralMapCache.expiresAt > Date.now()) {
    return centralMapCache.values;
  }
  const [onboardingCsv, ongoingCsv] = await Promise.all([
    getSheetCsv("primary", ONBOARDING_GID),
    getSheetCsv("primary", ONGOING_GID),
  ]);
  const values = mapCentralIds(onboardingCsv);
  for (const [centralId, clientName] of mapCentralIds(ongoingCsv)) {
    values.set(centralId, clientName);
  }
  centralMapCache = { expiresAt: Date.now() + CENTRAL_MAP_TTL_MS, values };
  return values;
}

function centralIdFromResponse(response: WootricResponseInput): string | null {
  if (response.external_id) return String(response.external_id);
  const inferredFromEmail = centralIdFromEmail(
    response.email ?? response.end_user?.email
  );
  if (inferredFromEmail) return inferredFromEmail;
  if (response.end_user_id !== null && response.end_user_id !== undefined) {
    return String(response.end_user_id);
  }
  const properties = response.end_user_properties ?? response.end_user?.properties ?? {};
  const candidate = properties.central_id ?? properties.id_central ?? properties["Id central"];
  return candidate === undefined || candidate === null ? null : String(candidate);
}

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
  rawPayload: unknown = response,
  centralName: string | null = null,
  showInAlert = true
): InsertWootricResponse {
  const endUser = response.end_user ?? null;
  const endUserProperties =
    response.end_user_properties ?? endUser?.properties ?? null;
  const inferredCentralId = centralIdFromEmail(
    response.email ?? endUser?.email
  );

  return {
    wootricId: String(response.id),
    externalId:
      response.external_id ?? endUser?.external_id ?? inferredCentralId ?? null,
    centralName,
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
    showInAlert: showInAlert ? 1 : 0,
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

async function fetchWootricEndUser(
  accessToken: string,
  endUserId: string
): Promise<WootricEndUser | null> {
  const response = await fetch(
    `${WOOTRIC_API_BASE_URL}/v1/end_users/${encodeURIComponent(endUserId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    }
  );
  if (!response.ok) return null;
  return (await response.json()) as WootricEndUser;
}

async function fetchWootricEndUserByExternalId(
  accessToken: string,
  centralId: string
): Promise<WootricEndUser | null> {
  const response = await fetch(
    `${WOOTRIC_API_BASE_URL}/v1/end_users/${encodeURIComponent(centralId)}?lookup_by_external_id=true`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Wootric usuário ${response.status}: ${detail.slice(0, 500)}`);
  }
  return (await response.json()) as WootricEndUser;
}

/**
 * Alguns usuários Wootric não têm `external_id`; neste tenant, o ID central
 * aparece no final do identificador do usuário. A listagem é paginada e fica
 * em cache curto para que a abertura de um card não repita a varredura.
 */
async function findWootricEndUsersByCentralId(
  accessToken: string,
  centralId: string
): Promise<WootricEndUser[]> {
  const key = centralId.trim();
  if (endUsersByCentralCache && endUsersByCentralCache.expiresAt > Date.now()) {
    return endUsersByCentralCache.values.get(key) ?? [];
  }

  const values = new Map<string, WootricEndUser[]>();
  for (let page = 1; page <= 30; page += 1) {
    const response = await fetch(
      `${WOOTRIC_API_BASE_URL}/v1/end_users?page=${page}&per_page=50&sort_order=desc&sort_key=updated_at`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
    );
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Wootric usuários ${response.status}: ${detail.slice(0, 500)}`);
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) break;
    const pageUsers = payload as WootricEndUser[];
    for (const user of pageUsers) {
      const userCentralId =
        user.external_id?.trim() || centralIdFromEmail(user.email);
      if (!userCentralId) continue;
      const users = values.get(userCentralId) ?? [];
      users.push(user);
      values.set(userCentralId, users);
    }
    if (pageUsers.length < 50) break;
  }
  endUsersByCentralCache = {
    expiresAt: Date.now() + CENTRAL_MAP_TTL_MS,
    values,
  };
  return values.get(key) ?? [];
}

async function fetchWootricEndUserResponses(
  accessToken: string,
  endUserId: string
): Promise<WootricApiResponse[]> {
  const responses: WootricApiResponse[] = [];
  for (let page = 1; page <= 30; page += 1) {
    const response = await fetch(
      `${WOOTRIC_API_BASE_URL}/v1/end_users/${encodeURIComponent(endUserId)}/responses?page=${page}&per_page=50&sort_order=desc&sort_key=created_at`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
    );
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Wootric histórico ${response.status}: ${detail.slice(0, 500)}`);
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) break;
    const pageResponses = payload as WootricApiResponse[];
    responses.push(...pageResponses);
    if (pageResponses.length < 50) break;
  }
  return responses;
}

async function enrichWithEndUser(
  response: WootricResponseInput,
  accessToken: string
): Promise<WootricResponseInput> {
  if (
    response.external_id ||
    centralIdFromEmail(response.email) ||
    !response.end_user_id
  ) {
    return response;
  }
  const endUser = await fetchWootricEndUser(accessToken, String(response.end_user_id));
  if (!endUser) return response;
  return {
    ...response,
    email: response.email ?? endUser.email ?? null,
    external_id: endUser.external_id ?? null,
    end_user: {
      id: endUser.id,
      email: endUser.email,
      external_id: endUser.external_id,
      properties: endUser.properties,
    },
    end_user_properties: response.end_user_properties ?? endUser.properties ?? null,
  };
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
  // O tenant informado inclui o ID central no final do campo e-mail da própria
  // resposta. Evita-se consultar cada perfil individualmente, o que torna a
  // busca de histórico lenta e suscetível a limites da API.
  return responses;
}

export async function upsertWootricResponse(
  response: WootricResponseInput,
  rawPayload: unknown = response,
  centralName?: string | null,
  showInAlert = true
) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const values = normalizeWootricResponse(
    response,
    rawPayload,
    centralName ?? null,
    showInAlert
  );
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
        // Uma consulta de histórico não pode ocultar uma avaliação recém-chegada
        // que ainda aguarda ciência de outros usuários.
        showInAlert: existing[0].showInAlert === 1 ? 1 : values.showInAlert,
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
  const centralNames = await getCentralNameMap();
  let inserted = 0;
  let updated = 0;
  for (const response of responses) {
    const centralId = centralIdFromResponse(response);
    const centralName = centralId ? centralNames.get(normalizeLookup(centralId)) ?? null : null;
    const result = await upsertWootricResponse(response, response, centralName);
    if (result.inserted) inserted += 1;
    else updated += 1;
  }
  return { fetched: responses.length, inserted, updated };
}

/**
 * O ID central é associado a um end_user da Wootric durante a sincronização.
 * O histórico usa esse end_user diretamente, sem varrer avaliações de todos
 * os clientes nem depender de filtros inexistentes na API Wootric.
 */
export async function getWootricHistoryByCentralId(centralId: string) {
  const requestedCentralId = centralId.trim();
  if (!requestedCentralId) return [];
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  let existing = await db
    .select()
    .from(wootricResponses)
    .where(eq(wootricResponses.externalId, requestedCentralId))
    .orderBy(desc(wootricResponses.createdAtWootric));
  if (existing.length === 0) {
    existing = await db
      .select()
      .from(wootricResponses)
      .where(like(wootricResponses.email, `%- ${requestedCentralId}`))
      .orderBy(desc(wootricResponses.createdAtWootric));
  }
  const accessToken = await getAccessToken();
  const knownEndUsers = existing
    .map(row => ({ id: row.endUserId, email: row.email }))
    .filter((user): user is { id: string; email: string | null } => Boolean(user.id));
  const externalIdUser =
    knownEndUsers.length === 0
      ? await fetchWootricEndUserByExternalId(accessToken, requestedCentralId)
      : null;
  const matchedEndUsers =
    knownEndUsers.length > 0
      ? knownEndUsers
      : externalIdUser?.id
        ? [externalIdUser]
        : await findWootricEndUsersByCentralId(accessToken, requestedCentralId);

  if (matchedEndUsers.length > 0) {
    const centralNames = await getCentralNameMap();
    const centralName =
      centralNames.get(normalizeLookup(requestedCentralId)) ?? null;
    for (const endUser of matchedEndUsers) {
      if (!endUser.id) continue;
      const history = await fetchWootricEndUserResponses(
        accessToken,
        String(endUser.id)
      );
      for (const response of history) {
        await upsertWootricResponse(
          {
            ...response,
            external_id: requestedCentralId,
            email: response.email ?? endUser.email ?? existing[0]?.email ?? null,
          },
          response,
          centralName,
          false
        );
      }
    }
  }

  return db
    .select()
    .from(wootricResponses)
    .where(eq(wootricResponses.externalId, requestedCentralId))
    .orderBy(desc(wootricResponses.createdAtWootric));
}

export async function hydrateExistingWootricCentralNames() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const rows = await db
    .select()
    .from(wootricResponses)
    .where(isNull(wootricResponses.externalId));
  if (rows.length === 0) return { hydrated: 0, unmatched: 0 };

  const centralNames = await getCentralNameMap();
  let hydrated = 0;
  let unmatched = 0;
  for (const row of rows) {
    const centralId = row.externalId ?? centralIdFromEmail(row.email);
    const centralName = centralId
      ? centralNames.get(normalizeLookup(centralId)) ?? null
      : null;
    if (!centralName) unmatched += 1;
    await db
      .update(wootricResponses)
      .set({
        externalId: centralId ?? null,
        centralName,
      })
      .where(eq(wootricResponses.id, row.id));
    if (centralName) hydrated += 1;
  }
  return { hydrated, unmatched };
}

export async function handleWootricWebhook(payload: WootricWebhookPayload) {
  if (!payload.response || !["created", "updated"].includes(payload.event_name ?? "created")) {
    return { accepted: true, ignored: true };
  }
  const accessToken = await getAccessToken();
  const response = await enrichWithEndUser(payload.response, accessToken);
  const centralId = centralIdFromResponse(response);
  const centralNames = await getCentralNameMap();
  const centralName = centralId ? centralNames.get(normalizeLookup(centralId)) ?? null : null;
  const result = await upsertWootricResponse(response, payload, centralName);
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

/**
 * Retorna o intervalo do dia corrente no fuso operacional do painel.
 * A Wootric persiste os timestamps em UTC; o painel é operado em São Paulo.
 */
export function getBrazilTodayRange(now = new Date()) {
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const start = new Date(`${localDate}T03:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function getPendingWootricResponses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { start, end } = getBrazilTodayRange();
  const [responses, acknowledgments] = await Promise.all([
    db
      .select()
      .from(wootricResponses)
      .where(
        and(
          eq(wootricResponses.showInAlert, 1),
          gte(wootricResponses.createdAtWootric, start),
          lt(wootricResponses.createdAtWootric, end)
        )
      )
      .orderBy(desc(wootricResponses.createdAtWootric))
      .limit(50),
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
