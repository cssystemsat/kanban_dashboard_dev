import { getSheetCsv } from "./googleSheets";

export const ONBOARDING_GID = 0;
export const KPI_SHEET_GID = 1590626518;
export const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

export interface OnboardingKpiMetrics {
  clientesAtivos: {
    value: number;
    clients: string[];
    source: "primary:Marcos";
  };
  dentroDoPrazo: {
    value: number;
    percentage: number;
    clients: string[];
    source: "primary:Marcos!AK:AO";
  };
  concluidos: {
    value: number;
    clients: string[];
    source: "primary:KPI's!AK/AM";
    periodStart: string;
    periodEnd: string;
  };
  tempoMedio: {
    value: number;
    source: "primary:KPI's!AL";
  };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsv(csv: string): string[][] {
  return csv
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(parseCsvLine);
}

function brtDateKey(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: BRAZIL_TIME_ZONE });
}

function dateKeyFromSheetDate(value: string): string | null {
  const normalized = value.trim().replace(/^"|"$/g, "");
  if (!normalized) return null;

  const dateText = normalized.split(/[T\s]/, 1)[0];
  const brazilian = dateText.match(/^(\d{1,2})[\\/.-](\d{1,2})[\\/.-](\d{4})$/);
  if (brazilian) {
    const [, day, month, year] = brazilian;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const iso = dateText.match(/^(\d{4})[\\/.-](\d{1,2})[\\/.-](\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Google Sheets pode exportar uma data como número serial do Excel.
  const serial = Number(dateText);
  if (Number.isInteger(serial) && serial >= 20000 && serial <= 60000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + serial * 86_400_000)
      .toISOString()
      .slice(0, 10);
  }

  return null;
}

function isStructuralClientName(value: string): boolean {
  return /^(?:kpi|valor|quantidade|cliente|2\s*-\s*cliente|true|false|n\/a|-)$/i.test(
    value.trim()
  );
}

function parseSheetNumber(value: string): number | null {
  const numericText = value
    .trim()
    .replace(/[^\d,.-]/g, "")
    .trim();
  if (!numericText) return null;
  const normalized = numericText.includes(",")
    ? numericText.replace(/\./g, "").replace(",", ".")
    : numericText;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function isMarcoOverdue(value: string, referenceDate: Date): boolean {
  const dateKey = dateKeyFromSheetDate(value);
  return dateKey !== null && dateKey < brtDateKey(referenceDate);
}

function shiftDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getPreviousOnboardingWeek(referenceDate = new Date()): {
  start: string;
  end: string;
} {
  const todayInBrazil = new Date(`${brtDateKey(referenceDate)}T12:00:00Z`);
  const weekday = todayInBrazil.getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  const currentWeekStart = shiftDateKey(
    brtDateKey(referenceDate),
    -daysSinceMonday
  );
  return {
    start: shiftDateKey(currentWeekStart, -7),
    end: shiftDateKey(currentWeekStart, -1),
  };
}

function isWithinPeriod(
  dateKey: string | null,
  start: string,
  end: string
): boolean {
  return dateKey !== null && dateKey >= start && dateKey <= end;
}

export function parseOnboardingKpiMetrics(
  marcosCsv: string,
  kpisCsv: string,
  referenceDate = new Date()
): OnboardingKpiMetrics {
  const marcoRecords = parseCsv(marcosCsv)
    .map(row => ({
      name: row[1]?.trim() ?? "",
      marcos: row.slice(36, 41).map(value => value?.trim() ?? ""),
    }))
    .filter(row => Boolean(row.name) && !isStructuralClientName(row.name));
  const clients = marcoRecords.map(row => row.name);
  const withinDeadlineClients = marcoRecords
    .filter(row => {
      const firstIncompleteMarco = row.marcos.find(
        value => value.toUpperCase() !== "OK"
      );
      return (
        !firstIncompleteMarco ||
        !isMarcoOverdue(firstIncompleteMarco, referenceDate)
      );
    })
    .map(row => row.name);
  const withinDeadlinePercentage = clients.length
    ? (withinDeadlineClients.length / clients.length) * 100
    : 0;

  const { start, end } = getPreviousOnboardingWeek(referenceDate);
  const kpiRecords = parseCsv(kpisCsv).map(row => ({
    name: row[36]?.trim() ?? "",
    averageDays: parseSheetNumber(row[37] ?? ""),
    implantedDate: dateKeyFromSheetDate(row[38] ?? ""),
  }));
  const completedClients = kpiRecords
    .map(row => ({
      name: row.name,
      implantedDate: row.implantedDate,
    }))
    .filter(
      row =>
        Boolean(row.name) &&
        !isStructuralClientName(row.name) &&
        isWithinPeriod(row.implantedDate, start, end)
    )
    .map(row => row.name);

  return {
    clientesAtivos: {
      value: clients.length,
      clients,
      source: "primary:Marcos",
    },
    dentroDoPrazo: {
      value: withinDeadlineClients.length,
      percentage: withinDeadlinePercentage,
      clients: withinDeadlineClients,
      source: "primary:Marcos!AK:AO",
    },
    concluidos: {
      value: completedClients.length,
      clients: completedClients,
      source: "primary:KPI's!AK/AM",
      periodStart: start,
      periodEnd: end,
    },
    tempoMedio: {
      value: (() => {
        const values = kpiRecords
          .filter(row => row.name && !isStructuralClientName(row.name))
          .map(row => row.averageDays)
          .filter((value): value is number => value !== null);
        return values.length
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : 0;
      })(),
      source: "primary:KPI's!AL",
    },
  };
}

export async function getOnboardingKpiMetrics(
  referenceDate = new Date()
): Promise<OnboardingKpiMetrics> {
  const [marcosCsv, kpisCsv] = await Promise.all([
    getSheetCsv("primary", ONBOARDING_GID),
    getSheetCsv("primary", KPI_SHEET_GID),
  ]);
  return parseOnboardingKpiMetrics(marcosCsv, kpisCsv, referenceDate);
}
