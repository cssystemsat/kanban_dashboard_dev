import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  RefreshCw,
  Rocket,
  Users,
} from "lucide-react";
import { useKanbanData, type ClientData } from "@/hooks/useKanbanData";
import {
  BI_SEGMENT_DEFINITIONS,
  getBIClientGroups,
  type BIMetricKey,
} from "@/lib/biMetrics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REFRESH_INTERVAL_SECONDS = 10 * 60;

type MetricDefinition = {
  key: BIMetricKey;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  softAccent: string;
};

const METRICS: MetricDefinition[] = [
  {
    key: "implantacao",
    ...BI_SEGMENT_DEFINITIONS.implantacao,
    icon: Rocket,
    accent: "text-blue-700",
    softAccent: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  {
    key: "onboarding",
    ...BI_SEGMENT_DEFINITIONS.onboarding,
    icon: Users,
    accent: "text-violet-700",
    softAccent: "bg-violet-50 text-violet-700 ring-violet-100",
  },
  {
    key: "implantados",
    ...BI_SEGMENT_DEFINITIONS.implantados,
    icon: CheckCircle2,
    accent: "text-emerald-700",
    softAccent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
];

const formatDate = (value: string) => value || "Data não informada";

const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

export default function BI() {
  const { data, loading, error, fetchData } = useKanbanData();
  const [selectedMetric, setSelectedMetric] = useState<BIMetricKey | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(
    REFRESH_INTERVAL_SECONDS
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setLastUpdatedAt(new Date());
    setSecondsUntilRefresh(REFRESH_INTERVAL_SECONDS);
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    void refreshData();
    const refreshTimer = window.setInterval(() => {
      void refreshData();
    }, REFRESH_INTERVAL_SECONDS * 1000);
    const countdownTimer = window.setInterval(() => {
      setSecondsUntilRefresh(current =>
        current <= 1 ? REFRESH_INTERVAL_SECONDS : current - 1
      );
    }, 1000);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(countdownTimer);
    };
  }, [refreshData]);

  const groups = useMemo(() => getBIClientGroups(data), [data]);
  const selectedClients = selectedMetric ? groups[selectedMetric] : [];
  const selectedDefinition = selectedMetric
    ? METRICS.find(metric => metric.key === selectedMetric)
    : undefined;

  return (
    <main className="ml-20 min-h-screen bg-[#F5F7FA] px-5 py-6 text-[#001F3F] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1D4ED8] text-white shadow-sm shadow-blue-200">
              <BarChart3 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Gestão de clientes
              </p>
              <h1 className="text-3xl font-bold tracking-tight">BI</h1>
              <p className="mt-1 text-sm text-slate-500">
                Indicadores dinâmicos da operação na aba Marcos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>Próxima atualização em {formatCountdown(secondsUntilRefresh)}</span>
            </div>
            <button
              type="button"
              onClick={() => void refreshData()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Atualizar
            </button>
          </div>
        </header>

        <section className="mt-7 grid gap-4 md:grid-cols-3" aria-label="KPIs de clientes">
          {METRICS.map(metric => {
            const Icon = metric.icon;
            const count = groups[metric.key].length;
            return (
              <button
                key={metric.key}
                type="button"
                onClick={() => setSelectedMetric(metric.key)}
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={`Ver ${count} ${metric.label.toLowerCase()}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${metric.softAccent}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <ChevronRight
                    className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                    aria-hidden="true"
                  />
                </div>
                <p className={`mt-5 text-4xl font-bold tracking-tight ${metric.accent}`}>
                  {loading && data.length === 0 ? "—" : count}
                </p>
                <h2 className="mt-2 text-base font-semibold text-slate-800">{metric.label}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">{metric.description}</p>
                <p className="mt-4 text-xs font-semibold text-blue-700 opacity-80 transition group-hover:opacity-100">
                  Clique para ver os clientes
                </p>
              </button>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Critério dos indicadores</h2>
                <p className="text-sm text-slate-500">A leitura acompanha os marcos atuais da aba Marcos.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {METRICS.map(metric => (
                <div key={metric.key} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-700">{metric.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Base analisada</p>
            <p className="mt-3 text-3xl font-bold text-slate-800">{data.length}</p>
            <p className="mt-1 text-sm text-slate-500">clientes carregados da aba Marcos</p>
            <p className="mt-5 text-xs text-slate-400">
              {lastUpdatedAt
                ? `Última leitura: ${lastUpdatedAt.toLocaleTimeString("pt-BR")}`
                : "Carregando a primeira leitura..."}
            </p>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Não foi possível atualizar os dados da aba Marcos: {error}
          </div>
        )}
      </div>

      <Dialog
        open={selectedMetric !== null}
        onOpenChange={open => {
          if (!open) setSelectedMetric(null);
        }}
      >
        <DialogContent className="max-h-[82vh] max-w-2xl overflow-hidden p-0">
          {selectedDefinition && (
            <>
              <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5 pr-12">
                <DialogTitle className="text-xl text-slate-900">
                  {selectedDefinition.label} ({selectedClients.length})
                </DialogTitle>
                <DialogDescription>{selectedDefinition.description}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[58vh] overflow-y-auto px-6 py-4">
                {selectedClients.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                    Nenhum cliente encontrado para este indicador.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {selectedClients.map((client: ClientData) => (
                      <li
                        key={client.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{client.nome}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {client.isComplete ? "Todos os marcos concluídos" : `Marco atual ${client.marco}`} 
                            {client.entrada ? ` • Entrada: ${formatDate(client.entrada)}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {client.isComplete ? "Concluído" : `Marco ${client.marco}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
