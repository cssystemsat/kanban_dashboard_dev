import { and, eq } from "drizzle-orm";
import { analystScoreHistory, analystScoreSchedules, analystScores } from "../drizzle/schema";
import { getDb } from "./db";

const ONBOARDING_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC/pub?output=csv";
const ONGOING_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC/pub?gid=1152476970&single=true&output=csv";
const COVERAGE_TARGET = 0.25;
const WEEKLY_PENALTY = 8;

type ScoreCategory = "onboarding" | "ongoing";

type PenaltyLog = {
  date: string;
  points: number;
  reason: string;
  periodKey?: string;
};

type CoverageRecord = {
  analystName: string;
  totalClients: number;
  contactedClients: number;
  coverage: number;
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseBrazilianDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
}

function brtDateKey(date = new Date()): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

function yearMonthForBrt(date = new Date()): string {
  return brtDateKey(date).slice(0, 7);
}

function weekWindowForBrt(date = new Date()): { start: Date; end: Date; key: string } {
  const brt = new Date(`${brtDateKey(date)}T12:00:00Z`);
  const weekday = brt.getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  const start = new Date(brt);
  start.setUTCDate(brt.getUTCDate() - daysSinceMonday);
  const end = new Date(brt);
  return { start, end, key: brtDateKey(date) };
}

async function fetchCoverage(url: string): Promise<CoverageRecord[]> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`Falha ao carregar cobertura: HTTP ${response.status}`);

  const csv = await response.text();
  const { start, end } = weekWindowForBrt();
  const groups = new Map<string, { total: number; contacted: number }>();

  for (const line of csv.split("\n").slice(1)) {
    if (!line.trim()) continue;
    const row = parseCsvLine(line);
    const analystName = (row[2] ?? "").trim(); // coluna C: CSM
    if (!analystName) continue;

    const current = groups.get(analystName) ?? { total: 0, contacted: 0 };
    current.total += 1;

    const lastContact = parseBrazilianDate(row[11] ?? ""); // coluna L: último contato
    if (lastContact && lastContact >= start && lastContact <= end) current.contacted += 1;
    groups.set(analystName, current);
  }

  return [...groups.entries()].map(([analystName, values]) => ({
    analystName,
    totalClients: values.total,
    contactedClients: values.contacted,
    coverage: values.total > 0 ? values.contacted / values.total : 0,
  }));
}

function parsePenalties(value: string): PenaltyLog[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function applyPenaltyIfNeeded(category: ScoreCategory, analyst: CoverageRecord, yearMonth: string, periodKey: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const existing = await db.select().from(analystScores).where(and(
    eq(analystScores.analystName, analyst.analystName),
    eq(analystScores.category, category),
    eq(analystScores.yearMonth, yearMonth),
  ));

  const record = existing[0];
  const penalties = record ? parsePenalties(record.penaltiesJson) : [];
  if (penalties.some((penalty) => penalty.periodKey === periodKey)) return false;

  penalties.push({
    date: periodKey.split("-").reverse().join("/"),
    points: WEEKLY_PENALTY,
    reason: "meta de contato (< 25%)",
    periodKey,
  });

  const score = Math.max(0, (record?.score ?? 100) - WEEKLY_PENALTY);
  const penaltiesJson = JSON.stringify(penalties);

  if (record) {
    await db.update(analystScores).set({ score, penaltiesJson }).where(eq(analystScores.id, record.id));
  } else {
    await db.insert(analystScores).values({
      analystName: analyst.analystName,
      category,
      yearMonth,
      score,
      penaltiesJson,
    });
  }
  return true;
}

export async function runWeeklyCoveragePenalty(): Promise<{ applied: number; skipped: number }> {
  const yearMonth = yearMonthForBrt();
  const periodKey = `weekly-${weekWindowForBrt().key}`;
  const [onboarding, ongoing] = await Promise.all([
    fetchCoverage(ONBOARDING_URL),
    fetchCoverage(ONGOING_URL),
  ]);

  let applied = 0;
  let skipped = 0;
  for (const [category, records] of [["onboarding", onboarding], ["ongoing", ongoing]] as const) {
    for (const analyst of records.filter((record) => record.coverage < COVERAGE_TARGET)) {
      const wasApplied = await applyPenaltyIfNeeded(category, analyst, yearMonth, periodKey);
      if (wasApplied) applied += 1;
      else skipped += 1;
    }
  }
  return { applied, skipped };
}

export async function closePreviousMonthAndResetScores(): Promise<{ saved: number; previousMonth: string; currentMonth: string }> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const currentMonth = yearMonthForBrt();
  const previousDate = new Date(`${currentMonth}-01T12:00:00Z`);
  previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
  const previousMonth = previousDate.toISOString().slice(0, 7);
  const previousScores = await db.select().from(analystScores).where(eq(analystScores.yearMonth, previousMonth));
  const existingHistory = await db.select().from(analystScoreHistory).where(eq(analystScoreHistory.yearMonth, previousMonth));
  const savedKeys = new Set(existingHistory.map((record) => `${record.analystName}|${record.category}`));
  const scoreByKey = new Map(previousScores.map((record) => [`${record.analystName}|${record.category}`, record]));
  const [onboarding, ongoing] = await Promise.all([
    fetchCoverage(ONBOARDING_URL),
    fetchCoverage(ONGOING_URL),
  ]);
  const analystsToSnapshot = [
    ...onboarding.map((analyst) => ({ analystName: analyst.analystName, category: "onboarding" })),
    ...ongoing.map((analyst) => ({ analystName: analyst.analystName, category: "ongoing" })),
  ];

  let saved = 0;
  for (const analyst of analystsToSnapshot) {
    const key = `${analyst.analystName}|${analyst.category}`;
    if (savedKeys.has(key)) continue;
    const score = scoreByKey.get(key);
    await db.insert(analystScoreHistory).values({
      analystName: analyst.analystName,
      category: analyst.category,
      yearMonth: previousMonth,
      finalScore: score?.score ?? 100,
      penaltiesJson: score?.penaltiesJson ?? "[]",
    });
    saved += 1;
  }

  // As pontuações são segregadas pela competência; ao consultar o novo mês, o ranking começa em 100 pontos.
  return { saved, previousMonth, currentMonth };
}

export async function isRegisteredScoreSchedule(jobType: "weekly_penalty" | "monthly_reset", taskUid: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const schedule = await db.select().from(analystScoreSchedules).where(and(
    eq(analystScoreSchedules.jobType, jobType),
    eq(analystScoreSchedules.taskUid, taskUid),
  ));
  return schedule.length > 0;
}
