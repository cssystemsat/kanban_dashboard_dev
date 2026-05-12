import { Button } from "@/components/ui/button";
import KanbanColumn from "@/components/KanbanColumn";
import DateFilterCompact from "@/components/DateFilterCompact";
import ClientDetailsModal from "@/components/ClientDetailsModal";
import AtendimentoModal from "@/components/AtendimentoModal";
import AISearchBox from "@/components/AISearchBox";

import { useKanbanData, ClientData } from "@/hooks/useKanbanData";
import { Flag, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

const FLAG_LEVELS = ['Red Flag', 'Yellow Flag', 'Black Flag'] as const;
type FlagLevel = typeof FLAG_LEVELS[number];

const FLAG_STYLES: Record<FlagLevel, { color: string; border: string; bg: string; activeBg: string; activeText: string }> = {
  'Red Flag':    { color: '#DC2626', border: '#DC2626', bg: 'transparent',  activeBg: '#DC2626', activeText: '#FFFFFF' },
  'Yellow Flag': { color: '#D97706', border: '#D97706', bg: 'transparent',  activeBg: '#D97706', activeText: '#FFFFFF' },
  'Black Flag':  { color: '#1F2937', border: '#374151', bg: '#FFFFFF',      activeBg: '#374151', activeText: '#FFFFFF' },
};

export default function Home() {
  const { data, loading, error, fetchData } = useKanbanData();
  const [flagFilter, setFlagFilter] = useState<FlagLevel | null>(null);
  const [selectedAtendente, setSelectedAtendente] = useState<string | null>(null);
  const [searchCliente, setSearchCliente] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'atrasado'>('all');
  const [dateFilterStart, setDateFilterStart] = useState<Date | null>(null);
  const [dateFilterEnd, setDateFilterEnd] = useState<Date | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [atendimentoClient, setAtendimentoClient] = useState<ClientData | null>(null);
  const [percentualDesatualizadoFilter, setPercentualDesatualizadoFilter] = useState<number | null>(null);
  const [diferencaMaxInput, setDiferencaMaxInput] = useState<string>('');
  const [topBoleto, setTopBoleto] = useState<number>(0);
  const [topVolume, setTopVolume] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrar dados
  let filteredData = flagFilter ? data.filter(client => client.flag === flagFilter) : data;
  if (selectedAtendente) {
    filteredData = filteredData.filter(client => client.atendente === selectedAtendente);
  }
  if (searchCliente.trim()) {
    filteredData = filteredData.filter(client =>
      client.nome.toLowerCase().includes(searchCliente.toLowerCase())
    );
  }
  if (statusFilter !== 'all') {
    filteredData = filteredData.filter(client => client.marcoStatus === statusFilter);
  }
  if (dateFilterStart && dateFilterEnd) {
    filteredData = filteredData.filter(client => {
      if (!client.entrada) return false;
      const parts = client.entrada.trim().split('/');
      if (parts.length !== 3) return false;
      const clientDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return clientDate >= dateFilterStart && clientDate <= dateFilterEnd;
    });
  }
  if (percentualDesatualizadoFilter !== null) {
    filteredData = filteredData.filter(client =>
      client.percentualDesatualizado !== undefined && client.percentualDesatualizado >= percentualDesatualizadoFilter
    );
  }
  // Filtro de Diferença: mostra quem tem delta <= -threshold (paga mais do que usa)
  const diferencaThreshold = diferencaMaxInput !== '' ? parseFloat(diferencaMaxInput) : null;
  if (diferencaThreshold !== null && !isNaN(diferencaThreshold)) {
    filteredData = filteredData.filter(client => {
      if (!client.deltaConsumo) return false;
      const val = parseFloat(String(client.deltaConsumo).replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.'));
      return !isNaN(val) && val <= -diferencaThreshold;
    });
  }
  // Filtros Top Boleto e Top Volume
  if (topBoleto > 0) {
    const topBoletoClientes = [...data]
      .sort((a, b) => {
        const aVal = parseFloat(String(a.ultimoBoleto || '0').replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.')) || 0;
        const bVal = parseFloat(String(b.ultimoBoleto || '0').replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.')) || 0;
        return bVal - aVal;
      })
      .slice(0, topBoleto)
      .map(c => c.nome);
    filteredData = filteredData.filter(c => topBoletoClientes.includes(c.nome));
  }
  if (topVolume > 0) {
    const topVolumeClientes = [...data]
      .sort((a, b) => (b.rastreadores?.length || 0) - (a.rastreadores?.length || 0))
      .slice(0, topVolume)
      .map(c => c.nome);
    filteredData = filteredData.filter(c => topVolumeClientes.includes(c.nome));
  }


  // Contagens base (sem filtro de flag, mas com filtros de CSM e data)
  let baseDataForCounts = data;
  if (selectedAtendente) {
    baseDataForCounts = baseDataForCounts.filter(client => client.atendente === selectedAtendente);
  }
  if (dateFilterStart && dateFilterEnd) {
    baseDataForCounts = baseDataForCounts.filter(client => {
      if (!client.entrada) return false;
      const parts = client.entrada.trim().split('/');
      if (parts.length !== 3) return false;
      const clientDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return clientDate >= dateFilterStart && clientDate <= dateFilterEnd;
    });
  }

  // Contagem por nível de flag
  const flagCounts: Record<FlagLevel, number> = {
    'Red Flag':    baseDataForCounts.filter(c => c.flag === 'Red Flag').length,
    'Yellow Flag': baseDataForCounts.filter(c => c.flag === 'Yellow Flag').length,
    'Black Flag':  baseDataForCounts.filter(c => c.flag === 'Black Flag').length,
  };

  const clientesNoPrazo = baseDataForCounts.filter(c => c.marcoStatus === 'ok').length;
  const clientesAtrasados = baseDataForCounts.filter(c => c.marcoStatus === 'atrasado').length;

  // Obter lista única de CSMs
  const csms = Array.from(new Set(data.map(c => c.atendente).filter(Boolean))).sort();

  // Ordenar clientes por data de entrada (mais antigos em cima)
  const sortedData = [...filteredData].sort((a, b) => {
    const parseDate = (dateStr: string | undefined) => {
      if (!dateStr) return new Date(0);
      const parts = dateStr.trim().split('/');
      if (parts.length !== 3) return new Date(0);
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    };
    return parseDate(a.entrada).getTime() - parseDate(b.entrada).getTime();
  });

  // Agrupar clientes por marco
  const marcos = [
    { id: 1, nome: "Marco 1 (7 dias)",   clientes: sortedData.filter(c => c.marco === 1 && !c.isComplete) },
    { id: 2, nome: "Marco 2 (21 dias)",  clientes: sortedData.filter(c => c.marco === 2 && !c.isComplete) },
    { id: 3, nome: "Marco 3 (49 dias)",  clientes: sortedData.filter(c => c.marco === 3 && !c.isComplete) },
    { id: 4, nome: "Marco 4 (70 dias)",  clientes: sortedData.filter(c => c.marco === 4 && !c.isComplete) },
    { id: 5, nome: "Marco 5 (180 dias)", clientes: sortedData.filter(c => c.marco === 5 && !c.isComplete) },
    { id: 6, nome: "100% Implantados",   clientes: sortedData.filter(c => c.isComplete) },
  ];

  const totalClientes = filteredData.length;
  const diferencaActive = diferencaMaxInput !== '' && !isNaN(parseFloat(diferencaMaxInput));
  const hasActiveFilter = !!(dateFilterStart || dateFilterEnd || searchCliente || statusFilter !== 'all' || flagFilter || selectedAtendente || percentualDesatualizadoFilter !== null || diferencaActive || topBoleto > 0 || topVolume > 0);

  return (
    <div className="min-h-screen md:ml-20" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header compacto */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: '#001F3F', borderColor: '#1a3a5c' }}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white leading-none whitespace-nowrap">Dashboard do CS</h1>

            {/* Filtros na mesma linha */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                style={{ width: '130px' }}
              />

              <select
                value={selectedAtendente || ''}
                onChange={(e) => setSelectedAtendente(e.target.value || null)}
                className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="">CSM: Todos</option>
                {csms.map(csm => (
                  <option key={csm} value={csm}>{csm}</option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                max="100"
                placeholder="% Desatualiz."
                value={percentualDesatualizadoFilter !== null ? percentualDesatualizadoFilter : ''}
                onChange={(e) => setPercentualDesatualizadoFilter(e.target.value ? parseFloat(e.target.value) : null)}
                className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                style={{ width: '100px' }}
              />

              <DateFilterCompact
                onDateChange={(start, end) => {
                  setDateFilterStart(start);
                  setDateFilterEnd(end);
                }}
              />

              <input
                type="number"
                placeholder="Dif ≤ -R$"
                value={diferencaMaxInput}
                onChange={(e) => setDiferencaMaxInput(e.target.value)}
                className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border focus:outline-none focus:ring-1 focus:ring-red-300"
                style={{ borderColor: '#FCA5A5', width: '95px' }}
                min="0"
              />

              <div className="flex items-center gap-1">
                <label className="text-xs text-white font-medium whitespace-nowrap">Top Boletos:</label>
                <input
                  type="number"
                  value={topBoleto}
                  onChange={(e) => setTopBoleto(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  style={{ width: '60px' }}
                  min="0"
                />
              </div>

              <div className="flex items-center gap-1">
                <label className="text-xs text-white font-medium whitespace-nowrap">Top Volume:</label>
                <input
                  type="number"
                  value={topVolume}
                  onChange={(e) => setTopVolume(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-7 px-2 rounded text-xs text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  style={{ width: '60px' }}
                  min="0"
                />
              </div>
            </div>

            <Button
              onClick={fetchData}
              disabled={loading}
              size="sm"
              className="gap-1.5 text-gray-900 bg-white hover:bg-gray-100 border border-gray-300 whitespace-nowrap h-7 text-xs"
            >
              <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>
      </header>

      {/* Resumo de Filtros Ativos */}
      {hasActiveFilter && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold" style={{ color: '#001F3F' }}>Filtros:</span>
          {dateFilterStart && dateFilterEnd && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Data: {dateFilterStart.toLocaleDateString('pt-BR')} - {dateFilterEnd.toLocaleDateString('pt-BR')}</span>}
          {searchCliente && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Cliente: {searchCliente}</span>}
          {statusFilter !== 'all' && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Status: {statusFilter === 'ok' ? 'No Prazo' : 'Atrasado'}</span>}
          {flagFilter && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">{flagFilter}</span>}
          {selectedAtendente && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">CSM: {selectedAtendente}</span>}
          {percentualDesatualizadoFilter !== null && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">% Desatualizado &ge; {percentualDesatualizadoFilter}%</span>}
          {diferencaActive && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">Diferença &le; -R$ {parseFloat(diferencaMaxInput).toFixed(2)}</span>}
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="px-4 pt-3 pb-4">
        {error && (
          <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">Erro ao carregar dados: {error}</p>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#00DD00' }}></div>
              <p className="text-gray-600">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Estatísticas — barra horizontal ponta a ponta */}
            <div className="flex items-stretch mb-4 bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#E0E8F0' }}>
              {/* Total */}
              <div className="flex flex-col items-center justify-center flex-1 py-3 px-2 border-r" style={{ borderColor: '#E0E8F0' }}>
                <span className="text-[11px] text-gray-500 leading-none mb-1">Total</span>
                <span className="text-xl font-bold leading-none" style={{ color: '#001F3F' }}>{totalClientes}</span>
              </div>

              {/* No Prazo */}
              <button
                onClick={() => setStatusFilter(statusFilter === 'ok' ? 'all' : 'ok')}
                className="flex flex-col items-center justify-center flex-1 py-3 px-2 border-r transition-colors"
                style={{ borderColor: '#E0E8F0', backgroundColor: statusFilter === 'ok' ? '#D1FAE5' : 'transparent' }}
              >
                <span className="text-[11px] text-gray-500 leading-none mb-1">No prazo</span>
                <span className="text-xl font-bold leading-none" style={{ color: '#059669' }}>{clientesNoPrazo}</span>
              </button>

              {/* Atrasados */}
              <button
                onClick={() => setStatusFilter(statusFilter === 'atrasado' ? 'all' : 'atrasado')}
                className="flex flex-col items-center justify-center flex-1 py-3 px-2 border-r transition-colors"
                style={{ borderColor: '#E0E8F0', backgroundColor: statusFilter === 'atrasado' ? '#FEE2E2' : 'transparent' }}
              >
                <span className="text-[11px] text-gray-500 leading-none mb-1">Atrasados</span>
                <span className="text-xl font-bold leading-none text-red-600">{clientesAtrasados}</span>
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
                      borderRight: isLast ? 'none' : `1px solid #E0E8F0`,
                      backgroundColor: isActive
                        ? (level === 'Black Flag' ? '#374151' : s.activeBg)
                        : (level === 'Black Flag' ? '#F9FAFB' : 'transparent'),
                    }}
                  >
                    <span className="flex items-center gap-1 text-[11px] leading-none mb-1" style={{ color: isActive ? '#FFFFFF' : s.color }}>
                      <Flag className="w-3 h-3 fill-current" />
                      {level.replace(' Flag', '')}
                    </span>
                    <span className="text-xl font-bold leading-none" style={{ color: isActive ? '#FFFFFF' : s.color }}>
                      {flagCounts[level]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Kanban */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 overflow-x-auto" style={{ minHeight: '600px' }}>
              {marcos.map(marco => (
                <KanbanColumn
                  key={marco.id}
                  marcoNumber={marco.id}
                  marcoName={marco.nome}
                  clients={marco.clientes}
                  onClientClick={(client) => {
                    setSelectedClient(client);
                    setIsModalOpen(true);
                  }}
                  onAtendimento={(client) => setAtendimentoClient(client)}
                />
              ))}
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

      {/* Modal de Atendimento */}
      {atendimentoClient && (
        <AtendimentoModal
          client={atendimentoClient}
          onClose={() => setAtendimentoClient(null)}
        />
      )}

      {/* Busca com IA */}
      <AISearchBox clients={filteredData} />
    </div>
  );
}
