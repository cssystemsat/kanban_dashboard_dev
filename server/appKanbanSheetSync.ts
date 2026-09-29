export type AppKanbanSheetRow = {
  companyName: string;
  startDate: string;
  comercial: string;
};

function parseCsvRecords(csv: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let current = "";
  let insideQuotes = false;

  const pushCell = () => {
    record.push(current.trim());
    current = "";
  };
  const pushRecord = () => {
    if (record.length > 0 || current.length > 0) {
      pushCell();
      records.push(record);
    }
    record = [];
  };

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const nextCharacter = csv[index + 1];
    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === "," && !insideQuotes) {
      pushCell();
    } else if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      pushRecord();
    } else {
      current += character;
    }
  }
  if (record.length > 0 || current.length > 0) pushRecord();
  return records;
}

function normalizeDate(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const brazilian = normalized.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (brazilian) {
    const [, day, month, year] = brazilian;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function parseAppKanbanSheetRows(csv: string): AppKanbanSheetRow[] {
  return parseCsvRecords(csv)
    .map(row => ({
      startDate: normalizeDate(row[0] ?? ""),
      companyName: (row[1] ?? "").trim(),
      comercial: (row[2] ?? "").trim(),
    }))
    .filter(row => {
      const normalizedName = row.companyName.toLocaleUpperCase("pt-BR");
      return Boolean(row.companyName && row.startDate) && normalizedName !== "CLIENTE";
    }) as AppKanbanSheetRow[];
}

export function normalizeCompanyName(name: string): string {
  return name.trim().toLocaleUpperCase("pt-BR");
}
