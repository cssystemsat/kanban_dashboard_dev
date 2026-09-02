export interface CommercialRecord {
  comercial?: string | null;
}

export function listCommercials<T extends CommercialRecord>(
  rows: T[]
): string[] {
  return Array.from(
    new Set(
      rows
        .map(row => row.comercial?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function filterByCommercial<T extends CommercialRecord>(
  rows: T[],
  selectedCommercial: string | null
): T[] {
  if (!selectedCommercial) return rows;
  return rows.filter(row => row.comercial?.trim() === selectedCommercial);
}
