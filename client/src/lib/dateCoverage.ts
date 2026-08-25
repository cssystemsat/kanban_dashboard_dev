export function isDateWithinRange(date: Date | null, start: Date, end: Date): boolean {
  return Boolean(date && date >= start && date <= end);
}
