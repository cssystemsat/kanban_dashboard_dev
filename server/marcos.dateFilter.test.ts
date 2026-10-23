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
    expect(parseMarcosDate("23-09-2026")?.getDate()).toBe(23);
    expect(parseMarcosDate("2026-09-23T12:00:00Z")?.getDate()).toBe(23);
  });

  it("inclui o dia final selecionado no período", () => {
    const start = new Date(2026, 8, 23);
    const end = new Date(2026, 8, 23);
    expect(isMarcosDateInRange("23/09/2026", start, end)).toBe(true);
    expect(isMarcosDateInRange("22/09/2026", start, end)).toBe(false);
  });

  it("aceita somente um dos limites quando o filtro está parcialmente preenchido", () => {
    const start = new Date(2026, 8, 23);
    const end = new Date(2026, 8, 23);
    expect(isMarcosDateInRange("24/09/2026", start, null)).toBe(true);
    expect(isMarcosDateInRange("22/09/2026", start, null)).toBe(false);
    expect(isMarcosDateInRange("22/09/2026", null, end)).toBe(true);
    expect(isMarcosDateInRange("24/09/2026", null, end)).toBe(false);
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
    expect(source).toContain("createPortal");
    expect(source).toContain("fixed right-2 top-12");
  });

  it("conecta o filtro De/Até do cabeçalho à data de entrada do kanban", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/Home.tsx"),
      "utf8"
    );
    expect(source).toContain("parseMarcosDate(marcosTrendStartDate)");
    expect(source).toContain("parseMarcosDate(marcosTrendEndDate)");
    expect(source).toContain(
      "isMarcosDateInRange(client.entrada, trendStartDate, trendEndDate)"
    );
  });
});
