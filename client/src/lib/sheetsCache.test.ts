import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cachedFetch, clearSheetsCache, SHEET_CACHE_DURATION_MS } from "./sheetsCache";

describe("sheet proxy cache policy", () => {
  beforeEach(() => {
    clearSheetsCache();
    vi.stubGlobal("window", { location: { origin: "https://app.local" } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("mantém a janela de cache curta para dados operacionais", () => {
    expect(SHEET_CACHE_DURATION_MS).toBe(30_000);
  });

  it("consulta o proxy autenticado sem cache HTTP e com um cache-buster", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: { data: { json: { csv: "cabecalho\nvalor" } } } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await cachedFetch("https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/export?format=csv&gid=0");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/trpc\/sheets\.csv\?input=.*&_\d+$/),
      expect.objectContaining({ cache: "no-store", credentials: "include" }),
    );
  });
});
