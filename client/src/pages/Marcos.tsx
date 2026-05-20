import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePainelData, ClienteMarcoDetalhado } from '@/hooks/usePainelData';
import URsTrendIndicator from '@/components/URsTrendIndicator';

export default function Marcos() {
  const { data, loading } = usePainelData();
  const [selectedMarco, setSelectedMarco] = useState<number | null>(null);
  const [searchCliente, setSearchCliente] = useState<string>('');
  const [trendStartDate, setTrendStartDate] = useState<string>('');
  const [trendEndDate, setTrendEndDate] = useState<string>('');

  // Agrupar clientes por marco
  const clientesPorMarco: Record<number, ClienteMarcoDetalhado[]> = {};
  data?.clientesMarcoDetalhado?.forEach(cliente => {
    const marco = cliente.marco;
    if (!clientesPorMarco[marco]) {
      clientesPorMarco[marco] = [];
    }
    clientesPorMarco[marco].push(cliente);
  });

  // Marcos disponíveis
  const marcos = Object.keys(clientesPorMarco)
    .map(Number)
    .sort((a, b) => a - b);

  // Filtrar clientes
  let filteredClientes = selectedMarco !== null && clientesPorMarco[selectedMarco]
    ? clientesPorMarco[selectedMarco]
    : Object.values(clientesPorMarco).flat();

  if (searchCliente.trim()) {
    filteredClientes = filteredClientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(searchCliente.toLowerCase())
    );
  }

  const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626'];

  return (
    <div className="md:ml-20 p-4 md:p-8" style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#001F3F' }}>Dashboard Marcos</h1>
            <p className="text-gray-600 mt-1">Clientes por marco de implementação</p>
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
                value={selectedMarco ?? 'todos'}
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
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tendência De</label>
              <input
                type="date"
                value={trendStartDate}
                onChange={(e) => setTrendStartDate(e.target.value)}
                className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tendência Até</label>
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
      </header>

      {/* Cards de Marcos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClientes.map((cliente, idx) => (
          <div
            key={`${cliente.marco}-${cliente.nome}`}
            className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow"
            style={{ borderColor: '#E0E8F0' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex items-center justify-center font-bold text-xs w-6 h-6 rounded-full"
                    style={{
                      backgroundColor: colors[cliente.marco % colors.length] + '20',
                      color: colors[cliente.marco % colors.length],
                    }}
                  >
                    M{cliente.marco}
                  </span>
                  <h3 className="font-semibold text-gray-800">{cliente.nome}</h3>
                </div>
                <p className="text-xs text-gray-500">{cliente.estado}</p>
              </div>
            </div>

            {/* Indicador de Tendência */}
            {trendStartDate && trendEndDate && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E0E8F0' }}>
                <URsTrendIndicator
                  codigoCliente={cliente.nome}
                  startDate={new Date(trendStartDate)}
                  endDate={new Date(trendEndDate)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredClientes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum cliente encontrado</p>
        </div>
      )}
    </div>
  );
}
