import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  FileSpreadsheet,
  Flag,
  LayoutGrid,
  List,
  RefreshCw,
} from "lucide-react";
import { useOngoingData, OngoingClientData } from "@/hooks/useOngoingData";
import OngoingCard from "@/components/OngoingCard";
import OngoingClientModal from "@/components/OngoingClientModal";
import URsTrendIndicator from "@/components/URsTrendIndicator";
import { filterByCommercial, listCommercials } from "@shared/commercialFilter";
import { trpc } from "@/lib/trpc";

const FLAG_LEVELS = ["Red Flag", "Yellow Flag", "Black Flag"] as const;
type FlagLevel = (typeof FLAG_LEVELS)[number];
type ViewMode = "cards" | "list";
type SortKey =
  | "nome"
  | "placas"
  | "ultimoContato"
  | "ultimoBoleto"
  | "comercial"
  | "csm"
  | "situacao"
  | "decisor"
  | "contatoDecissor";

const SORTABLE_COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: "nome", label: "Nome do cliente" },
  { key: "placas", label: "Placas" },
  { key: "ultimoContato", label: "Último contato" },
  { key: "ultimoBoleto", label: "Boleto" },
  { key: "comercial", label: "Comercial" },
  { key: "csm", label: "CSM" },
  { key: "situacao", label: "Situação" },
  { key: "decisor", label: "Decisor" },
  { key: "contatoDecissor", label: "Contato do decisor" },
];

function dateValue(value: string) {
  const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!match) return Number.NaN;
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  return new Date(year, Number(match[2]) - 1, Number(match[1])).getTime();
}

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

export default function Ongoing() {
  const { data, loading, refresh } = useOngoingData();
  const ongoingCentralIds = useMemo(
    () => [...new Set(data.map(client => client.centralId.trim()).filter(Boolean))].sort(),
    [data]
  );
  const { data: npsAverages = [] } = trpc.wootric.averagesByCentral.useQuery(
    { centralIds: ongoingCentralIds },
    { enabled: ongoingCentralIds.length > 0, staleTime: 5 * 60_000 }
  );
  const npsAverageByCentralId = useMemo(
    () => new Map(npsAverages.map(item => [item.centralId, item.average])),
    [npsAverages]
  );
  const [selectedClient, setSelectedClient] =
    useState<OngoingClientData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flagFilter, setFlagFilter] = useState<FlagLevel | null>(null);
  const [selectedAtendente, setSelectedAtendente] = useState<string | null>(
    null
  );
  const [selectedComercial, setSelectedComercial] = useState<string | null>(
    null
  );
  const [searchCliente, setSearchCliente] = useState<string>("");
  const [ultimoBoletoMin, setUltimoBoletoMin] = useState<number | null>(null);
  const [ultimoBoletoMax, setUltimoBoletoMax] = useState<number | null>(null);
  const [selectedSituacao, setSelectedSituacao] = useState<string | null>(null);
  const [contactAgeFilter, setContactAgeFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deltaMaxInput, setDeltaMaxInput] = useState<string>("");
  const [topBoleto, setTopBoleto] = useState<number>(0);
  const [topVolume, setTopVolume] = useState<number>(0);
  const [trendStartDate, setTrendStartDate] = useState<string>("");
  const [trendEndDate, setTrendEndDate] = useState<string>("");

  // Filtrar dados
  let filteredData = flagFilter
    ? data.filter(client => client.flag === flagFilter)
    : data;

  if (selectedAtendente) {
    filteredData = filteredData.filter(
      client => client.csm === selectedAtendente
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
  if (ultimoBoletoMin !== null) {
    filteredData = filteredData.filter(
      client => client.ultimoBoleto >= ultimoBoletoMin
    );
  }
  if (ultimoBoletoMax !== null) {
    filteredData = filteredData.filter(
      client => client.ultimoBoleto <= ultimoBoletoMax
    );
  }
  if (selectedSituacao) {
    filteredData = filteredData.filter(
      client => client.situacao === selectedSituacao
    );
  }
  if (contactAgeFilter) {
    filteredData = filteredData.filter(client => {
      const days = client.diasUltimoContato;
      if (contactAgeFilter === "dia") return days >= 1;
      if (contactAgeFilter === "semana") return days >= 7;
      if (contactAgeFilter === "mes") return days >= 30;
      return true;
    });
  }
  // Filtro de Delta Consumo: mostra quem tem delta <= -threshold (paga mais do que usa)
  const deltaThreshold =
    deltaMaxInput !== "" ? parseFloat(deltaMaxInput) : null;
  if (deltaThreshold !== null && !isNaN(deltaThreshold)) {
    filteredData = filteredData.filter(
      client => client.deltaConsumo <= -deltaThreshold
    );
  }

  // Filtro Top Boleto: mostra top X clientes com maior boleto
  if (topBoleto > 0) {
    const topBoletoClients = [...data]
      .sort((a, b) => b.ultimoBoleto - a.ultimoBoleto)
      .slice(0, topBoleto)
      .map(c => c.nome);
    filteredData = filteredData.filter(client =>
      topBoletoClients.includes(client.nome)
    );
  }

  // Filtro Top Volume: mostra top X clientes com maior quantidade de placas (URs)
  if (topVolume > 0) {
    const topVolumeClients = [...data]
      .sort((a, b) => (b.placas || 0) - (a.placas || 0))
      .slice(0, topVolume)
      .map(c => c.nome);
    filteredData = filteredData.filter(client =>
      topVolumeClients.includes(client.nome)
    );
  }

  // Contagens base (sem filtro de flag, mas com filtro de CSM)
  let baseDataForCounts = data;
  if (selectedAtendente) {
    baseDataForCounts = baseDataForCounts.filter(
      client => client.csm === selectedAtendente
    );
  }
  if (selectedComercial) {
    baseDataForCounts = filterByCommercial(
      baseDataForCounts,
      selectedComercial
    );
  }

  const flagCounts: Record<FlagLevel, number> = {
    "Red Flag": baseDataForCounts.filter(c => c.flag === "Red Flag").length,
    "Yellow Flag": baseDataForCounts.filter(c => c.flag === "Yellow Flag")
      .length,
    "Black Flag": baseDataForCounts.filter(c => c.flag === "Black Flag").length,
  };

  // Obter lista única de CSMs e Situações
  const csms = Array.from(new Set(data.map(c => c.csm).filter(Boolean))).sort();
  const comerciais = listCommercials(data);
  const situacoes = Array.from(
    new Set(data.map(c => c.situacao).filter(Boolean))
  ).sort();

  const sortedData = [...filteredData].sort((first, second) => {
    const firstValue = first[sortKey];
    const secondValue = second[sortKey];
    const firstText = String(firstValue ?? "").trim();
    const secondText = String(secondValue ?? "").trim();
    const firstEmpty = firstText === "" || firstText === "-";
    const secondEmpty = secondText === "" || secondText === "-";
    if (firstEmpty !== secondEmpty) return firstEmpty ? 1 : -1;

    let comparison = 0;
    if (sortKey === "ultimoContato") {
      const firstDate = dateValue(firstText);
      const secondDate = dateValue(secondText);
      if (Number.isFinite(firstDate) && Number.isFinite(secondDate)) {
        comparison = firstDate - secondDate;
      }
    }
    if (comparison === 0) {
      const firstNumber = typeof firstValue === "number" ? firstValue : Number.NaN;
      const secondNumber = typeof secondValue === "number" ? secondValue : Number.NaN;
      comparison = Number.isFinite(firstNumber) && Number.isFinite(secondNumber)
        ? firstNumber - secondNumber
        : firstText.localeCompare(secondText, "pt-BR", {
            numeric: true,
            sensitivity: "base",
          });
    }
    if (comparison === 0) {
      comparison = first.nome.localeCompare(second.nome, "pt-BR", {
        numeric: true,
        sensitivity: "base",
      });
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });
  const deltaActive = deltaMaxInput !== "" && !isNaN(parseFloat(deltaMaxInput));
  const hasActiveFilter = !!(
    ultimoBoletoMin !== null ||
    ultimoBoletoMax !== null ||
    searchCliente ||
    flagFilter ||
    selectedAtendente ||
    selectedComercial ||
    selectedSituacao ||
    contactAgeFilter ||
    deltaActive
  );

  return (
    <div
      className="md:ml-20 p-4 md:p-6"
      style={{ backgroundColor: "#F5F7FA", minHeight: "100vh" }}
    >
      {/* Filtros compactos no topo, com atualização manual integrada. */}
      <div
        className="bg-white rounded-xl p-2 border shadow-sm"
        style={{ borderColor: "#E0E8F0" }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={refresh}
            className="h-8 px-3 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors flex items-center gap-2 disabled:cursor-wait disabled:opacity-70"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Cliente
            </label>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchCliente}
              onChange={e => setSearchCliente(e.target.value)}
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
              style={{ width: "150px" }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Flags
            </label>
            <div className="flex gap-1">
              {FLAG_LEVELS.map(level => {
                const s = FLAG_STYLES[level];
                const isActive = flagFilter === level;
                return (
                  <button
                    key={level}
                    onClick={() => setFlagFilter(isActive ? null : level)}
                    className="flex items-center gap-1 h-8 px-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap"
                    style={{
                      backgroundColor: isActive ? s.activeBg : "#F9FAFB",
                      color: isActive ? s.activeText : s.color,
                      border: `1px solid ${isActive ? s.border : "#E5E7EB"}`,
                    }}
                  >
                    <Flag size={12} />
                    {level.replace(" Flag", "")}{" "}
                    {flagCounts[level] > 0 && `(${flagCounts[level]})`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              CSM
            </label>
            <select
              value={selectedAtendente || "todos"}
              onChange={e =>
                setSelectedAtendente(
                  e.target.value === "todos" ? null : e.target.value
                )
              }
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
            >
              <option value="todos">Todos</option>
              {csms.map(csm => (
                <option key={csm} value={csm}>
                  {csm}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Comercial
            </label>
            <select
              value={selectedComercial || "todos"}
              onChange={e =>
                setSelectedComercial(
                  e.target.value === "todos" ? null : e.target.value
                )
              }
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
            >
              <option value="todos">Todos</option>
              {comerciais.map(comercial => (
                <option key={comercial} value={comercial}>
                  {comercial}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Boleto Mín
            </label>
            <input
              type="number"
              placeholder="R$ Mín"
              value={ultimoBoletoMin ?? ""}
              onChange={e =>
                setUltimoBoletoMin(
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
              style={{ width: "100px" }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Boleto Máx
            </label>
            <input
              type="number"
              placeholder="R$ Máx"
              value={ultimoBoletoMax ?? ""}
              onChange={e =>
                setUltimoBoletoMax(
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
              style={{ width: "100px" }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Situação
            </label>
            <select
              value={selectedSituacao || "todos"}
              onChange={e =>
                setSelectedSituacao(
                  e.target.value === "todos" ? null : e.target.value
                )
              }
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
            >
              <option value="todos">Todas</option>
              {situacoes.map(situacao => (
                <option key={situacao} value={situacao}>
                  {situacao}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Sem contato
            </label>
            <select
              value={contactAgeFilter || "todos"}
              onChange={e => setContactAgeFilter(e.target.value === "todos" ? "" : e.target.value)}
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
            >
              <option value="todos">Todos</option>
              <option value="dia">Sem contato no dia</option>
              <option value="semana">Sem contato na semana</option>
              <option value="mes">Sem contato no mês</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "#DC2626" }}
            >
              Delta ≤ -R$
            </label>
            <input
              type="number"
              placeholder="Ex: 1000"
              value={deltaMaxInput}
              onChange={e => setDeltaMaxInput(e.target.value)}
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border focus:outline-none focus:ring-2 focus:ring-red-300 focus:bg-white"
              style={{ borderColor: "#FCA5A5", width: "100px" }}
              min="0"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Top Boletos
            </label>
            <input
              type="number"
              value={topBoleto}
              onChange={e =>
                setTopBoleto(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
              style={{ width: "80px" }}
              min="0"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Top Volume
            </label>
            <input
              type="number"
              value={topVolume}
              onChange={e =>
                setTopVolume(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
              style={{ width: "80px" }}
              min="0"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Tendencia De
            </label>
            <input
              type="date"
              value={trendStartDate}
              onChange={e => setTrendStartDate(e.target.value)}
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Tendencia Ate
            </label>
            <input
              type="date"
              value={trendEndDate}
              onChange={e => setTrendEndDate(e.target.value)}
              className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
            />
          </div>

          <button
            onClick={() => {
              setSearchCliente("");
              setFlagFilter(null);
              setSelectedAtendente(null);
              setSelectedComercial(null);
              setUltimoBoletoMin(null);
              setUltimoBoletoMax(null);
              setSelectedSituacao(null);
              setContactAgeFilter("");
              setViewMode("cards");
              setSortKey("nome");
              setSortDirection("asc");
              setDeltaMaxInput("");
              setTopBoleto(0);
              setTopVolume(0);
              setTrendStartDate("");
              setTrendEndDate("");
            }}
            className="h-8 px-3 rounded-md text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Resumo de Filtros Ativos */}
      {(hasActiveFilter || topBoleto > 0 || topVolume > 0) && (
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 mt-3 rounded-lg flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold" style={{ color: "#001F3F" }}>
            Filtros:
          </span>
          {ultimoBoletoMin !== null && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              Boleto Mín: R$ {ultimoBoletoMin.toFixed(2)}
            </span>
          )}
          {ultimoBoletoMax !== null && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              Máx: R$ {ultimoBoletoMax.toFixed(2)}
            </span>
          )}
          {searchCliente && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              Cliente: {searchCliente}
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
          {selectedSituacao && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              Situação: {selectedSituacao}
            </span>
          )}
          {contactAgeFilter && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              Sem contato: {contactAgeFilter === "dia" ? "no dia" : contactAgeFilter === "semana" ? "na semana" : "no mês"}
            </span>
          )}
          {deltaActive && (
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
              Delta ≤ -R$ {parseFloat(deltaMaxInput).toFixed(2)}
            </span>
          )}
          {topBoleto > 0 && (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
              Top Boletos: {topBoleto}
            </span>
          )}
          {topVolume > 0 && (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
              Top Volume: {topVolume}
            </span>
          )}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E0E8F0] bg-white p-2">
        <div className="flex items-center gap-1 rounded-md bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-semibold ${viewMode === "cards" ? "bg-white text-[#102A72] shadow-sm" : "text-gray-500"}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-semibold ${viewMode === "list" ? "bg-white text-[#102A72] shadow-sm" : "text-gray-500"}`}
          >
            <List className="h-3.5 w-3.5" /> Lista
          </button>
        </div>
        {viewMode === "list" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Clique no título da coluna para ordenar</span>
            <button
              type="button"
              onClick={() => {
                const rows = sortedData.map(client => ({
                  "Nome do cliente": client.nome,
                  Placas: client.placas,
                  "Último contato": client.ultimoContato || "-",
                  Boleto: client.ultimoBoleto,
                  Comercial: client.comercial || "-",
                  CSM: client.csm || "-",
                  Situação: client.situacao || "-",
                  Decisor: client.decisor || "-",
                  "Contato do decisor": client.contatoDecissor || "-",
                }));
                const worksheet = XLSX.utils.json_to_sheet(rows);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Ongoing");
                XLSX.writeFile(workbook, `ongoing_${new Date().toISOString().slice(0, 10)}.xlsx`);
              }}
              disabled={!sortedData.length}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Exportar Excel
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <main>
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
                  {data.length}
                </span>
              </div>

              {/* Filtrados — só quando há filtro ativo */}
              {sortedData.length !== data.length && (
                <div
                  className="flex flex-col items-center justify-center flex-1 py-3 px-2 border-r"
                  style={{ borderColor: "#E0E8F0" }}
                >
                  <span className="text-[11px] text-gray-500 leading-none mb-1">
                    Filtrados
                  </span>
                  <span
                    className="text-xl font-bold leading-none"
                    style={{ color: "#001F3F" }}
                  >
                    {sortedData.length}
                  </span>
                </div>
              )}

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
                      <Flag size={12} className="fill-current" />
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
            </div>

            {viewMode === "list" && sortedData.length > 0 && (
              <div className="mb-4 overflow-x-auto rounded-lg border border-[#E0E8F0] bg-white shadow-sm">
                <table className="w-full min-w-[1050px] text-left text-xs">
                  <thead className="bg-[#F1F5F9] text-[10px] uppercase tracking-wide text-gray-500">
                    <tr>
                      {SORTABLE_COLUMNS.map(column => (
                        <th key={column.key} className="whitespace-nowrap px-1 py-1 font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              if (sortKey === column.key) {
                                setSortDirection(current => current === "asc" ? "desc" : "asc");
                              } else {
                                setSortKey(column.key);
                                setSortDirection("asc");
                              }
                            }}
                            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-left hover:bg-blue-100 hover:text-[#102A72] ${sortKey === column.key ? "text-[#102A72]" : ""}`}
                            title={`Ordenar por ${column.label}`}
                          >
                            {column.label}
                            {sortKey === column.key && (sortDirection === "asc" ? <ArrowDownAZ className="h-3 w-3" /> : <ArrowUpAZ className="h-3 w-3" />)}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {sortedData.map(client => (
                      <tr
                        key={client.id}
                        className="cursor-pointer hover:bg-blue-50/50"
                        onClick={() => {
                          setSelectedClient(client);
                          setIsModalOpen(true);
                        }}
                      >
                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-[#102A72]">{client.nome}</td>
                        <td className="px-3 py-2">{client.placas.toLocaleString("pt-BR")}</td>
                        <td className="whitespace-nowrap px-3 py-2">{client.ultimoContato || "-"}</td>
                        <td className="whitespace-nowrap px-3 py-2">{client.ultimoBoleto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                        <td className="px-3 py-2">{client.comercial || "-"}</td>
                        <td className="px-3 py-2">{client.csm || "-"}</td>
                        <td className="px-3 py-2">{client.situacao || "-"}</td>
                        <td className="px-3 py-2">{client.decisor || "-"}</td>
                        <td className="px-3 py-2">{client.contatoDecissor || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Grid de Cards */}
            {sortedData.length === 0 ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <p className="text-gray-600 text-lg">
                  Nenhum cliente encontrado com os filtros selecionados.
                </p>
              </div>
            ) : viewMode === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {sortedData.map((client, index) => (
                  <div key={`${client.id}-${index}`} className="space-y-2">
                    {trendStartDate && trendEndDate && (
                      <URsTrendIndicator
                        codigoCliente={client.codigoCliente}
                        startDate={new Date(trendStartDate)}
                        endDate={new Date(trendEndDate)}
                      />
                    )}
                    <div
                      onClick={() => {
                        setSelectedClient(client);
                        setIsModalOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <OngoingCard
                        client={client}
                        npsAverage={npsAverageByCentralId.get(client.centralId) ?? null}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* Modal de Detalhes */}
      {selectedClient && (
        <OngoingClientModal
          client={selectedClient}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

    </div>
  );
}
