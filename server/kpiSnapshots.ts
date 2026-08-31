import { KPI_MANUAL_WEEK_VALUES } from "@shared/kpiDefinitions";
import { getLatestKpiWeeklySnapshot, saveKpiWeeklySnapshot } from "./db";

function brtDateKey(date = new Date()): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

export function getKpiClosingPeriodKey(date = new Date()): string {
  const brtDate = new Date(`${brtDateKey(date)}T12:00:00Z`);
  const weekday = brtDate.getUTCDay();
  const daysSinceFriday = (weekday + 2) % 7;
  brtDate.setUTCDate(brtDate.getUTCDate() - daysSinceFriday);
  return brtDate.toISOString().slice(0, 10);
}

export async function closeKpiWeeklySnapshot(date = new Date()) {
  const periodKey = getKpiClosingPeriodKey(date);
  const result = await saveKpiWeeklySnapshot({
    periodKey,
    valuesJson: JSON.stringify(KPI_MANUAL_WEEK_VALUES),
    closedAt: date,
  });
  const snapshot = result.snapshot;

  return {
    periodKey: snapshot.periodKey,
    created: result.created,
    closedAt: snapshot.closedAt,
  };
}

export async function getPreviousKpiWeeklyValues() {
  const snapshot = await getLatestKpiWeeklySnapshot();
  if (!snapshot) return null;

  try {
    return {
      periodKey: snapshot.periodKey,
      closedAt: snapshot.closedAt,
      values: JSON.parse(snapshot.valuesJson),
    };
  } catch (error) {
    console.error("[KPI] Snapshot semanal inválido:", error);
    return null;
  }
}
