import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "server/googleSheets.ts"),
  "utf8"
);
const routerSource = readFileSync(
  resolve(process.cwd(), "server/routers.ts"),
  "utf8"
);

describe("leitura resiliente de Google Sheets", () => {
  it("mantém cache temporário e deduplicação das leituras por aba", () => {
    expect(source).toContain("SHEET_CSV_CACHE_TTL_MS");
    expect(source).toContain("sheetCsvCache");
    expect(source).toContain("sheetCsvPending");
    expect(source).toContain("sheetNamePending");
  });

  it("usa o export CSV compartilhado quando a quota autenticada retorna 429", () => {
    expect(source).toContain("isSheetsQuotaError");
    expect(source).toContain("fetchSharedCsv");
    expect(source).toContain("Quota atingida; usando export CSV compartilhado");
  });

  it("mantém atualização manual como refresh forçado, sem desabilitar o cache normal", () => {
    expect(routerSource).toContain("forceRefresh: Boolean(input.refreshKey)");
  });
});
