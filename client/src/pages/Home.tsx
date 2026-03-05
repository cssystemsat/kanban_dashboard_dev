import { Button } from "@/components/ui/button";
import KanbanColumn from "@/components/KanbanColumn";
import DateFilterCompact from "@/components/DateFilterCompact";
import ClientDetailsModal from "@/components/ClientDetailsModal";
import AtendimentoModal from "@/components/AtendimentoModal";
import AISearchBox from "@/components/AISearchBox";
import { useKanbanData, ClientData } from "@/hooks/useKanbanData";
import { Flag, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Dashboard do CS - Kanban com scroll horizontal
 * Design: Corporate Tech (SystemSat)
 * - Cores: Azul Marinho (#001F3F) + Verde Neon (#00DD00)
 * - Layout: Cada marco com seu próprio scroll
 * - Logo: SystemSat no topo
 */
export default function Home() {
  const { data, loading, error, fetchData } = useKanbanData();
  const [showOnlyRedFlag, setShowOnlyRedFlag] = useState(false);
  const [selectedAtendente, setSelectedAtendente] = useState<string | null>(null);
  const [searchCliente, setSearchCliente] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'atrasado'>('all');
  const [dateFilterStart, setDateFilterStart] = useState<Date | null>(null);
  const [dateFilterEnd, setDateFilterEnd] = useState<Date | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [atendimentoClient, setAtendimentoClient] = useState<ClientData | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [percentualDesatualizadoFilter, setPercentualDesatualizadoFilter] = useState<number | null>(null);
  const [selectedObjetivo, setSelectedObjetivo] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrar dados baseado no toggle de Red Flag, CSM, busca de cliente, status e data
  let filteredData = showOnlyRedFlag ? data.filter(client => client.redFlag) : data;
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
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      const clientDate = new Date(year, month - 1, day);
      return clientDate >= dateFilterStart && clientDate <= dateFilterEnd;
    });
  }
  if (percentualDesatualizadoFilter !== null) {
    filteredData = filteredData.filter(client => 
      client.percentualDesatualizado !== undefined && client.percentualDesatualizado >= percentualDesatualizadoFilter
    );
  }
  if (selectedObjetivo) {
    filteredData = filteredData.filter(client => 
      client.tagsCliente && client.tagsCliente.toLowerCase().includes(selectedObjetivo.toLowerCase())
    );
  }
  // Calcular Red Flags considerando todos os filtros (data, CSM, etc)
  let baseDataForCounts = data;
  if (selectedAtendente) {
    baseDataForCounts = baseDataForCounts.filter(client => client.atendente === selectedAtendente);
  }
  if (dateFilterStart && dateFilterEnd) {
    baseDataForCounts = baseDataForCounts.filter(client => {
      if (!client.entrada) return false;
      const parts = client.entrada.trim().split('/');
      if (parts.length !== 3) return false;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      const clientDate = new Date(year, month - 1, day);
      return clientDate >= dateFilterStart && clientDate <= dateFilterEnd;
    });
  }
  let redFlagCount = baseDataForCounts.filter(client => client.redFlag).length;
  
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
    const dateA = parseDate(a.entrada);
    const dateB = parseDate(b.entrada);
    return dateA.getTime() - dateB.getTime(); // Mais antigos primeiro
  });

  // Agrupar clientes por marco
  // Clientes com isComplete=true pertencem APENAS à coluna "100% Implantados"
  const marcos = [
    { id: 1, nome: "Marco 1 (7 dias)", clientes: sortedData.filter(c => c.marco === 1 && !c.isComplete) },
    { id: 2, nome: "Marco 2 (21 dias)", clientes: sortedData.filter(c => c.marco === 2 && !c.isComplete) },
    { id: 3, nome: "Marco 3 (49 dias)", clientes: sortedData.filter(c => c.marco === 3 && !c.isComplete) },
    { id: 4, nome: "Marco 4 (70 dias)", clientes: sortedData.filter(c => c.marco === 4 && !c.isComplete) },
    { id: 5, nome: "Marco 5 (180 dias)", clientes: sortedData.filter(c => c.marco === 5 && !c.isComplete) },
    { id: 6, nome: "100% Implantados", clientes: sortedData.filter(c => c.isComplete) },
  ];

  // Calcular estatísticas considerando todos os filtros
  const totalClientes = filteredData.length;
  const clientesNoPrazo = baseDataForCounts.filter(c => c.marcoStatus === 'ok').length;
  const clientesAtrasados = baseDataForCounts.filter(c => c.marcoStatus === 'atrasado').length;

  return (
    <div className="min-h-screen md:ml-20" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header com Logo e Título */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: '#001F3F', borderColor: '#E0E8F0' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard do CS</h1>
                <p className="text-sm text-gray-300 mt-1">
                  Acompanhamento de clientes por etapa de implementação
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#E0E8F0', minWidth: '150px' }}
              />
              
              <button
                onClick={() => setStatusFilter(statusFilter === 'ok' ? 'all' : 'ok')}
                className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === 'ok'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'border border-green-600 text-green-600 hover:bg-green-50 bg-transparent'
                }`}
              >
                No Prazo ({clientesNoPrazo})
              </button>
              
              <button
                onClick={() => setStatusFilter(statusFilter === 'atrasado' ? 'all' : 'atrasado')}
                className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === 'atrasado'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'border border-red-600 text-red-600 hover:bg-red-50 bg-transparent'
                }`}
              >
                Atrasados ({clientesAtrasados})
              </button>
              
              <Button
                onClick={() => setShowOnlyRedFlag(!showOnlyRedFlag)}
                className={`gap-2 whitespace-nowrap ${
                  showOnlyRedFlag
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'border-2 border-red-600 text-red-600 hover:bg-red-50 bg-transparent'
                }`}
              >
                <Flag className="w-4 h-4" />
                Red Flags {redFlagCount > 0 && `(${redFlagCount})`}
              </Button>

              <DateFilterCompact 
                onDateChange={(start, end) => {
                  setDateFilterStart(start);
                  setDateFilterEnd(end);
                }}
              />
              
              <select
                value={selectedAtendente || ''}
                onChange={(e) => setSelectedAtendente(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2"
                style={{ borderColor: '#E0E8F0' }}
              >
                <option value="">Todos os CSMs</option>
                {csms.map(csm => (
                  <option key={csm} value={csm}>
                    {csm}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                max="100"
                placeholder="% Desatualizado"
                value={percentualDesatualizadoFilter !== null ? percentualDesatualizadoFilter : ''}
                onChange={(e) => setPercentualDesatualizadoFilter(e.target.value ? parseFloat(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#E0E8F0', minWidth: '120px' }}
              />
              
              <select
                value={selectedObjetivo || ''}
                onChange={(e) => setSelectedObjetivo(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2"
                style={{ borderColor: '#E0E8F0', minWidth: '140px' }}
              >
                <option value="">Todos os Objetivos</option>
                <option value="Videomensagem">Videomensagem</option>
                <option value="Identificacao">Identificacao motorista</option>
                <option value="Lobo">Lobo Solitario</option>
              </select>
              
              <Button
                onClick={fetchData}
                disabled={loading}
                className="gap-2 text-gray-900 bg-white hover:bg-gray-100 border border-gray-300 whitespace-nowrap"
              >
                <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Resumo de Filtros Ativos */}
      {(dateFilterStart || dateFilterEnd || searchCliente || statusFilter !== 'all' || showOnlyRedFlag || selectedAtendente || percentualDesatualizadoFilter !== null || selectedObjetivo) && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold" style={{ color: '#001F3F' }}>Filtros Ativos:</span>
            {dateFilterStart && dateFilterEnd && ` Data: ${dateFilterStart.toLocaleDateString('pt-BR')} - ${dateFilterEnd.toLocaleDateString('pt-BR')}`}
            {searchCliente && ` | Cliente: ${searchCliente}`}
            {statusFilter !== 'all' && ` | Status: ${statusFilter === 'ok' ? 'No Prazo' : 'Atrasado'}`}
            {showOnlyRedFlag && ' | Red Flags'}
            {selectedAtendente && ` | CSM: ${selectedAtendente}`}
            {percentualDesatualizadoFilter !== null && ` | % Desatualizado >= ${percentualDesatualizadoFilter}%`}
            {selectedObjetivo && ` | Objetivo: ${selectedObjetivo}`}
          </p>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="p-6">
        {error && (
          <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              Erro ao carregar dados: {error}
            </p>
          </div>
        )}

        {showOnlyRedFlag && filteredData.length === 0 && !loading && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ Nenhum cliente marcado como Red Flag. Excelente!
            </p>
          </div>
        )}

        {selectedAtendente && filteredData.length === 0 && !loading && !showOnlyRedFlag && (
          <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Nenhum cliente encontrado para o CSM selecionado.
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
            {/* Estatísticas - Painéis como Botões */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border cursor-pointer hover:shadow-md transition-shadow" style={{ borderColor: '#E0E8F0' }}>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-3xl font-bold" style={{ color: '#001F3F' }}>{totalClientes}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border cursor-pointer hover:shadow-md transition-shadow" style={{ borderColor: statusFilter === 'ok' ? '#00DD00' : '#E0E8F0', borderWidth: statusFilter === 'ok' ? '2px' : '1px', backgroundColor: statusFilter === 'ok' ? '#F0FFF4' : '#FFFFFF' }} onClick={() => setStatusFilter(statusFilter === 'ok' ? 'all' : 'ok')}>
                <p className="text-sm text-gray-600">No Prazo</p>
                <p className="text-3xl font-bold" style={{ color: '#00DD00' }}>{clientesNoPrazo}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border cursor-pointer hover:shadow-md transition-shadow" style={{ borderColor: statusFilter === 'atrasado' ? '#EF4444' : '#E0E8F0', borderWidth: statusFilter === 'atrasado' ? '2px' : '1px', backgroundColor: statusFilter === 'atrasado' ? '#FEF2F2' : '#FFFFFF' }} onClick={() => setStatusFilter(statusFilter === 'atrasado' ? 'all' : 'atrasado')}>
                <p className="text-sm text-gray-600">Atrasados</p>
                <p className="text-3xl font-bold text-red-600">{clientesAtrasados}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border cursor-pointer hover:shadow-md transition-shadow" style={{ borderColor: '#E0E8F0' }}>
                <p className="text-sm text-gray-600">Red Flags</p>
                <p className="text-3xl font-bold text-red-600">{redFlagCount}</p>
              </div>
            </div>



            {/* Kanban com Scroll Horizontal por Marco */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 overflow-x-auto" style={{ height: 'auto', minHeight: '600px' }}>
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
