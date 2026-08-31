import {
  KPI_MANUAL_WEEK_VALUES,
  type KpiManualValues,
} from "@shared/kpiDefinitions";
import { getOnboardingKpiMetrics } from "./kpiMetrics";
import { getMigrationKpiMetrics } from "./migrationMetrics";
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

export async function getCurrentKpiValues(
  referenceDate = new Date()
): Promise<KpiManualValues> {
  const [metrics, migrationMetrics] = await Promise.all([
    getOnboardingKpiMetrics(referenceDate),
    getMigrationKpiMetrics(),
  ]);
  return {
    ...KPI_MANUAL_WEEK_VALUES,
    onboarding: KPI_MANUAL_WEEK_VALUES.onboarding.map((card, index) => {
      if (index === 0) {
        return {
          ...card,
          value: metrics.clientesAtivos.value,
          details: metrics.clientesAtivos.clients,
          detailsTitle: "Clientes na aba Marcos",
        };
      }
      if (index === 1) {
        return {
          ...card,
          value: metrics.concluidos.value,
          details: metrics.concluidos.clients,
          detailsTitle: `Implantados de ${metrics.concluidos.periodStart} a ${metrics.concluidos.periodEnd}`,
        };
      }
      if (index === 2) {
        return {
          ...card,
          value: `${metrics.dentroDoPrazo.percentage.toFixed(0)}%`,
          details: metrics.dentroDoPrazo.clients,
          detailsTitle: "Clientes sem marco atrasado",
        };
      }
      if (index === 3) {
        return {
          ...card,
          value: `${metrics.tempoMedio.value.toFixed(1)}d`,
          details: metrics.tempoMedio.details,
          detailsTitle: "Empresa — implantação — tempo de onboarding",
        };
      }
      if (index === 4) {
        return {
          ...card,
          value: metrics.paradosAtrasados.value,
          details: metrics.paradosAtrasados.clients,
          detailsTitle: "Clientes com marco atrasado",
        };
      }
      return card;
    }),
    migracao: KPI_MANUAL_WEEK_VALUES.migracao.map((card, index) => {
      if (index === 0) {
        return {
          ...card,
          value: migrationMetrics.emAndamento.value,
          details: migrationMetrics.emAndamento.clients,
          detailsTitle: "Empresas com status Em andamento",
        };
      }
      if (index === 1) {
        return {
          ...card,
          label: "Concluídas",
          value: migrationMetrics.concluidas.value,
          details: [],
          detailsTitle: "Concluídas — valor temporariamente zerado",
        };
      }
      if (index === 2) {
        return {
          ...card,
          value: migrationMetrics.atrasadas.value,
          details: migrationMetrics.atrasadas.clients,
          detailsTitle: "Migrações com duração superior a 365 dias",
        };
      }
      if (index === 3) {
        return {
          ...card,
          value: `${migrationMetrics.tempoMedio.value.toFixed(1)}d`,
          details: migrationMetrics.tempoMedio.details,
          detailsTitle: "Empresa — início — duração da migração",
        };
      }
      return card;
    }),
  };
}

export async function closeKpiWeeklySnapshot(date = new Date()) {
  const periodKey = getKpiClosingPeriodKey(date);
  const values = await getCurrentKpiValues(date);
  const result = await saveKpiWeeklySnapshot({
    periodKey,
    valuesJson: JSON.stringify(values),
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
