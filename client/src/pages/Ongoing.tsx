import { useEffect, useState } from 'react';
import { RefreshCw, Flag } from 'lucide-react';
import { useOngoingData, OngoingClientData } from '@/hooks/useOngoingData';
import DateFilterCompact from '@/components/DateFilterCompact';
import OngoingCard from '@/components/OngoingCard';
import OngoingClientModal from '@/components/OngoingClientModal';
import AtendimentoModal from '@/components/AtendimentoModal';
import type { ClientData } from '@/hooks/useKanbanData';

/**
 * Página Ongoing
 * Design: SystemSat
 * - Grid de cards em ordem alfabética
 * - Mesmos filtros da aba Marcos (sem No Prazo/Atrasados)
 * - Scroll vertical único
 */
export default function Ongoing() {
  const { data, loading } = useOngoingData();
  const [selectedClient, setSelectedClient] = useState<OngoingClientData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [atendimentoClient, setAtendimentoClient] = useState<ClientData | null>(null);
  const [showOnlyRedFlag, setShowOnlyRedFlag] = useState(false);
  const [selectedAtendente, setSelectedAtendente] = useState<string | null>(null);
  const [searchCliente, setSearchCliente] = useState<string>('');
  const [ultimoBoletoMin, setUltimoBoletoMin] = useState<number | null>(null);
  const [ultimoBoletoMax, setUltimoBoletoMax] = useState<number | null>(null);
  const [selectedSituacao, setSelectedSituacao] = useState<string | null>(null);

  // Filtrar dados baseado nos filtros ativos
  let filteredData = showOnlyRedFlag ? data.filter(client => client.redFlag) : data;
  
  if (selectedAtendente) {
    filteredData = filteredData.filter(client => client.csm === selectedAtendente);
  }
  
  if (searchCliente.trim()) {
    filteredData = filteredData.filter(client => 
      client.nome.toLowerCase().includes(searchCliente.toLowerCase())
    );
  }
  
  if (ultimoBoletoMin !== null) {
    filteredData = filteredData.filter(client => client.ultimoBoleto >= ultimoBoletoMin);
  }
  
  if (ultimoBoletoMax !== null) {
    filteredData = filteredData.filter(client => client.ultimoBoleto <= ultimoBoletoMax);
  }
  
  if (selectedSituacao) {
    filteredData = filteredData.filter(client => client.situacao === selectedSituacao);
  }

  // Calcular Red Flags considerando todos os filtros
  let baseDataForCounts = data;
  if (selectedAtendente) {
    baseDataForCounts = baseDataForCounts.filter(client => client.csm === selectedAtendente);
  }
  let redFlagCount = baseDataForCounts.filter(client => client.redFlag).length;

  // Obter lista única de CSMs
  const csms = Array.from(new Set(data.map(c => c.csm).filter(Boolean))).sort();
  
  // Obter lista única de Situações
  const situacoes = Array.from(new Set(data.map(c => c.situacao).filter(Boolean))).sort();

  // Dados já estão ordenados alfabeticamente pelo hook
  const sortedData = [...filteredData];

  return (
    <div className="md:ml-20 p-4 md:p-8" style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#001F3F' }}>
              Dashboard Ongoing
            </h1>
            <p className="text-gray-600 mt-1">Clientes em acompanhamento contínuo</p>
          </div>
          <button
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Busca de Cliente */}
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchCliente}
              onChange={(e) => setSearchCliente(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: '#E0E8F0', minWidth: '150px' }}
            />

            {/* Filtro de Red Flags */}
            <button
              onClick={() => setShowOnlyRedFlag(!showOnlyRedFlag)}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                showOnlyRedFlag
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'border border-red-600 text-red-600 hover:bg-red-50 bg-transparent'
              }`}
            >
              <Flag size={16} />
              Red Flags ({redFlagCount})
            </button>

            {/* Filtro de CSM */}
            <select
              value={selectedAtendente || 'todos'}
              onChange={(e) => setSelectedAtendente(e.target.value === 'todos' ? null : e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: '#E0E8F0' }}
            >
              <option value="todos">Todos os CSMs</option>
              {csms.map(csm => (
                <option key={csm} value={csm}>{csm}</option>
              ))}
            </select>

            {/* Filtro de Último Boleto - Mínimo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Último Boleto Mín</label>
              <input
                type="number"
                placeholder="Mínimo"
                value={ultimoBoletoMin ?? ''}
                onChange={(e) => setUltimoBoletoMin(e.target.value ? parseFloat(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#E0E8F0', width: '120px' }}
              />
            </div>

            {/* Filtro de Último Boleto - Máximo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Último Boleto Máx</label>
              <input
                type="number"
                placeholder="Máximo"
                value={ultimoBoletoMax ?? ''}
                onChange={(e) => setUltimoBoletoMax(e.target.value ? parseFloat(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#E0E8F0', width: '120px' }}
              />
            </div>

            {/* Filtro de Situação */}
            <select
              value={selectedSituacao || 'todos'}
              onChange={(e) => setSelectedSituacao(e.target.value === 'todos' ? null : e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: '#E0E8F0' }}
            >
              <option value="todos">Todas as Situações</option>
              {situacoes.map(situacao => (
                <option key={situacao} value={situacao}>{situacao}</option>
              ))}
            </select>

            {/* Botão Limpar */}
            <button
              onClick={() => {
                setSearchCliente('');
                setShowOnlyRedFlag(false);
                setSelectedAtendente(null);
                setUltimoBoletoMin(null);
                setUltimoBoletoMax(null);
                setSelectedSituacao(null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Resumo de Filtros Ativos */}
        {(ultimoBoletoMin !== null || ultimoBoletoMax !== null || searchCliente || showOnlyRedFlag || selectedAtendente || selectedSituacao) && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 mt-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold" style={{ color: '#001F3F' }}>Filtros Ativos:</span>
              {ultimoBoletoMin !== null && ` Último Boleto Mín: R$ ${ultimoBoletoMin.toFixed(2)}`}
              {ultimoBoletoMax !== null && ` | Máx: R$ ${ultimoBoletoMax.toFixed(2)}`}
              {searchCliente && ` | Cliente: ${searchCliente}`}
              {showOnlyRedFlag && ' | Red Flags'}
              {selectedAtendente && ` | CSM: ${selectedAtendente}`}
              {selectedSituacao && ` | Situação: ${selectedSituacao}`}
            </p>
          </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main>
        {loading && data.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#00DD00' }}></div>
              <p className="text-gray-600">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-3xl font-bold" style={{ color: '#001F3F' }}>{data.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
                <p className="text-sm text-gray-600">Filtrados</p>
                <p className="text-3xl font-bold" style={{ color: '#001F3F' }}>{sortedData.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
                <p className="text-sm text-gray-600">Red Flags</p>
                <p className="text-3xl font-bold text-red-600">{redFlagCount}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
                <p className="text-sm text-gray-600">CSMs</p>
                <p className="text-3xl font-bold" style={{ color: '#001F3F' }}>{csms.length}</p>
              </div>
            </div>

            {/* Grid de Cards */}
            {sortedData.length === 0 ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <p className="text-gray-600 text-lg">Nenhum cliente encontrado com os filtros selecionados.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {sortedData.map((client, index) => (
                  <div
                    key={`${client.id}-${index}`}
                    onClick={() => {
                      setSelectedClient(client);
                      setIsModalOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <OngoingCard
                      client={client}
                      onAtendimento={(c) => {
                        setAtendimentoClient({ nome: c.nome } as ClientData);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Detalhes do Cliente */}
      {selectedClient && (
        <OngoingClientModal
          client={selectedClient}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {/* Modal de Atendimento */}
      {atendimentoClient && (
        <AtendimentoModal
          client={atendimentoClient}
          onClose={() => setAtendimentoClient(null)}
        />
      )}
    </div>
  );
}
