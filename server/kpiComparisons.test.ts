import { describe, expect, it } from "vitest";
import { applyKpiComparisons } from "../shared/kpiComparisons";
import type { KPICard } from "../shared/kpiDefinitions";

function card(value: string | number, trendValue = "+4"): KPICard {
  return {
    label: "Indicador",
    value,
    status: "good",
    trend: "up",
    trendValue,
  };
}

describe("Comparação dos KPI’s contra a Semana Retrasada", () => {
  it("não mostra tendência manual quando a base da Semana Retrasada é zero", () => {
    const result = applyKpiComparisons([card(156)], [card(0)]);
    expect(result[0]).toMatchObject({ trend: "neutral", trendValue: "—" });
  });

  it("calcula a diferença quando existe uma base histórica não nula", () => {
    const result = applyKpiComparisons([card(156)], [card(150)]);
    expect(result[0]).toMatchObject({ trend: "up", trendValue: "+6" });
  });

  it("preserva a unidade de percentuais e dias na comparação", () => {
    expect(
      applyKpiComparisons([card("87%")], [card("80%")])[0].trendValue
    ).toBe("+7%");
    expect(
      applyKpiComparisons([card("12.5d")], [card("10d")])[0].trendValue
    ).toBe("+2.5d");
  });
});
