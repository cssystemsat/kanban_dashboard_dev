import type { AdminNotice } from "../drizzle/schema";

export interface BrazilNowParts {
  date: string;
  time: string;
  weekday: number;
}

function numberPart(parts: Intl.DateTimeFormatPart[], type: string): number {
  return Number(parts.find(part => part.type === type)?.value ?? 0);
}

export function getBrazilNowParts(now = new Date()): BrazilNowParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = formatter.formatToParts(now);
  const year = numberPart(parts, "year");
  const month = numberPart(parts, "month");
  const day = numberPart(parts, "day");
  const hour = numberPart(parts, "hour");
  const minute = numberPart(parts, "minute");
  const weekdayName = parts.find(part => part.type === "weekday")?.value;
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekdayName ?? ""
  );

  return {
    date: `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
    time: `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`,
    weekday: weekday < 0 ? 0 : weekday,
  };
}

function parseJsonArray<T>(value: string | null | undefined, fallback: T[]): T[] {
  if (!value) return fallback;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function previousDate(date: string, offset: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day - offset));
  return `${value.getUTCFullYear().toString().padStart(4, "0")}-${(value.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}-${value.getUTCDate().toString().padStart(2, "0")}`;
}

function weekdayForDate(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Retorna a chave da ocorrência que já começou e ainda aguarda ciência. */
export function getCurrentNoticeOccurrence(
  notice: Pick<AdminNotice, "scheduleType" | "startDate" | "startTime" | "immediate" | "daysOfWeek" | "timesOfDay">,
  now = new Date()
): string | null {
  const current = getBrazilNowParts(now);

  if (notice.scheduleType === "unique") {
    if (notice.immediate) return "unique-immediate";
    if (!notice.startDate || !notice.startTime) return null;
    return `${current.date} ${current.time}` >= `${notice.startDate} ${notice.startTime}`
      ? `unique-${notice.startDate}-${notice.startTime}`
      : null;
  }

  const days = parseJsonArray<number>(notice.daysOfWeek, []);
  const times = parseJsonArray<string>(notice.timesOfDay, []).sort();
  if (!days.length || !times.length) return null;

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidateDate = previousDate(current.date, offset);
    if (notice.startDate && candidateDate < notice.startDate) continue;
    const candidateWeekday = weekdayForDate(candidateDate);
    if (!days.includes(candidateWeekday)) continue;

    const eligibleTimes = times.filter(time =>
      candidateDate < current.date || time <= current.time
    );
    if (eligibleTimes.length === 0) continue;
    const occurrenceTime = eligibleTimes[eligibleTimes.length - 1];
    return `periodic-${candidateDate}-${occurrenceTime}`;
  }

  return null;
}

export function noticeRecipientEmails(notice: Pick<AdminNotice, "recipientMode" | "recipientEmails">): string[] {
  return parseJsonArray<string>(notice.recipientEmails, [])
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export function noticeTargetsUser(
  notice: Pick<AdminNotice, "recipientMode" | "recipientEmails">,
  email: string
): boolean {
  return notice.recipientMode === "all" || noticeRecipientEmails(notice).includes(email.toLowerCase());
}
