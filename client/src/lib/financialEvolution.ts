export interface FinancialEvolutionPoint {
  month: string;
  boleto: number;
  minimo: number;
}

const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

/** Parseia uma linha CSV preservando valores entre aspas. */
export function parseFinancialCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === '"') {
      if (quoted && next === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current.trim());
  return values;
}

function parseMoney(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.trim().replace(/^"|"$/g, "");
  if (!normalized || normalized === "#N/A" || normalized === "#VALUE!") {
    return null;
  }

  const cleaned = normalized.replace(/[^0-9,.-]/g, "");
  if (!cleaned) return null;
  const numeric = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const parsed = Number(numeric);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Constrói a série financeira de um cliente até o mês anterior ao atual.
 * A planilha usa A = ID Central, D = mínimo e K em diante = Jan/2026 em diante.
 * Valores nulos, zero ou erros: repete o último boleto válido da série.
 */
export function buildFinancialEvolution(
  csv: string,
  centralId: string,
  monthCount = new Date().getMonth()
): FinancialEvolutionPoint[] {
  if (!csv || !centralId.trim()) return [];

  const targetId = centralId.trim();
  const lines = csv.split(/\r?\n/);
  const row = lines
    .slice(1)
    .map(parseFinancialCsvLine)
    .find(values => values[0]?.trim() === targetId);

  if (!row) return [];

  const minimum = parseMoney(row[3]) ?? 0;
  let previousBoleto = 0;
  const points: FinancialEvolutionPoint[] = [];

  for (let monthIndex = 0; monthIndex < monthCount; monthIndex += 1) {
    const boleto = parseMoney(row[10 + monthIndex]);
    if (boleto !== null) previousBoleto = boleto;
    points.push({
      month: MONTHS[monthIndex] ?? `Mês ${monthIndex + 1}`,
      boleto: previousBoleto,
      minimo: minimum,
    });
  }

  return points;
}
