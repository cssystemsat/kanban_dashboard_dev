import { describe, expect, it } from "vitest";
import { isDateWithinRange } from "./dateCoverage";

describe("date coverage", () => {
  const weekStart = new Date(2026, 7, 24, 0, 0, 0);
  const weekEnd = new Date(2026, 7, 30, 23, 59, 59);
  const monthStart = new Date(2026, 7, 1, 0, 0, 0);
  const monthEnd = new Date(2026, 7, 31, 23, 59, 59);

  it("conta como semanal somente uma data da semana atual", () => {
    expect(isDateWithinRange(new Date(2026, 7, 25), weekStart, weekEnd)).toBe(
      true
    );
    expect(isDateWithinRange(new Date(2026, 7, 20), weekStart, weekEnd)).toBe(
      false
    );
  });

  it("conta como mensal uma data do mês atual mesmo que não esteja na semana", () => {
    expect(isDateWithinRange(new Date(2026, 7, 20), monthStart, monthEnd)).toBe(
      true
    );
    expect(isDateWithinRange(new Date(2026, 6, 31), monthStart, monthEnd)).toBe(
      false
    );
  });
});
