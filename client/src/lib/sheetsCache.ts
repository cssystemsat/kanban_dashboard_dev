interface CacheEntry {
  data: string;
  timestamp: number;
}

interface SheetRequest {
  source: "primary" | "secondary";
  gid: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000;
const pendingRequests = new Map<string, Promise<string>>();

const PRIMARY_ID = "1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc";
const SECONDARY_ID = "1PYxRbfNVXWoOG9dJaQwb_GSqYhp8WgKF-KjUtYouuS4";
const LEGACY_PRIMARY_PUBLISH_ID = "2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC";
const LEGACY_SECONDARY_PUBLISH_ID = "2PACX-1vSLsjnFmBMUVU4KF_uCsoRJ9OF0LyEu_ZNxYUClHITba3sfkjyKz-kdSNzQ6CMtdXTiGwkion6m-XJj";

function resolveSheetRequest(rawUrl: string): SheetRequest | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl, window.location.origin);
  } catch {
    return null;
  }

  const gid = Number(parsed.searchParams.get("gid") ?? "0");
  if (!Number.isInteger(gid) || gid < 0) return null;

  const match = parsed.pathname.match(/\/spreadsheets\/d\/(?:e\/)?([^/]+)/);
  const documentId = match?.[1];
  if (documentId === PRIMARY_ID || documentId === LEGACY_PRIMARY_PUBLISH_ID) {
    return { source: "primary", gid };
  }
  if (documentId === SECONDARY_ID || documentId === LEGACY_SECONDARY_PUBLISH_ID) {
    return { source: "secondary", gid };
  }
  return null;
}

async function fetchThroughSheetProxy(request: SheetRequest): Promise<string> {
  const input = encodeURIComponent(JSON.stringify({ json: request }));
  const response = await fetch(`/api/trpc/sheets.csv?input=${input}`, { credentials: "include" });
  const body = await response.json().catch(() => null) as any;
  if (!response.ok) {
    throw new Error(body?.error?.json?.message ?? body?.error?.message ?? `HTTP ${response.status}`);
  }
  const csv = body?.result?.data?.json?.csv ?? body?.result?.data?.csv;
  if (typeof csv !== "string") throw new Error("Resposta inválida da integração com Google Sheets");
  return csv;
}

/**
 * Fetch com cache para URLs do Google Sheets.
 * URLs das planilhas conhecidas passam pelo backend autenticado; URLs externas continuam sendo lidas normalmente.
 */
export async function cachedFetch(url: string, _options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return new Response(cached.data, { status: 200, statusText: "OK" });
  }

  const pending = pendingRequests.get(url);
  if (pending) {
    const data = await pending;
    return new Response(data, { status: 200, statusText: "OK" });
  }

  const sheetRequest = resolveSheetRequest(url);
  const fetchPromise = sheetRequest
    ? fetchThroughSheetProxy(sheetRequest)
    : fetch(url, { redirect: "follow" }).then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.text();
      });

  pendingRequests.set(url, fetchPromise);
  try {
    const data = await fetchPromise;
    cache.set(url, { data, timestamp: Date.now() });
    return new Response(data, { status: 200, statusText: "OK" });
  } finally {
    pendingRequests.delete(url);
  }
}

export function clearSheetsCache() {
  cache.clear();
}

export function invalidateCache(url: string) {
  cache.delete(url);
}
