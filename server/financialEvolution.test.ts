import { describe, expect, it } from "vitest";
import { buildFinancialEvolution } from "../client/src/lib/financialEvolution";

describe("financial evolution", () => {
  it("matches the central ID and repeats the previous valid boleto", () => {
    const row = Array.from({ length: 22 }, () => "");
    row[0] = "1043";
    row[3] = "R$ 1.000,00";
    row[10] = "R$ 1.250,00";
    row[11] = "0";
    row[12] = "#N/A";
    row[13] = "R$ 1.400,00";

    const csvRow = row
      .map(value => (value.includes(",") ? `"${value}"` : value))
      .join(",");
    const points = buildFinancialEvolution(`A,B,C,D\n${csvRow}`, "1043");

    expect(points.slice(0, 4)).toEqual([
      { month: "Jan", boleto: 1250, minimo: 1000 },
      { month: "Fev", boleto: 1250, minimo: 1000 },
      { month: "Mar", boleto: 1250, minimo: 1000 },
      { month: "Abr", boleto: 1400, minimo: 1000 },
    ]);
  });

  it("returns no series for an unknown central ID", () => {
    expect(buildFinancialEvolution("A,B,C,D\n1043,,,100", "999")).toEqual([]);
  });
});
