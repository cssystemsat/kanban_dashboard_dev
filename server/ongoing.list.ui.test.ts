import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ongoingSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Ongoing.tsx"),
  "utf8"
);

describe("Ongoing — visualização em lista", () => {
  it("mantém Cards como padrão e oferece alternância para Lista", () => {
    expect(ongoingSource).toContain('useState<ViewMode>("cards")');
    expect(ongoingSource).toContain("Cards");
    expect(ongoingSource).toContain("Lista");
    expect(ongoingSource).toContain("LayoutGrid");
    expect(ongoingSource).toContain("<List");
  });

  it("oferece as três faixas de clientes sem contato", () => {
    expect(ongoingSource).toContain('value="dia">Sem contato no dia');
    expect(ongoingSource).toContain('value="semana">Sem contato na semana');
    expect(ongoingSource).toContain('value="mes">Sem contato no mês');
    expect(ongoingSource).toContain('contactAgeFilter === "dia"');
    expect(ongoingSource).toContain('contactAgeFilter === "semana"');
    expect(ongoingSource).toContain('contactAgeFilter === "mes"');
  });

  it("exibe as colunas solicitadas e exporta a lista filtrada para XLSX", () => {
    for (const label of [
      "Nome do cliente",
      "Placas",
      "Último contato",
      "Boleto",
      "Comercial",
      "CSM",
      "Situação",
      "Decisor",
      "Contato do decisor",
    ]) {
      expect(ongoingSource).toContain(label);
    }
    expect(ongoingSource).toContain('import * as XLSX from "xlsx"');
    expect(ongoingSource).toContain("XLSX.writeFile");
    expect(ongoingSource).toContain("sortDirection");
    expect(ongoingSource).toContain("sortKey");
  });
});
