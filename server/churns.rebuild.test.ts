import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../client/src/pages/Churns.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../client/src/hooks/useChurnsData.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const sheets = readFileSync(new URL("./googleSheets.ts", import.meta.url), "utf8");

describe("aba Churn remodelada", () => {
  it("usa o layout atualizado da planilha e os filtros solicitados", () => {
    expect(hook).toContain("vendedor: row[11]");
    expect(hook).toContain("persona: row[2]");
    expect(hook).toContain("somaPerdas: null");
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
    expect(page).toContain('"Persona"');
    expect(page).toContain("Cadastrar boleto");
    expect(page).toContain("Adicionar persona");
    expect(page).toContain("Central de rastreamento");
    expect(page).toContain("Lobo soliário");
    expect(page).toContain("Empreendedor");
    expect(page).toContain("Soma das perdas");
    expect(page).toContain("byExitDate");
    expect(page).toContain("expectedClient");
    expect(page).toContain("Mês atual");
    expect(page).toContain("Últimos 3 meses");
    expect(page).toContain("Últimos 6 meses");
    expect(page).toContain("Esse ano");
    expect(page).toContain("activeTimeRange");
    expect(page).toContain("inferTimeRange");
  });

  it("exporta XLSX verdadeiro e envia somente os registros filtrados para a IA", () => {
    expect(page).toContain("XLSX.writeFile");
    expect(page).toContain("filteredData.map(toAnalysisRecord)");
    expect(router).toContain("churns: router");
    expect(router).toContain("generateAnalysis");
    expect(router).toContain("updateMotivo");
    expect(sheets).toContain('motivoCliente: "N"');
    expect(sheets).toContain('motivoComercial: "Q"');
    expect(sheets).toContain('ultimoBoleto: "R"');
    expect(sheets).toContain('persona: "C"');
    expect(sheets).toContain("A${data.row}:A${data.row}");
    expect(sheets).toContain("A linha da planilha mudou desde o carregamento");
  });
});
