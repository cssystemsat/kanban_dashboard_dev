export function parseMarcosDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  const normalized = value.trim();

  const br = normalized.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:\s|$)/);
  if (br) {
    const [, day, month, year] = br;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
      ? date
      : null;
  }

  const iso = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s|T|$)/);
  if (iso) {
    const [, year, month, day] = iso;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
      ? date
      : null;
  }

  return null;
}

export function isMarcosDateInRange(
  value: string | undefined,
  start?: Date | null,
  end?: Date | null
): boolean {
  const date = parseMarcosDate(value);
  if (!date) return false;

  // Compare only the calendar day. This avoids excluding a client when the
  // input date comes from an HTML date control or a timestamp with another
  // time zone.
  const dayKey = (candidate: Date) =>
    candidate.getFullYear() * 10000 +
    (candidate.getMonth() + 1) * 100 +
    candidate.getDate();

  const clientDay = dayKey(date);
  const startDay = start ? dayKey(start) : Number.NEGATIVE_INFINITY;
  const endDay = end ? dayKey(end) : Number.POSITIVE_INFINITY;

  return clientDay >= startDay && clientDay <= endDay;
}
