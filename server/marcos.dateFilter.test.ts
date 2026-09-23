import { describe, expect, it } from "vitest";
import {
  isMarcosDateInRange,
  parseMarcosDate,
} from "../client/src/lib/marcosDateFilter";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Filtro de data da aba Marcos", () => {
  it("interpreta datas brasileiras e ISO como datas locais", () => {
    expect(parseMarcosDate("23/09/2026")?.getFullYear()).toBe(2026);
    expect(parseMarcosDate("23/09/2026")?.getMonth()).toBe(8);
    expect(parseMarcosDate("2026-09-23")?.getDate()).toBe(23);
  });

  it("inclui o dia final selecionado no período", () => {
    const start = new Date(2026, 8, 23);
    const end = new Date(2026, 8, 23);
    expect(isMarcosDateInRange("23/09/2026", start, end)).toBe(true);
    expect(isMarcosDateInRange("22/09/2026", start, end)).toBe(false);
  });

  it("mantém os presets de contrato como filtro aberto no início", () => {
    expect(isMarcosDateInRange("01/01/2020", new Date(0), new Date(2026, 8, 23))).toBe(true);
  });

  it("converte o input HTML de data sem deslocamento UTC", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/components/DateFilterCompact.tsx"),
      "utf8"
    );
    expect(source).toContain("const parseDateInput = (value: string)");
    expect(source).not.toContain("const start = new Date(startDate)");
  });
});
