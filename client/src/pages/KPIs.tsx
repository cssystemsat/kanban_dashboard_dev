import { useState } from "react";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  KPI_MANUAL_WEEK_VALUES,
  KPI_ZERO_WEEK_VALUES,
} from "@shared/kpiDefinitions";

interface KPICard {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  status?: "good" | "warning" | "critical" | "neutral";
}

export default function KPIs() {
  const [selectedKPI, setSelectedKPI] = useState<KPICard | null>(null);
  const { data: previousSnapshot } =
    trpc.kpis.getPreviousWeeklySnapshot.useQuery();

  // Semana retrasada: começa zerada e passa a exibir o último fechamento semanal.
  const onboardingRetrasada: KPICard[] =
    previousSnapshot?.values.onboarding ?? KPI_ZERO_WEEK_VALUES.onboarding;
  const ongoingRetrasada: KPICard[] =
    previousSnapshot?.values.ongoing ?? KPI_ZERO_WEEK_VALUES.ongoing;
  const migracaoRetrasada: KPICard[] =
    previousSnapshot?.values.migracao ?? KPI_ZERO_WEEK_VALUES.migracao;

  // Semana passada: valores manuais editáveis em shared/kpiDefinitions.ts.
  const onboardingPassada: KPICard[] = KPI_MANUAL_WEEK_VALUES.onboarding;
  const ongoingPassada: KPICard[] = KPI_MANUAL_WEEK_VALUES.ongoing;
  const migracaoPassada: KPICard[] = KPI_MANUAL_WEEK_VALUES.migracao;

  const getStatusColor = (status?: string) => {
    if (status === "good") return "bg-green-50 border-green-200";
    if (status === "warning") return "bg-yellow-50 border-yellow-200";
    if (status === "critical") return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
  };

  const getStatusTextColor = (status?: string) => {
    if (status === "good") return "text-green-700";
    if (status === "warning") return "text-yellow-700";
    if (status === "critical") return "text-red-700";
    return "text-gray-700";
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === "up")
      return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (trend === "down")
      return <TrendingDown className="w-3 h-3 text-red-600" />;
    return null;
  };

  const renderKPIRow = (
    kpiPassada: KPICard,
    kpiRetrasada: KPICard,
    index: number
  ) => (
    <div key={`kpi-row-${index}`} className="flex gap-1 mb-1">
      {/* Semana Retrasada */}
      <div
        onClick={() => setSelectedKPI(kpiRetrasada)}
        className={`flex-1 p-1.5 rounded border text-xs cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(kpiRetrasada.status)}`}
      >
        <p className="font-medium text-gray-700 truncate text-xs">
          {kpiRetrasada.label}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span
            className={`font-bold text-xs ${getStatusTextColor(kpiRetrasada.status)}`}
          >
            {kpiRetrasada.value}
          </span>
          {kpiRetrasada.trend && (
            <div className="flex items-center gap-0.5">
              {getTrendIcon(kpiRetrasada.trend)}{" "}
              <span className="text-xs text-gray-600">
                {kpiRetrasada.trendValue}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Semana Passada */}
      <div
        onClick={() => setSelectedKPI(kpiPassada)}
        className={`flex-1 p-1.5 rounded border text-xs cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(kpiPassada.status)}`}
      >
        <p className="font-medium text-gray-700 truncate text-xs">
          {kpiPassada.label}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span
            className={`font-bold text-xs ${getStatusTextColor(kpiPassada.status)}`}
          >
            {kpiPassada.value}
          </span>
          {kpiPassada.trend && (
            <div className="flex items-center gap-0.5">
              {getTrendIcon(kpiPassada.trend)}{" "}
              <span className="text-xs text-gray-600">
                {kpiPassada.trendValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCategory = (
    categoryTitle: string,
    icon: string,
    passada: KPICard[],
    retrasada: KPICard[],
    borderColor: string
  ) => (
    <div className="flex-1">
      <h2
        className={`text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 ${borderColor}`}
      >
        {icon} {categoryTitle}
      </h2>

      {/* Headers das colunas */}
      <div className="flex gap-1 mb-1">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-700">
            Semana Retrasada
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-700">Semana Passada</p>
        </div>
      </div>

      {/* KPI Rows */}
      {passada.map((kpi, idx) => renderKPIRow(kpi, retrasada[idx], idx))}
    </div>
  );

  return (
    <div
      className="ml-20 p-3"
      style={{ backgroundColor: "#F5F7FA", minHeight: "100vh" }}
    >
      <div className="flex gap-3 w-full">
        {renderCategory(
          "Onboarding",
          "🚀",
          onboardingPassada,
          onboardingRetrasada,
          "border-blue-500"
        )}
        <div key="divider-1" className="border-l-2 border-gray-300"></div>
        {renderCategory(
          "Ongoing",
          "📈",
          ongoingPassada,
          ongoingRetrasada,
          "border-purple-500"
        )}
        <div key="divider-2" className="border-l-2 border-gray-300"></div>
        {renderCategory(
          "Migração",
          "🔄",
          migracaoPassada,
          migracaoRetrasada,
          "border-teal-500"
        )}
      </div>

      {/* Modal de KPI */}
      {selectedKPI && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedKPI.label}
              </h2>
              <button
                onClick={() => setSelectedKPI(null)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {selectedKPI.value}
              </p>
              {selectedKPI.trend && (
                <div className="flex items-center gap-2">
                  {getTrendIcon(selectedKPI.trend)}
                  <span className="text-sm text-gray-600">
                    {selectedKPI.trendValue}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded p-4 mb-4 min-h-[100px]">
              <p className="text-sm text-gray-600">
                Informações do KPI serão adicionadas aqui...
              </p>
            </div>

            <button
              onClick={() => setSelectedKPI(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
