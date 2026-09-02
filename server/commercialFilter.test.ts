import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  filterByCommercial,
  listCommercials,
} from "../shared/commercialFilter";

type Row = { comercial?: string | null; nome: string };

describe("Commercial filters", () => {
  it("lists distinct non-empty commercial values in locale order", () => {
    const rows: Row[] = [
      { nome: "A", comercial: "Vendas" },
      { nome: "B", comercial: "" },
      { nome: "C", comercial: "  Parcerias " },
      { nome: "D", comercial: "Vendas" },
      { nome: "E", comercial: null },
    ];

    expect(listCommercials(rows)).toEqual(["Parcerias", "Vendas"]);
  });

  it("filters by the trimmed commercial value and returns the same rows without a filter", () => {
    const rows: Row[] = [
      { nome: "A", comercial: "Vendas" },
      { nome: "B", comercial: "  Vendas " },
      { nome: "C", comercial: "Parcerias" },
    ];

    expect(filterByCommercial(rows, "Vendas").map(row => row.nome)).toEqual([
      "A",
      "B",
    ]);
    expect(filterByCommercial(rows, null)).toBe(rows);
  });

  it("wires the commercial filter into both operational pages", () => {
    const homeSource = readFileSync(
      resolve(process.cwd(), "client/src/pages/Home.tsx"),
      "utf8"
    );
    const ongoingSource = readFileSync(
      resolve(process.cwd(), "client/src/pages/Ongoing.tsx"),
      "utf8"
    );

    for (const source of [homeSource, ongoingSource]) {
      expect(source).toContain("selectedComercial");
      expect(source).toContain("Comercial");
      expect(source).toContain("filterByCommercial");
      expect(source).toContain("listCommercials");
    }
  });
});
