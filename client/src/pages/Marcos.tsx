'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePainelData, ClienteMarcoDetalhado } from '@/hooks/usePainelData';
import URsTrendIndicator from '@/components/URsTrendIndicator';
import MarcosCard from '@/components/MarcosCard';

export default function Marcos() {
  const { data, loading } = usePainelData();
  const [selectedClient, setSelectedClient] = useState<ClienteMarcoDetalhado | null>(null);
  const [searchCliente, setSearchCliente] = useState<string>('');
  const [selectedMarco, setSelectedMarco] = useState<number | null>(null);
  const [trendStartDate, setTrendStartDate] = useState<string>('');
  const [trendEndDate, setTrendEndDate] = useState<string>('');

  const clientes = data?.clientesMarcoDetalhado || [];

  // Filtrar dados
  let filteredData = clientes;

  if (searchCliente.trim()) {
    filteredData = filteredData.filter(client =>
      client.nome.toLowerCase().includes(searchCliente.toLowerCase())
    );
  }

  if (selectedMarco !== null) {
    filteredData = filteredData.filter(client => client.marco === selectedMarco);
  }

  const marcos = Array.from(new Set(clientes.map(c => c.marco))).sort((a, b) => a - b);
  const marcoCounts: Record<number, number> = {};
  marcos.forEach(m => {
    marcoCounts[m] = clientes.filter(c => c.marco === m).length;
  });

  const sortedData = [...filteredData];
  const hasActiveFilter = !!(searchCliente || selectedMarco !== null);

  return (
    <div className="md:ml-20 p-4 md:p-8" style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#001F3F' }}>Dashboard Marcos</h1>
            <p className="text-gray-600 mt-1">Clientes por marco de contrato</p>
          </div>
          <button
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-4 border shadow-sm" style={{ borderColor: '#E0E8F0' }}>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Cliente</label>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
                style={{ width: '150px' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Marco</label>
              <select
                value={selectedMarco === null ? 'todos' : selectedMarco}
                onChange={(e) => setSelectedMarco(e.target.value === 'todos' ? null : parseInt(e.target.value))}
                className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
              >
                <option value="todos">Todos</option>
                {marcos.map(marco => (
                  <option key={marco} value={marco}>Marco {marco}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tendencia De</label>
              <input
                type="date"
                value={trendStartDate}
                onChange={(e) => setTrendStartDate(e.target.value)}
                className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tendencia Ate</label>
              <input
                type="date"
                value={trendEndDate}
                onChange={(e) => setTrendEndDate(e.target.value)}
                className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
              />
            </div>

            <button
              onClick={() => {
                setSearchCliente('');
                setSelectedMarco(null);
                setTrendStartDate('');
                setTrendEndDate('');
              }}
              className="h-8 px-3 rounded-md text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Resumo de Filtros Ativos */}
        {(hasActiveFilter) && (
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 mt-3 rounded-lg flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold" style={{ color: '#001F3F' }}>Filtros:</span>
            {searchCliente && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Cliente: {searchCliente}</span>}
            {selectedMarco !== null && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Marco: {selectedMarco}</span>}
          </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main>
        {loading && clientes.length === 0 ? (
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
                <span className="text-xl font-bold leading-none" style={{ color: '#001F3F' }}>{clientes.length}</span>
              </div>

              {/* Filtrados — só quando há filtro ativo */}
              {sortedData.length !== clientes.length && (
                <div className="flex flex-col items-center justify-center flex-1 py-3 px-2 border-r" style={{ borderColor: '#E0E8F0' }}>
                  <span className="text-[11px] text-gray-500 leading-none mb-1">Filtrados</span>
                  <span className="text-xl font-bold leading-none" style={{ color: '#001F3F' }}>{sortedData.length}</span>
                </div>
              )}

              {/* Marcos */}
              {marcos.map((marco, i) => {
                const isActive = selectedMarco === marco;
                const isLast = i === marcos.length - 1;
                const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626'];
                const color = colors[i % colors.length];
                return (
                  <button
                    key={marco}
                    onClick={() => setSelectedMarco(isActive ? null : marco)}
                    className="flex flex-col items-center justify-center flex-1 py-3 px-2 transition-colors"
                    style={{
                      borderRight: isLast ? 'none' : `1px solid #E0E8F0`,
                      backgroundColor: isActive ? color + '20' : 'transparent',
                    }}
                  >
                    <span className="text-[11px] leading-none mb-1" style={{ color: isActive ? color : '#6B7280' }}>
                      Marco {marco}
                    </span>
                    <span className="text-xl font-bold leading-none" style={{ color: isActive ? color : '#6B7280' }}>
                      {marcoCounts[marco]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Grid de Cards */}
            {sortedData.length === 0 ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <p className="text-gray-600 text-lg">Nenhum cliente encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {sortedData.map((client, index) => (
                  <div key={`${client.nome}-${index}`} className="space-y-2">
                    {trendStartDate && trendEndDate && (
                      <URsTrendIndicator
                        codigoCliente={client.nome}
                        startDate={new Date(trendStartDate)}
                        endDate={new Date(trendEndDate)}
                      />
                    )}
                    <div
                      onClick={() => setSelectedClient(client)}
                      className="cursor-pointer"
                    >
                      <MarcosCard client={client} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
