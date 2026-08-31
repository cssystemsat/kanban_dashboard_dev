export type KPIStatus = "good" | "warning" | "critical" | "neutral";
export type KPITrend = "up" | "down" | "neutral";

export interface KPICard {
  label: string;
  value: string | number;
  unit?: string;
  trend?: KPITrend;
  trendValue?: string;
  status?: KPIStatus;
  details?: string[];
  detailsTitle?: string;
}

export type KPICategory = "onboarding" | "ongoing" | "migracao";

export type KpiManualValues = Record<KPICategory, KPICard[]>;

/**
 * Valores manuais da semana que será fechada na sexta-feira às 23:59 BRT.
 *
 * Este é o único bloco que precisa ser editado manualmente enquanto a
 * automatização por planilhas ainda não estiver habilitada.
 */
export const KPI_MANUAL_WEEK_VALUES: KpiManualValues = {
  onboarding: [
    {
      label: "Clientes ativos",
      value: 172,
      status: "good",
      trend: "up",
      trendValue: "+4",
    },
    {
      label: "Concluídos",
      value: 8,
      status: "good",
      trend: "up",
      trendValue: "+2",
    },
    {
      label: "Dentro do prazo",
      value: "87%",
      status: "good",
      trend: "up",
      trendValue: "+5%",
    },
    {
      label: "Tempo médio",
      value: "12.5d",
      status: "warning",
      trend: "down",
      trendValue: "-1.2d",
    },
    {
      label: "Parados/Atrasados",
      value: 3,
      status: "warning",
      trend: "down",
      trendValue: "-2",
    },
    {
      label: "Taxa ativação",
      value: "92%",
      status: "good",
      trend: "up",
      trendValue: "+3%",
    },
    {
      label: "Tempo 1º valor",
      value: "4.2d",
      status: "good",
      trend: "down",
      trendValue: "-0.5d",
    },
    {
      label: "Cancelamentos",
      value: 1,
      status: "good",
      trend: "down",
      trendValue: "-1",
    },
  ],
  ongoing: [
    {
      label: "Críticos",
      value: 5,
      status: "warning",
      trend: "down",
      trendValue: "-2",
    },
    {
      label: "Sem contato 30+",
      value: 12,
      status: "warning",
      trend: "up",
      trendValue: "+3",
    },
    {
      label: "Cancelamentos",
      value: 2,
      status: "warning",
      trend: "neutral",
      trendValue: "0",
    },
    {
      label: "Recuperados MRR",
      value: "R$ 45,8 mil",
      status: "good",
      trend: "up",
      trendValue: "+R$ 8,2 mil",
    },
    {
      label: "Churn clientes",
      value: "2,1%",
      status: "warning",
      trend: "down",
      trendValue: "-0,3%",
    },
    {
      label: "Churn receita",
      value: "1,8%",
      status: "good",
      trend: "down",
      trendValue: "-0,2%",
    },
    {
      label: "Risco principal",
      value: 0,
      status: "neutral",
      trend: "neutral",
      trendValue: "0",
    },
    {
      label: "Expansão",
      value: 8,
      status: "good",
      trend: "up",
      trendValue: "+2",
    },
  ],
  migracao: [
    {
      label: "Em andamento",
      value: 6,
      status: "good",
      trend: "neutral",
      trendValue: "0",
    },
    {
      label: "Concluídas",
      value: 0,
      status: "neutral",
      trend: "neutral",
      trendValue: "0",
    },
    {
      label: "Atrasadas",
      value: 2,
      status: "warning",
      trend: "down",
      trendValue: "-1",
    },
    {
      label: "Tempo médio",
      value: "8.3d",
      status: "good",
      trend: "down",
      trendValue: "-1.1d",
    },
    {
      label: "Migrados na semana",
      value: 0,
      status: "neutral",
      trend: "neutral",
      trendValue: "0",
    },
    {
      label: "Clientes bloqueados",
      value: 0,
      status: "neutral",
      trend: "neutral",
      trendValue: "0",
    },
    {
      label: "Tickets pós-migração",
      value: 0,
      status: "neutral",
      trend: "neutral",
      trendValue: "0",
    },
    {
      label: "CSAT migração",
      value: "0%",
      status: "neutral",
      trend: "neutral",
      trendValue: "0%",
    },
  ],
};

/** Semana retrasada começa zerada até o primeiro fechamento semanal. */
export function createZeroKpis(source: KpiManualValues): KpiManualValues {
  return Object.fromEntries(
    Object.entries(source).map(([category, cards]) => [
      category,
      cards.map(({ label, unit }) => ({
        label,
        ...(unit ? { unit } : {}),
        value: 0,
        status: "neutral" as const,
        trend: "neutral" as const,
        trendValue: "0",
      })),
    ])
  ) as KpiManualValues;
}

export const KPI_ZERO_WEEK_VALUES = createZeroKpis(KPI_MANUAL_WEEK_VALUES);

export const KPI_CATEGORY_LABELS: Record<
  KPICategory,
  { title: string; icon: string; borderColor: string }
> = {
  onboarding: {
    title: "Onboarding",
    icon: "🚀",
    borderColor: "border-blue-500",
  },
  ongoing: { title: "Ongoing", icon: "📈", borderColor: "border-purple-500" },
  migracao: { title: "Migração", icon: "🔄", borderColor: "border-teal-500" },
};
