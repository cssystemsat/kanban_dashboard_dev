import type { KPICard } from "./kpiDefinitions";

function numericValue(value: string | number): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const numericText = value
    .replace(/R\$\s*/g, "")
    .replace(/mil/gi, "")
    .replace(/%/g, "")
    .replace(/d$/i, "")
    .replace(/[^\d,.-]/g, "")
    .trim();
  if (!numericText) return null;
  const normalized = numericText.includes(",")
    ? numericText.replace(/\./g, "").replace(",", ".")
    : numericText;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDifference(
  value: number,
  currentValue: string | number
): string {
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (typeof currentValue === "string" && currentValue.includes("%"))
    return `${rounded}%`;
  if (typeof currentValue === "string" && /R\$/i.test(currentValue))
    return `R$ ${rounded}`;
  if (typeof currentValue === "string" && /d$/i.test(currentValue))
    return `${rounded}d`;
  return rounded;
}

/**
 * Calcula a comparação exclusivamente contra a mesma posição da Semana Retrasada.
 * Com base zero, não existe comparação estatística válida; por isso a informação é
 * neutralizada em vez de exibir uma tendência manual de outro período.
 */
export function applyKpiComparisons(
  current: KPICard[],
  previous: KPICard[]
): KPICard[] {
  return current.map((card, index) => {
    const currentNumber = numericValue(card.value);
    const previousNumber = numericValue(previous[index]?.value ?? 0);

    if (
      currentNumber === null ||
      previousNumber === null ||
      previousNumber === 0
    ) {
      return { ...card, trend: "neutral", trendValue: "—" };
    }

    const difference = currentNumber - previousNumber;
    return {
      ...card,
      trend: difference > 0 ? "up" : difference < 0 ? "down" : "neutral",
      trendValue:
        difference === 0
          ? "0"
          : `${difference > 0 ? "+" : ""}${formatDifference(difference, card.value)}`,
    };
  });
}
