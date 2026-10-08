import { Button } from "@/components/ui/button";
import KanbanColumn from "@/components/KanbanColumn";
import DateFilterCompact from "@/components/DateFilterCompact";
import ClientDetailsModal from "@/components/ClientDetailsModal";
import AtendimentoModal from "@/components/AtendimentoModal";
import FriccaoModal from "@/components/FriccaoModal";
import AISearchBox from "@/components/AISearchBox";
import URsTrendIndicator from "@/components/URsTrendIndicator";

import { useKanbanData, ClientData } from "@/hooks/useKanbanData";
import { useMultipleURsTrends } from "@/hooks/useURsTrend";
import { filterByCommercial, listCommercials } from "@shared/commercialFilter";
import { Flag, RotateCw, Sparkles, X, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useState } from "react";
import {
  isMarcosDateInRange,
  parseMarcosDate,
} from "@/lib/marcosDateFilter";
import {
  calculateClientCriticality,
  type CriticalSignal,
} from "@/lib/criticality";

const FLAG_LEVELS = ["Red Flag", "Yellow Flag", "Black Flag"] as const;
type FlagLevel = (typeof FLAG_LEVELS)[number];

type CriticalInsight = {
  id: string;
  nome: string;
  score: number;
  signals: CriticalSignal[];
  resumo: string;
  motivos: string[];
  proximaAcao: string;
};

const buildCriticalRanking = (clients: ClientData[]): CriticalInsight[] =>
  clients
    .map(client => {
      const criticality = calculateClientCriticality(client);
      return {
        id: client.id,
        nome: client.nome,
        score: criticality.score,
        signals: criticality.signals,
        resumo: "",
        motivos: [],
        proximaAcao: "",
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 30);

const FLAG_STYLES: Record<
  FlagLevel,
  {
    color: string;
    border: string;
    bg: string;
    activeBg: string;
    activeText: string;
  }
> = {
  "Red Flag": {
    color: "#DC2626",
    border: "#DC2626",
    bg: "transparent",
    activeBg: "#DC2626",
    activeText: "#FFFFFF",
  },
  "Yellow Flag": {
    color: "#D97706",
    border: "#D97706",
    bg: "transparent",
    activeBg: "#D97706",
    activeText: "#FFFFFF",
  },
  "Black Flag": {
    color: "#1F2937",
    border: "#374151",
    bg: "#FFFFFF",
    activeBg: "#374151",
    activeText: "#FFFFFF",
  },
};

export default function Home() {
  const { data, loading, error, fetchData } = useKanbanData();
  const [flagFilter, setFlagFilter] = useState<FlagLevel | null>(null);
  const [selectedAtendente, setSelectedAtendente] = useState<string | null>(
    null
  );
  const [selectedComercial, setSelectedComercial] = useState<string | null>(
    null
  );
  const [searchCliente, setSearchCliente] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "atrasado">(
    "all"
  );
  const [dateFilterStart, setDateFilterStart] = useState<Date | null>(null);
  const [dateFilterEnd, setDateFilterEnd] = useState<Date | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [atendimentoClient, setAtendimentoClient] = useState<ClientData | null>(
    null
  );
  const [friccaoClient, setFriccaoClient] = useState<ClientData | null>(null);
  const [percentualDesatualizadoFilter, setPercentualDesatualizadoFilter] =
    useState<number | null>(null);
  const [diferencaMaxInput, setDiferencaMaxInput] = useState<string>("");
  const [topBoleto, setTopBoleto] = useState<number>(0);
  const [topVolume, setTopVolume] = useState<number>(0);
  const [marcosTrendStartDate, setMarcosTrendStartDate] = useState<string>("");
  const [marcosTrendEndDate, setMarcosTrendEndDate] = useState<string>("");
  const [filterURsPerDay, setFilterURsPerDay] = useState<boolean>(false);
  const [criticalInsightsOpen, setCriticalInsightsOpen] = useState(false);
  const [selectedCriticalInsight, setSelectedCriticalInsight] =
    useState<CriticalInsight | null>(null);
  const [criticalInsights, setCriticalInsights] = useState<CriticalInsight[]>(
    []
  );
  const generateInsightsMutation = trpc.marcos.generateInsights.useMutation();

  const handleGenerateInsights = async () => {
    const ranked = buildCriticalRanking(data);
    setCriticalInsights(ranked);
    setCriticalInsightsOpen(true);
    setSelectedCriticalInsight(null);

    if (ranked.length === 0) return;

    try {
      const response = await generateInsightsMutation.mutateAsync({
        clients: ranked.map(client => ({
          id: client.id,
          nome: client.nome,
          score: client.score,
          signals: client.signals,
        })),
      });
      const detailsById = new Map(
        response.insights.map(insight => [insight.id, insight])
      );
      setCriticalInsights(
        ranked.map(client => ({
          ...client,
          ...(detailsById.get(client.id) ?? {
            resumo: "Análise objetiva baseada nos sinais encontrados.",
            motivos: client.signals.map(
              signal => `${signal.label}: ${signal.value}`
            ),
            proximaAcao: "Revisar o cliente com o CSM responsável.",
          }),
        }))
      );
    } catch (error) {
      console.error("Erro ao gerar insights de Marcos:", error);
      setCriticalInsights(
        ranked.map(client => ({
          ...client,
          resumo: "Análise objetiva baseada nos sinais encontrados.",
          motivos: client.signals.map(
            signal => `${signal.label}: ${signal.value}`
          ),
          proximaAcao: "Revisar o cliente com o CSM responsável.",
        }))
      );
    }
  };

  // Calcular tendências para todos os clientes uma única vez
  const allClientsForTrend = useMemo(
    () =>
      data.map(c => ({
        codigoCliente: c.codigoCliente,
        nome: c.nome,
      })),
    [data]
  );
  const trendStartDate = useMemo(
    () => (marcosTrendStartDate ? new Date(marcosTrendStartDate) : null),
    [marcosTrendStartDate]
  );
  const trendEndDate = useMemo(
    () => (marcosTrendEndDate ? new Date(marcosTrendEndDate) : null),
    [marcosTrendEndDate]
  );
  const { trends: allTrends } = useMultipleURsTrends(
    allClientsForTrend,
    trendStartDate,
    trendEndDate
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrar dados
  let filteredData = flagFilter
    ? data.filter(client => client.flag === flagFilter)
    : data;
  if (selectedAtendente) {
    filteredData = filteredData.filter(
      client => client.atendente === selectedAtendente
    );
  }
  if (selectedComercial) {
    filteredData = filterByCommercial(filteredData, selectedComercial);
  }
  if (searchCliente.trim()) {
    filteredData = filteredData.filter(client =>
      client.nome.toLowerCase().includes(searchCliente.toLowerCase())
    );
  }
  if (statusFilter !== "all") {
    filteredData = filteredData.filter(
      client => client.marcoStatus === statusFilter
    );
  }
  if (dateFilterStart && dateFilterEnd) {
    filteredData = filteredData.filter(client => {
      return isMarcosDateInRange(client.entrada, dateFilterStart, dateFilterEnd);
    });
  }
  if (percentualDesatualizadoFilter !== null) {
    filteredData = filteredData.filter(
      client =>
        client.percentualDesatualizado !== undefined &&
        client.percentualDesatualizado >= percentualDesatualizadoFilter
    );
  }
  // Filtro de Diferença: mostra quem tem delta <= -threshold (paga mais do que usa)
  const diferencaThreshold =
    diferencaMaxInput !== "" ? parseFloat(diferencaMaxInput) : null;
  if (diferencaThreshold !== null && !isNaN(diferencaThreshold)) {
    filteredData = filteredData.filter(client => {
      if (!client.deltaConsumo) return false;
      const val = parseFloat(
        String(client.deltaConsumo)
          .replace(/[^0-9,.-]/g, "")
          .replace(".", "")
          .replace(",", ".")
      );
      return !isNaN(val) && val <= -diferencaThreshold;
    });
  }
  // Filtros Top Boleto e Top Volume
  if (topBoleto > 0) {
    const topBoletoClientes = [...data]
      .sort((a, b) => {
        const aVal =
          parseFloat(
            String(a.ultimoBoleto || "0")
              .replace(/[^0-9,.-]/g, "")
              .replace(".", "")
              .replace(",", ".")
          ) || 0;
        const bVal =
          parseFloat(
            String(b.ultimoBoleto || "0")
              .replace(/[^0-9,.-]/g, "")
              .replace(".", "")
              .replace(",", ".")
          ) || 0;
        return bVal - aVal;
      })
      .slice(0, topBoleto)
      .map(c => c.nome);
    filteredData = filteredData.filter(c => topBoletoClientes.includes(c.nome));
  }
  if (topVolume > 0) {
    const topVolumeClientes = [...data]
      .sort(
        (a, b) => (b.rastreadores?.length || 0) - (a.rastreadores?.length || 0)
      )
      .slice(0, topVolume)
      .map(c => c.nome);
    filteredData = filteredData.filter(c => topVolumeClientes.includes(c.nome));
  }
  // Filtro UR's/Dia: menos de 30 UR's em 60 dias
  if (filterURsPerDay) {
    filteredData = filteredData.filter(client => {
      const diasCorridos = parseInt(String(client.diasCorridos || 0));
      const urs = parseInt(String(client.urs || 0));
      return diasCorridos > 60 && urs < 30;
    });
  }

  // Contagens base (sem filtro de flag, mas com filtros de CSM e data)
  let baseDataForCounts = data;
  if (selectedAtendente) {
    baseDataForCounts = baseDataForCounts.filter(
      client => client.atendente === selectedAtendente
    );
  }
  if (selectedComercial) {
    baseDataForCounts = filterByCommercial(
      baseDataForCounts,
      selectedComercial
    );
  }
  if (dateFilterStart && dateFilterEnd) {
    baseDataForCounts = baseDataForCounts.filter(client => {
      return isMarcosDateInRange(client.entrada, dateFilterStart, dateFilterEnd);
    });
  }

  // Contagem por nível de flag
  const flagCounts: Record<FlagLevel, number> = {
    "Red Flag": baseDataForCounts.filter(c => c.flag === "Red Flag").length,
    "Yellow Flag": baseDataForCounts.filter(c => c.flag === "Yellow Flag")
      .length,
    "Black Flag": baseDataForCounts.filter(c => c.flag === "Black Flag").length,
  };

  const clientesNoPrazo = baseDataForCounts.filter(
    c => c.marcoStatus === "ok"
  ).length;
  const clientesAtrasados = baseDataForCounts.filter(
    c => c.marcoStatus === "atrasado"
  ).length;
  const clientesURsPerDay = baseDataForCounts.filter(c => {
    const diasCorridos = parseInt(String(c.diasCorridos || 0));
    const urs = parseInt(String(c.urs || 0));
    return diasCorridos > 60 && urs < 30;
  }).length;

  // Obter lista única de CSMs
  const csms = Array.from(
    new Set(data.map(c => c.atendente).filter(Boolean))
  ).sort();
  const comerciais = listCommercials(data);

  // Ordenar clientes por data de entrada (mais antigos em cima)
  const sortedData = [...filteredData].sort((a, b) => {
    const parseDate = (dateStr: string | undefined) => {
      return parseMarcosDate(dateStr) ?? new Date(0);
    };
    return parseDate(a.entrada).getTime() - parseDate(b.entrada).getTime();
  });

  // Agrupar clientes por marco
  const marcos = [
    {
      id: 1,
      nome: "Marco 1 (7 dias)",
      clientes: sortedData.filter(c => c.marco === 1 && !c.isComplete),
    },
    {
      id: 2,
      nome: "Marco 2 (21 dias)",
      clientes: sortedData.filter(c => c.marco === 2 && !c.isComplete),
    },
    {
      id: 3,
      nome: "Marco 3 (49 dias)",
      clientes: sortedData.filter(c => c.marco === 3 && !c.isComplete),
    },
    {
      id: 4,
      nome: "Marco 4 (70 dias)",
      clientes: sortedData.filter(c => c.marco === 4 && !c.isComplete),
    },
    {
      id: 5,
      nome: "Marco 5 (180 dias)",
      clientes: sortedData.filter(c => c.marco === 5 && !c.isComplete),
    },
    {
      id: 6,
      nome: "100% Implantados",
      clientes: sortedData.filter(c => c.isComplete),
    },
  ];

  const totalClientes = filteredData.length;
  const diferencaActive =
    diferencaMaxInput !== "" && !isNaN(parseFloat(diferencaMaxInput));
  const hasActiveFilter = !!(
    dateFilterStart ||
    dateFilterEnd ||
    searchCliente ||
    statusFilter !== "all" ||
    flagFilter ||
    selectedAtendente ||
    selectedComercial ||
    percentualDesatualizadoFilter !== null ||
    diferencaActive ||
    topBoleto > 0 ||
    topVolume > 0
  );

  return (
    <div
      className="min-h-screen md:ml-20"
      style={{ backgroundColor: "#F5F7FA" }}
    >
      {/* Header compacto */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: "#001F3F", borderColor: "#1a3a5c" }}
      >
        <div className="overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-2">
            <h1 className="text-base font-bold leading-none text-white whitespace-nowrap">
              Dashboard do CS
            </h1>

            {/* Filtros na mesma linha */}
            <div className="flex min-w-max flex-nowrap items-center gap-1.5">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchCliente}
                onChange={e => setSearchCliente(e.target.value)}
                className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                title="Buscar cliente"
                style={{ width: "112px" }}
              />

              <select
                value={selectedAtendente || ""}
                onChange={e => setSelectedAtendente(e.target.value || null)}
                className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">CSM: Todos</option>
                {csms.map(csm => (
                  <option key={csm} value={csm}>
                    {csm}
                  </option>
                ))}
              </select>

              <select
                value={selectedComercial || ""}
                onChange={e => setSelectedComercial(e.target.value || null)}
                className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Comercial: Todos</option>
                {comerciais.map(comercial => (
                  <option key={comercial} value={comercial}>
                    {comercial}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                max="100"
                placeholder="% Desatualiz."
                value={
                  percentualDesatualizadoFilter !== null
                    ? percentualDesatualizadoFilter
                    : ""
                }
                onChange={e =>
                  setPercentualDesatualizadoFilter(
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                title="Percentual desatualizado mínimo"
                style={{ width: "84px" }}
              />

              <DateFilterCompact
                compact
                onDateChange={(start, end) => {
                  setDateFilterStart(start);
                  setDateFilterEnd(end);
                }}
              />

              <input
                type="number"
                placeholder="Dif ≤ -R$"
                value={diferencaMaxInput}
                onChange={e => setDiferencaMaxInput(e.target.value)}
                className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border focus:outline-none focus:ring-1 focus:ring-red-300"
                title="Diferença boleto x consumo máxima"
                style={{ borderColor: "#FCA5A5", width: "80px" }}
                min="0"
              />

              <div className="flex items-center gap-0.5 whitespace-nowrap">
                <label className="text-[10px] text-white font-medium">
                  Top B
                </label>
                <input
                  type="number"
                  value={topBoleto}
                  onChange={e =>
                    setTopBoleto(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  style={{ width: "42px" }}
                  min="0"
                />
              </div>

              <div className="flex items-center gap-0.5 whitespace-nowrap">
                <label className="text-[10px] text-white font-medium">
                  Top V
                </label>
                <input
                  type="number"
                  value={topVolume}
                  onChange={e =>
                    setTopVolume(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="h-7 w-[42px] rounded px-1 text-[11px] text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  title="Quantidade de maior volume"
                  min="0"
                />
              </div>

              {/* Filtro de Tendência */}
              <div className="flex items-center gap-1 whitespace-nowrap">
                <div className="flex items-center gap-0.5">
                  <label className="text-[9px] font-semibold text-gray-300">
                    De
                  </label>
                  <input
                    type="date"
                    value={marcosTrendStartDate}
                    onChange={e => setMarcosTrendStartDate(e.target.value)}
                    className="h-7 px-2 rounded text-xs text-gray-700 bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    style={{ width: "88px" }}
                  />
                </div>
                <div className="flex items-center gap-0.5">
                  <label className="text-[9px] font-semibold text-gray-300">
                    Até
                  </label>
                  <input
                    type="date"
                    value={marcosTrendEndDate}
                    onChange={e => setMarcosTrendEndDate(e.target.value)}
                    className="h-7 px-2 rounded text-xs text-gray-700 bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    style={{ width: "88px" }}
                  />
                </div>
                <button
                  onClick={() => {
                    setMarcosTrendStartDate("");
                    setMarcosTrendEndDate("");
                  }}
                  className="h-7 rounded px-1.5 text-[10px] font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                onClick={fetchData}
                disabled={loading}
                size="sm"
                className="gap-1.5 text-gray-900 bg-white hover:bg-gray-100 border border-gray-300 whitespace-nowrap h-7 text-xs"
              >
                <RotateCw
                  className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Atualizando..." : "Atualizar"}
              </Button>
              <Button
                onClick={handleGenerateInsights}
                disabled={loading || generateInsightsMutation.isPending}
                size="sm"
                className="gap-1.5 text-white bg-violet-600 hover:bg-violet-700 border border-violet-500 whitespace-nowrap h-7 text-xs"
              >
                <Sparkles
                  className={`w-3 h-3 ${generateInsightsMutation.isPending ? "animate-pulse" : ""}`}
                />
                {generateInsightsMutation.isPending
                  ? "Analisando..."
                  : "Gerar Insights"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Resumo de Filtros Ativos */}
      {hasActiveFilter && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold" style={{ color: "#001F3F" }}>
            Filtros:
          </span>
          {dateFilterStart && dateFilterEnd && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              Data: {dateFilterStart.toLocaleDateString("pt-BR")} -{" "}
              {dateFilterEnd.toLocaleDateString("pt-BR")}
            </span>
          )}
          {searchCliente && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              Cliente: {searchCliente}
            </span>
          )}
          {statusFilter !== "all" && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              Status: {statusFilter === "ok" ? "No Prazo" : "Atrasado"}
            </span>
          )}
          {flagFilter && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              {flagFilter}
            </span>
          )}
          {selectedAtendente && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              CSM: {selectedAtendente}
            </span>
          )}
          {selectedComercial && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              Comercial: {selectedComercial}
            </span>
          )}
          {percentualDesatualizadoFilter !== null && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              % Desatualizado &ge; {percentualDesatualizadoFilter}%
            </span>
          )}
          {diferencaActive && (
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
              Diferença &le; -R$ {parseFloat(diferencaMaxInput).toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="px-4 pt-3 pb-4">
        {error && (
          <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              Erro ao carregar dados: {error}
            </p>
          </div>
        )}

        {flagFilter && filteredData.length === 0 && !loading && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ Nenhum cliente marcado como {flagFilter}.
            </p>
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                style={{ borderColor: "#00DD00" }}
              ></div>
              <p className="text-gray-600">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Estatísticas — barra horizontal ponta a ponta */}
            <div
              className="flex items-stretch mb-4 bg-white rounded-lg border overflow-hidden"
              style={{ borderColor: "#E0E8F0" }}
            >
              {/* Total */}
              <div
                className="flex flex-col items-center justify-center flex-1 py-3 px-2 border-r"
                style={{ borderColor: "#E0E8F0" }}
              >
                <span className="text-[11px] text-gray-500 leading-none mb-1">
                  Total
                </span>
                <span
                  className="text-xl font-bold leading-none"
                  style={{ color: "#001F3F" }}
                >
                  {totalClientes}
                </span>
              </div>

              {/* No Prazo */}
              <button
                onClick={() =>
                  setStatusFilter(statusFilter === "ok" ? "all" : "ok")
                }
                className="flex flex-col items-center justify-center flex-1 py-3 px-2 border-r transition-colors"
                style={{
                  borderColor: "#E0E8F0",
                  backgroundColor:
                    statusFilter === "ok" ? "#D1FAE5" : "transparent",
                }}
              >
                <span className="text-[11px] text-gray-500 leading-none mb-1">
                  No prazo
                </span>
                <span
                  className="text-xl font-bold leading-none"
                  style={{ color: "#059669" }}
                >
                  {clientesNoPrazo}
                </span>
              </button>

              {/* Atrasados */}
              <button
                onClick={() =>
                  setStatusFilter(
                    statusFilter === "atrasado" ? "all" : "atrasado"
                  )
                }
                className="flex flex-col items-center justify-center flex-1 py-3 px-2 border-r transition-colors"
                style={{
                  borderColor: "#E0E8F0",
                  backgroundColor:
                    statusFilter === "atrasado" ? "#FEE2E2" : "transparent",
                }}
              >
                <span className="text-[11px] text-gray-500 leading-none mb-1">
                  Atrasados
                </span>
                <span className="text-xl font-bold leading-none text-red-600">
                  {clientesAtrasados}
                </span>
              </button>

              {/* Flags */}
              {FLAG_LEVELS.map((level, i) => {
                const s = FLAG_STYLES[level];
                const isActive = flagFilter === level;
                const isLast = i === FLAG_LEVELS.length - 1;
                return (
                  <button
                    key={level}
                    onClick={() => setFlagFilter(isActive ? null : level)}
                    className="flex flex-col items-center justify-center flex-1 py-3 px-2 transition-colors"
                    style={{
                      borderRight: isLast ? "none" : `1px solid #E0E8F0`,
                      backgroundColor: isActive
                        ? level === "Black Flag"
                          ? "#374151"
                          : s.activeBg
                        : level === "Black Flag"
                          ? "#F9FAFB"
                          : "transparent",
                    }}
                  >
                    <span
                      className="flex items-center gap-1 text-[11px] leading-none mb-1"
                      style={{ color: isActive ? "#FFFFFF" : s.color }}
                    >
                      <Flag className="w-3 h-3 fill-current" />
                      {level.replace(" Flag", "")}
                    </span>
                    <span
                      className="text-xl font-bold leading-none"
                      style={{ color: isActive ? "#FFFFFF" : s.color }}
                    >
                      {flagCounts[level]}
                    </span>
                  </button>
                );
              })}

              {/* Filtro UR's/Dia */}
              <button
                onClick={() => setFilterURsPerDay(!filterURsPerDay)}
                className="flex flex-col items-center justify-center flex-1 py-3 px-2 transition-colors"
                style={{
                  borderRight: "none",
                  backgroundColor: filterURsPerDay ? "#DBEAFE" : "transparent",
                }}
              >
                <span
                  className="text-[11px] leading-none mb-1"
                  style={{ color: filterURsPerDay ? "#1E40AF" : "#4A5F7F" }}
                >
                  UR's/Dia
                </span>
                <span
                  className="text-xl font-bold leading-none"
                  style={{ color: filterURsPerDay ? "#1E40AF" : "#4A5F7F" }}
                >
                  {clientesURsPerDay}
                </span>
              </button>
            </div>

            {/* Kanban */}
            <div
              className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 overflow-x-auto"
              style={{ minHeight: "600px" }}
            >
              {marcos.map(marco => {
                // Filtrar tendências para clientes deste marco
                const marcoClientesCodigos = new Set(
                  marco.clientes.map(c => c.codigoCliente)
                );
                const marcoTrends = allTrends.filter(t =>
                  marcoClientesCodigos.has(t.codigoCliente)
                );

                const ascendentes = marcoTrends.filter(
                  t => t.isAscending
                ).length;
                const descendentes = marcoTrends.filter(
                  t => t.isDeclining
                ).length;

                return (
                  <div key={marco.id} className="flex flex-col gap-2">
                    {/* Indicador de Tendencia */}
                    {(ascendentes > 0 || descendentes > 0) && (
                      <div
                        className="flex items-center gap-2 px-2 py-1 bg-white rounded border"
                        style={{ borderColor: "#E0E8F0" }}
                      >
                        {ascendentes > 0 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: "#D1FAE5",
                              color: "#065F46",
                            }}
                          >
                            ↑ {ascendentes}
                          </span>
                        )}
                        {descendentes > 0 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: "#FEE2E2",
                              color: "#991B1B",
                            }}
                          >
                            ↓ {descendentes}
                          </span>
                        )}
                      </div>
                    )}
                    <KanbanColumn
                      key={marco.id}
                      marcoNumber={marco.id}
                      marcoName={marco.nome}
                      clients={marco.clientes}
                      onClientClick={client => {
                        setSelectedClient(client);
                        setIsModalOpen(true);
                      }}
                      onAtendimento={client => setAtendimentoClient(client)}
                      onFriccao={client => setFriccaoClient(client)}
                      trendStartDate={
                        marcosTrendStartDate
                          ? new Date(marcosTrendStartDate)
                          : null
                      }
                      trendEndDate={
                        marcosTrendEndDate ? new Date(marcosTrendEndDate) : null
                      }
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Modal de Detalhes do Cliente */}
      {selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedClient(null);
          }}
        />
      )}

      {/* Modal de ranking de criticidade */}
      {criticalInsightsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setCriticalInsightsOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
                  Análise inteligente de Marcos
                </p>
                <h2 className="text-lg font-bold text-slate-900">
                  30 clientes mais críticos
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar insights"
                onClick={() => setCriticalInsightsOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div className="rounded-lg border border-violet-100 bg-violet-50/70 p-3 text-xs text-slate-700">
                <p className="mb-2 font-semibold text-violet-950">
                  Como a criticidade é calculada
                </p>
                <p className="mb-2 leading-relaxed">
                  Todo cliente começa com 100 pontos. Os sinais objetivos
                  encontrados na planilha geram descontos; se os descontos
                  ultrapassarem 100, o score fica negativo. Quanto menor a
                  pontuação restante, maior a criticidade. A lista abaixo mostra
                  os 30 menores scores.
                </p>
                <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  <span>
                    <strong>-35</strong> se o marco estiver atrasado;
                    <strong>-10</strong> se estiver pendente.
                  </span>
                  <span>
                    Delta boleto x consumo negativo: desconto proporcional de 5
                    a 30 pontos, limitado a 30.
                  </span>
                  <span>
                    Veículos desatualizados: 0,2 ponto por percentual, limitado
                    a 20 pontos.
                  </span>
                  <span>
                    Sem contato: <strong>-8</strong> com 14–29 dias ou
                    <strong>-15</strong> com 30 dias ou mais.
                  </span>
                  <span>
                    Flags: <strong>-20</strong> Red, <strong>-10</strong> Yellow
                    ou <strong>-18</strong> Black.
                  </span>
                  <span>
                    Implantação com mais de 180 dias sem conclusão:{" "}
                    <strong>-10</strong>.
                  </span>
                </div>
              </div>
              {criticalInsights.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
                  Não foram encontrados sinais críticos nos dados atuais de
                  Marcos.
                </p>
              ) : (
                criticalInsights.map((insight, index) => (
                  <button
                    type="button"
                    key={insight.id}
                    onClick={() => {
                      setSelectedCriticalInsight(insight);
                      setCriticalInsightsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-violet-300 hover:bg-violet-50"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {insight.nome}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {insight.signals.length > 0
                          ? insight.signals
                              .map(signal => signal.label)
                              .join(" • ")
                          : "Sem descontos identificados"}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-red-700">
                      {insight.score} <ChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de explicação de criticidade */}
      {selectedCriticalInsight && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/45 p-3 sm:items-center sm:p-4"
          onClick={() => {
            setSelectedCriticalInsight(null);
            setCriticalInsightsOpen(true);
          }}
        >
          <div
            className="my-auto flex w-full max-w-lg max-h-[calc(100dvh-1.5rem)] flex-col overflow-y-auto overscroll-contain rounded-xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-5"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
                  Cliente crítico • {selectedCriticalInsight.score} pontos
                  restantes
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedCriticalInsight.nome}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar explicação"
                onClick={() => {
                  setSelectedCriticalInsight(null);
                  setCriticalInsightsOpen(true);
                }}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 pt-4 text-sm">
              <p className="rounded-lg bg-red-50 p-3 text-red-900">
                {selectedCriticalInsight.resumo ||
                  "A criticidade foi calculada pelos sinais abaixo."}
              </p>
              <div>
                <h3 className="mb-2 font-semibold text-slate-900">
                  Por que está crítico
                </h3>
                <p className="mb-2 text-xs text-slate-500">
                  Estes são os sinais objetivos que formaram a pontuação deste
                  cliente.
                </p>
                <div className="mb-4 space-y-2">
                  {selectedCriticalInsight.signals.length > 0 ? (
                    selectedCriticalInsight.signals.map(signal => (
                      <div
                        key={`${signal.label}-${signal.value}`}
                        className="flex items-start justify-between gap-3 rounded-md bg-slate-50 p-2 text-slate-700"
                      >
                        <span>
                          <strong>{signal.label}:</strong> {signal.value}
                        </span>
                        {signal.points ? (
                          <span className="shrink-0 font-semibold text-red-700">
                            -{signal.points} pts
                          </span>
                        ) : null}
                      </div>
                    ))
                  ) : selectedCriticalInsight.motivos.length > 0 ? (
                    selectedCriticalInsight.motivos.map((reason, index) => (
                      <div
                        key={`${reason}-${index}`}
                        className="rounded-md bg-slate-50 p-2 text-slate-700"
                      >
                        {reason}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-md bg-slate-50 p-2 text-slate-600">
                      Nenhum sinal detalhado foi retornado.
                    </p>
                  )}
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">
                  Próxima ação sugerida
                </h3>
                <p className="rounded-md bg-violet-50 p-3 text-violet-900">
                  {selectedCriticalInsight.proximaAcao ||
                    "Revisar o cliente com o CSM responsável."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atendimento */}
      {atendimentoClient && (
      <AtendimentoModal
        client={atendimentoClient}
        origem="marcos"
        onClose={() => setAtendimentoClient(null)}
      />
      )}

      {/* Modal de Fricção */}
      {friccaoClient && (
        <FriccaoModal
          client={friccaoClient}
          onClose={() => setFriccaoClient(null)}
        />
      )}

      {/* Busca com IA */}
      <AISearchBox clients={filteredData} />
    </div>
  );
}
