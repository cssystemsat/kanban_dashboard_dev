import { describe, expect, it } from "vitest";
import {
  auditMarcos,
  auditOngoing,
  parseCsvRows,
} from "../client/src/lib/completionAudit";

function csvRow(values: string[]) {
  return values
    .map(value => `"${value.replaceAll('"', '""')}"`)
    .join(",");
}

describe("completion audit", () => {
  it("preserva quebras de linha e identifica campos vazios de Marcos", () => {
    const values = Array(54).fill("");
    values[0] = "COD-1";
    values[1] = "Alpha\nRastreamento";
    values[2] = "Ana";
    values[18] = "1043";
    values[23] = "Comercial";
    values[26] = "Objetivo 1";
    values[34] = "São Paulo";
    values[35] = "SP";
    values[42] = "R$ 100,00";
    values[53] = "R$ 200,00";

    const audit = auditMarcos(`A,B,C\n${csvRow(values)}`);

    expect(audit.totalMissingClients).toBe(1);
    expect(audit.issues[0]).toMatchObject({
      csm: "Ana",
      client: "Alpha\nRastreamento",
    });
    expect(audit.issues[0]?.missingFields).toEqual([
      "Pendente valores do contrato",
    ]);
  });

  it("audita as cinco colunas obrigatórias de Ongoing por CSM", () => {
    const values = Array(36).fill("");
    values[0] = "COD-2";
    values[1] = "Beta";
    values[2] = "Carlos";
    values[20] = "";
    values[23] = "Vendedor";
    values[34] = "Campinas";
    values[35] = "SP";

    const audit = auditOngoing(`A,B,C\n${csvRow(values)}`);

    expect(audit.issues).toEqual([
      {
        csm: "Carlos",
        client: "Beta",
        missingFields: ["ID Central (U)"],
      },
    ]);
  });

  it("não cria registros para linhas vazias ou cabeçalhos estruturais", () => {
    const rows = parseCsvRows('A,B,C\n,,\n"1 - Cliente",Cliente,Carlos');
    expect(rows).toHaveLength(2);
    expect(auditOngoing('A,B,C\n,,\n"1 - Cliente",Cliente,Carlos').issues).toHaveLength(0);
  });
});
