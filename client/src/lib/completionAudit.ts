export type CompletionArea = "marcos" | "ongoing";

export type CompletionIssue = {
  csm: string;
  client: string;
  missingFields: string[];
};

export type CompletionAudit = {
  issues: CompletionIssue[];
  totalMissingClients: number;
};

export function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let insideQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());
    if (row.some(value => value !== "")) rows.push(row);
  }

  return rows;
}

function isEmpty(value: string | undefined): boolean {
  return !value || value.trim() === "";
}

function isHeaderName(value: string): boolean {
  const normalized = value.trim().toLocaleLowerCase("pt-BR");
  return normalized === "cliente" || /^\d+\s*-\s*cliente$/.test(normalized);
}

function buildAudit(
  csv: string,
  fields: Array<{ label: string; index: number }>
): CompletionAudit {
  const rows = parseCsvRows(csv);
  const issues: CompletionIssue[] = [];

  for (const row of rows.slice(1)) {
    const client = row[1]?.trim() ?? "";
    if (!client || isHeaderName(client)) continue;

    const missingFields = fields
      .filter(field => isEmpty(row[field.index]))
      .map(field => field.label);

    if (missingFields.length > 0) {
      issues.push({
        csm: row[2]?.trim() || "CSM não informado",
        client,
        missingFields,
      });
    }
  }

  issues.sort((a, b) =>
    a.csm.localeCompare(b.csm, "pt-BR", { sensitivity: "base" }) ||
    a.client.localeCompare(b.client, "pt-BR", { sensitivity: "base" })
  );

  return {
    issues,
    totalMissingClients: issues.length,
  };
}

function columnLabel(index: number): string {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

const MARCOS_FIELDS = [
  { label: "Código (A)", index: 0 },
  { label: "Comercial (X)", index: 23 },
  { label: "ID Central (S)", index: 18 },
  { label: "Objetivos (AA)", index: 26 },
  { label: "Cidade (AI)", index: 34 },
  { label: "Estado (AJ)", index: 35 },
  ...Array.from({ length: 12 }, (_, offset) => ({
    label: `Primeiro boleto (${columnLabel(42 + offset)})`,
    index: 42 + offset,
  })),
];

const ONGOING_FIELDS = [
  { label: "Código (A)", index: 0 },
  { label: "ID Central (U)", index: 20 },
  { label: "Vendedor (X)", index: 23 },
  { label: "Cidade (AI)", index: 34 },
  { label: "Estado (AJ)", index: 35 },
];

export function auditMarcos(csv: string): CompletionAudit {
  return buildAudit(csv, MARCOS_FIELDS);
}

export function auditOngoing(csv: string): CompletionAudit {
  return buildAudit(csv, ONGOING_FIELDS);
}
