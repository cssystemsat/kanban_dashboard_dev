import { getSheetCsv } from "./googleSheets";

export const MIGRATION_GID = 146618493;

export interface MigrationKpiMetrics {
  emAndamento: {
    value: number;
    clients: string[];
    source: "primary:Migração!T";
  };
  concluidas: {
    value: 0;
    source: "manual:temporário";
  };
  atrasadas: {
    value: number;
    clients: string[];
    source: "primary:Migração!D>365";
  };
  tempoMedio: {
    value: number;
    details: string[];
    source: "primary:Migração!C/D";
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

function isHeaderOrStructuralName(value: string): boolean {
  return /^(?:cliente|cliente com link da planilha|nome|empresa|total|total geral|-)$/i.test(
    value.trim()
  );
}

function parseSheetDate(value: string): string | null {
  const normalized = value.trim().replace(/^"|"$/g, "");
  if (!normalized) return null;
  const dateText = normalized.split(/[T\s]/, 1)[0];

  const brazilian = dateText.match(
    /^(\d{1,2})[\\/.-](\d{1,2})[\\/.-](\d{2}|\d{4})$/
  );
  if (brazilian) {
    const [, day, month, rawYear] = brazilian;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const iso = dateText.match(/^(\d{4})[\\/.-](\d{1,2})[\\/.-](\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

function normalizeStatus(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function formatDate(dateKey: string | null): string {
  if (!dateKey) return "Sem data";
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

export function parseMigrationKpiMetrics(csv: string): MigrationKpiMetrics {
  const records = parseCsv(csv)
    .map(row => ({
      name: row[4]?.trim() ?? "",
      startDate: parseSheetDate(row[2] ?? ""),
      durationDays: parseSheetNumber(row[3] ?? ""),
      status: normalizeStatus(row[19] ?? ""),
    }))
    .filter(row => row.name && !isHeaderOrStructuralName(row.name));

  const emAndamentoClients = records
    .filter(row => row.status === "em andamento")
    .map(row => row.name);

  const overdueClients = records
    .filter(row => row.durationDays !== null && row.durationDays > 365)
    .map(row => row.name);

  const averageRecords = records.filter(
    row => row.startDate !== null && row.durationDays !== null
  );
  const average = averageRecords.length
    ? averageRecords.reduce((sum, row) => sum + (row.durationDays ?? 0), 0) /
      averageRecords.length
    : 0;

  return {
    emAndamento: {
      value: emAndamentoClients.length,
      clients: emAndamentoClients,
      source: "primary:Migração!T",
    },
    concluidas: {
      value: 0,
      source: "manual:temporário",
    },
    atrasadas: {
      value: overdueClients.length,
      clients: overdueClients,
      source: "primary:Migração!D>365",
    },
    tempoMedio: {
      value: average,
      details: averageRecords.map(
        row =>
          `${row.name} — início em ${formatDate(row.startDate)} — ${row.durationDays?.toFixed(1)} dias`
      ),
      source: "primary:Migração!C/D",
    },
  };
}

const MIGRATION_METRICS_CACHE_TTL_MS = 30_000;
let cachedMigrationMetrics:
  | { value: MigrationKpiMetrics; expiresAt: number }
  | undefined;
let migrationMetricsRequest: Promise<MigrationKpiMetrics> | undefined;

export async function getMigrationKpiMetrics(): Promise<MigrationKpiMetrics> {
  const now = Date.now();
  if (cachedMigrationMetrics && cachedMigrationMetrics.expiresAt > now) {
    return cachedMigrationMetrics.value;
  }
  if (migrationMetricsRequest) return migrationMetricsRequest;

  migrationMetricsRequest = getSheetCsv("primary", MIGRATION_GID)
    .then(csv => {
      const value = parseMigrationKpiMetrics(csv);
      cachedMigrationMetrics = {
        value,
        expiresAt: Date.now() + MIGRATION_METRICS_CACHE_TTL_MS,
      };
      return value;
    })
    .finally(() => {
      migrationMetricsRequest = undefined;
    });

  return migrationMetricsRequest;
}
