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
  concluidos: {
    value: number;
    clients: string[];
    source: "primary:KPI's!AK/AM";
    periodStart: string;
    periodEnd: string;
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

function dateKeyFromBrazilianDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
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
  const marcosRows = parseCsv(marcosCsv).slice(1);
  const clients = marcosRows.map(row => row[1]?.trim() ?? "").filter(Boolean);

  const { start, end } = getPreviousOnboardingWeek(referenceDate);
  const completedClients = parseCsv(kpisCsv)
    .slice(1)
    .map(row => ({
      name: row[36]?.trim() ?? "",
      implantedDate: dateKeyFromBrazilianDate(row[38] ?? ""),
    }))
    .filter(row => row.name && isWithinPeriod(row.implantedDate, start, end))
    .map(row => row.name);

  return {
    clientesAtivos: {
      value: clients.length,
      clients,
      source: "primary:Marcos",
    },
    concluidos: {
      value: completedClients.length,
      clients: completedClients,
      source: "primary:KPI's!AK/AM",
      periodStart: start,
      periodEnd: end,
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
