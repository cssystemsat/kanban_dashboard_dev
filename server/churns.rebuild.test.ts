import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../client/src/pages/Churns.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../client/src/hooks/useChurnsData.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const sheets = readFileSync(new URL("./googleSheets.ts", import.meta.url), "utf8");

describe("aba Churn remodelada", () => {
  it("usa o layout atualizado da planilha e os filtros solicitados", () => {
    expect(hook).toContain("vendedor: row[11]");
    expect(hook).toContain("motivoFinanceiro: row[15]");
    expect(hook).toContain("parseBrazilianCurrency");
    expect(page).toContain("selectedCsm");
    expect(page).toContain("selectedVendedor");
    expect(page).toContain("Cancelamento por tipo");
    expect(page).toContain("Motivo Financeiro");
    expect(page).toContain("Motivo Comercial");
    expect(page).toContain("new Set(MONTHS.map");
    expect(page).toContain("Cadastrar motivo");
    expect(page).toContain("updateMotivoMutation");
  });

  it("exporta XLSX verdadeiro e envia somente os registros filtrados para a IA", () => {
    expect(page).toContain("XLSX.writeFile");
    expect(page).toContain("filteredData.map(toAnalysisRecord)");
    expect(router).toContain("churns: router");
    expect(router).toContain("generateAnalysis");
    expect(router).toContain("updateMotivo");
    expect(sheets).toContain('motivoCliente: "N"');
    expect(sheets).toContain('motivoComercial: "Q"');
  });
});
