import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Rocket,
  Search,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useKanbanData, type ClientData } from "@/hooks/useKanbanData";
import {
  useMigracaoListData,
  type MigracaoCard,
} from "@/hooks/useMigracaoListData";
import {
  BI_CRITICAL_DEFINITIONS,
  BI_SEGMENT_DEFINITIONS,
  getBICriticalGroups,
  getBIClientGroups,
  groupBoletoByCSM,
  groupClientCountByCSM,
  listCSMs,
  normalizeCSM,
} from "@/lib/biMetrics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REFRESH_INTERVAL_SECONDS = 10 * 60;

type BIListEntry = {
  id: string;
  nome: string;
  badge: string;
  detail: string;
};

type SelectedList = {
  title: string;
  description: string;
  entries: BIListEntry[];
};

const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const formatCompactCurrency = (value: number) => {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)} mi`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`;
  return `R$ ${value.toFixed(0)}`;
};

const normalizeStatus = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");

function clientEntry(client: ClientData): BIListEntry {
  return {
    id: client.id,
    nome: client.nome,
    badge: client.isComplete ? "Concluído" : `Marco ${client.marco}`,
    detail: [
      client.atendente ? `CSM: ${client.atendente}` : "CSM não informado",
      client.entrada ? `Entrada: ${client.entrada}` : "Entrada não informada",
    ].join(" • "),
  };
}

function migrationEntry(migration: MigracaoCard): BIListEntry {
  return {
    id: migration.id,
    nome: migration.empresa,
    badge: "Em andamento",
    detail: [
      migration.responsavel
        ? `Responsável: ${migration.responsavel}`
        : "Responsável não informado",
      migration.dataInicio
        ? `Início: ${migration.dataInicio}`
        : "Início não informado",
    ].join(" • "),
  };
}

export default function BI() {
  const {
    data,
    loading,
    error,
    fetchData: fetchMarcosData,
  } = useKanbanData();
  const {
    data: migrationData,
    loading: migrationLoading,
    error: migrationError,
    fetchData: fetchMigrationData,
  } = useMigracaoListData();
  const [selectedCSM, setSelectedCSM] = useState("");
  const [searchCliente, setSearchCliente] = useState("");
  const [selectedList, setSelectedList] = useState<SelectedList | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(
    REFRESH_INTERVAL_SECONDS
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMarcosData(), fetchMigrationData()]);
    setLastUpdatedAt(new Date());
    setSecondsUntilRefresh(REFRESH_INTERVAL_SECONDS);
    setRefreshing(false);
  }, [fetchMarcosData, fetchMigrationData]);

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

  const csmOptions = useMemo(() => listCSMs(data), [data]);
  const filteredData = useMemo(() => {
    const normalizedSearch = searchCliente.trim().toLocaleLowerCase("pt-BR");
    return data.filter(client => {
      if (selectedCSM && normalizeCSM(client.atendente) !== normalizeCSM(selectedCSM)) {
        return false;
      }
      if (
        normalizedSearch &&
        !client.nome.toLocaleLowerCase("pt-BR").includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });
  }, [data, searchCliente, selectedCSM]);

  const filteredMigrationData = useMemo(() => {
    const normalizedSearch = searchCliente.trim().toLocaleLowerCase("pt-BR");
    return migrationData.filter(migration => {
      if (
        selectedCSM &&
        normalizeCSM(migration.responsavel) !== normalizeCSM(selectedCSM)
      ) {
        return false;
      }
      if (
        normalizedSearch &&
        !migration.empresa.toLocaleLowerCase("pt-BR").includes(normalizedSearch)
      ) {
        return false;
      }
      return normalizeStatus(migration.situacao) === "em andamento";
    });
  }, [migrationData, searchCliente, selectedCSM]);

  const stageGroups = useMemo(() => getBIClientGroups(filteredData), [filteredData]);
  const criticalGroups = useMemo(
    () => getBICriticalGroups(filteredData),
    [filteredData]
  );
  const clientCountByCSM = useMemo(
    () => groupClientCountByCSM(filteredData),
    [filteredData]
  );
  const boletoByCSM = useMemo(() => groupBoletoByCSM(filteredData), [filteredData]);

  const migrationEntries = useMemo(
    () => filteredMigrationData.map(migrationEntry),
    [filteredMigrationData]
  );

  const normalCards = [
    {
      key: "implantacao",
      label: BI_SEGMENT_DEFINITIONS.implantacao.label,
      description: BI_SEGMENT_DEFINITIONS.implantacao.description,
      count: stageGroups.implantacao.length,
      entries: stageGroups.implantacao.map(clientEntry),
      icon: Rocket,
      tone: "blue",
    },
    {
      key: "onboarding",
      label: BI_SEGMENT_DEFINITIONS.onboarding.label,
      description: BI_SEGMENT_DEFINITIONS.onboarding.description,
      count: stageGroups.onboarding.length,
      entries: stageGroups.onboarding.map(clientEntry),
      icon: Users,
      tone: "violet",
    },
    {
      key: "implantados",
      label: BI_SEGMENT_DEFINITIONS.implantados.label,
      description: BI_SEGMENT_DEFINITIONS.implantados.description,
      count: stageGroups.implantados.length,
      entries: stageGroups.implantados.map(clientEntry),
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      key: "migracao",
      label: BI_SEGMENT_DEFINITIONS.migracao.label,
      description: BI_SEGMENT_DEFINITIONS.migracao.description,
      count: migrationEntries.length,
      entries: migrationEntries,
      icon: RefreshCw,
      tone: "amber",
    },
  ] as const;

  const criticalCards = [
    {
      key: "atrasoImplantacao",
      ...BI_CRITICAL_DEFINITIONS.atrasoImplantacao,
      count: criticalGroups.atrasoImplantacao.length,
      entries: criticalGroups.atrasoImplantacao.map(clientEntry),
      tone: "red",
    },
    {
      key: "atrasoOnboarding",
      ...BI_CRITICAL_DEFINITIONS.atrasoOnboarding,
      count: criticalGroups.atrasoOnboarding.length,
      entries: criticalGroups.atrasoOnboarding.map(clientEntry),
      tone: "orange",
    },
    {
      key: "atrasoOngoing",
      ...BI_CRITICAL_DEFINITIONS.atrasoOngoing,
      count: criticalGroups.atrasoOngoing.length,
      entries: criticalGroups.atrasoOngoing.map(clientEntry),
      tone: "slate",
    },
  ] as const;

  const openList = (card: { label: string; description: string; entries: BIListEntry[] }) =>
    setSelectedList({
      title: `${card.label} (${card.entries.length})`,
      description: card.description,
      entries: card.entries,
    });

  const hasError = error || migrationError;
  const isLoading = loading || migrationLoading;

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-5 text-[#001F3F] sm:px-8 md:ml-20">
      <div className="mx-auto max-w-7xl">
        <section className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-[#F5F7FA]/95 p-3 backdrop-blur sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <BarChart3 className="h-4 w-4 text-blue-700" aria-hidden="true" />
              Filtros
            </div>
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="sr-only">Buscar cliente</span>
              <input
                value={searchCliente}
                onChange={event => setSearchCliente(event.target.value)}
                placeholder="Buscar cliente"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {searchCliente && (
                <button
                  type="button"
                  onClick={() => setSearchCliente("")}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">
                CSM
              </span>
              <select
                value={selectedCSM}
                onChange={event => setSelectedCSM(event.target.value)}
                className="min-w-[170px] bg-transparent text-sm font-medium text-slate-700 outline-none"
              >
                <option value="">Todos os CSMs</option>
                {csmOptions.map(csm => (
                  <option key={csm} value={csm}>
                    {csm}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2 text-xs text-slate-500 xl:ml-auto">
              <div className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>{formatCountdown(secondsUntilRefresh)}</span>
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
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400">
            <span>{filteredData.length} clientes Marcos • {filteredMigrationData.length} em migração</span>
            <span>
              {lastUpdatedAt
                ? `Atualizado às ${lastUpdatedAt.toLocaleTimeString("pt-BR")}`
                : isLoading
                  ? "Carregando dados..."
                  : "Aguardando leitura"}
            </span>
          </div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="KPIs de operação">
          {normalCards.map(card => {
            const Icon = card.icon;
            const toneClasses = {
              blue: "bg-blue-50 text-blue-700 ring-blue-100",
              violet: "bg-violet-50 text-violet-700 ring-violet-100",
              emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
              amber: "bg-amber-50 text-amber-700 ring-amber-100",
            }[card.tone];
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => openList(card)}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${toneClasses}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-800">
                  {isLoading && data.length === 0 ? "—" : card.count}
                </p>
                <h2 className="mt-1 text-sm font-semibold text-slate-800">{card.label}</h2>
                <p className="mt-1 text-xs leading-4 text-slate-500">{card.description}</p>
                <p className="mt-3 text-xs font-semibold text-blue-700">Clique para ver os clientes</p>
              </button>
            );
          })}
        </section>

        <div className="mt-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Indicadores críticos</h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <section className="mt-3 grid gap-3 md:grid-cols-3" aria-label="KPIs críticos">
          {criticalCards.map(card => (
            <button
              key={card.key}
              type="button"
              onClick={() => openList(card)}
              className="group rounded-2xl border border-red-100 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-100">
                  <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
                  Atenção
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold text-red-700">{card.count}</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-800">{card.label}</h3>
              <p className="mt-1 text-xs leading-4 text-slate-500">{card.description}</p>
              <p className="mt-3 text-xs font-semibold text-red-700">Clique para ver os clientes</p>
            </button>
          ))}
        </section>

        <section className="mt-7 grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">Quantidade de clientes por CSM</h2>
                <p className="mt-1 text-xs text-slate-500">Considera os clientes visíveis após os filtros.</p>
              </div>
              <Users className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </div>
            <div className="mt-4 h-[290px] w-full">
              {clientCountByCSM.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">Nenhum dado para exibir.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientCountByCSM} margin={{ top: 8, right: 8, left: -12, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="csm" angle={-30} textAnchor="end" interval={0} height={62} tick={{ fontSize: 11, fill: "#64748B" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                    <Tooltip cursor={{ fill: "#F8FAFC" }} />
                    <Bar dataKey="clientes" name="Clientes" fill="#2563EB" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">Valor financeiro por CSM</h2>
                <p className="mt-1 text-xs text-slate-500">Soma dos boletos dos clientes da aba Marcos.</p>
              </div>
              <span className="text-lg font-bold text-emerald-700">{formatCurrency(boletoByCSM.reduce((sum, item) => sum + item.valor, 0))}</span>
            </div>
            <div className="mt-4 h-[290px] w-full">
              {boletoByCSM.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">Nenhum boleto válido para exibir.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={boletoByCSM} margin={{ top: 8, right: 8, left: 8, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="csm" angle={-30} textAnchor="end" interval={0} height={62} tick={{ fontSize: 11, fill: "#64748B" }} />
                    <YAxis tickFormatter={value => formatCompactCurrency(Number(value))} width={72} tick={{ fontSize: 10, fill: "#64748B" }} />
                    <Tooltip formatter={value => formatCurrency(Number(value))} cursor={{ fill: "#F8FAFC" }} />
                    <Bar dataKey="valor" name="Boletos" fill="#059669" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {hasError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Não foi possível atualizar todos os dados do BI: {hasError}
          </div>
        )}
      </div>

      <Dialog
        open={selectedList !== null}
        onOpenChange={open => {
          if (!open) setSelectedList(null);
        }}
      >
        <DialogContent className="max-h-[82vh] max-w-2xl overflow-hidden p-0">
          {selectedList && (
            <>
              <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5 pr-12">
                <DialogTitle className="text-xl text-slate-900">{selectedList.title}</DialogTitle>
                <DialogDescription>{selectedList.description}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[58vh] overflow-y-auto px-6 py-4">
                {selectedList.entries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                    Nenhum cliente encontrado para este indicador.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {selectedList.entries.map(entry => (
                      <li key={entry.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{entry.nome}</p>
                          <p className="mt-1 text-xs text-slate-500">{entry.detail}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{entry.badge}</span>
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
