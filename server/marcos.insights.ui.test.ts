import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8"
);

describe("interface da lista de Insights de Marcos", () => {
  it("reabre a lista ao fechar o detalhe do cliente crítico", () => {
    expect(homeSource).toContain("setSelectedCriticalInsight(null);");
    expect(homeSource).toContain("setCriticalInsightsOpen(true);");
    expect(homeSource).toContain('aria-label="Fechar explicação"');
  });
});
