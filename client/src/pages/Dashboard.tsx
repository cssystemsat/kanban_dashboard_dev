import { useKanbanData } from '@/hooks/useKanbanData';
import { useKanbanData as useKanbanDataForMap } from '@/hooks/useKanbanData';
import { TrendingUp, Users, AlertCircle, CheckCircle, Filter, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import BrazilMapVisual from '@/components/BrazilMapVisual';
import URsModal from '@/components/URsModal';

export default function Dashboard() {
  const { data, loading, fetchData } = useKanbanData();
  const [selectedMarco, setSelectedMarco] = useState<number | null>(null);
  const [selectedCSM, setSelectedCSM] = useState<string>('');
  const [showRedFlagsOnly, setShowRedFlagsOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'atrasado'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ganho' | 'perda' | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrar dados
  let filteredData = data;
  if (selectedMarco) {
    filteredData = filteredData.filter(c => c.marco === selectedMarco);
  }
  if (selectedCSM) {
    filteredData = filteredData.filter(c => c.atendente === selectedCSM);
  }
  if (showRedFlagsOnly) {
    filteredData = filteredData.filter(c => !!c.flag);
  }
  if (statusFilter !== 'all') {
    filteredData = filteredData.filter(c => c.marcoStatus === statusFilter);
  }

  // Calcular estatísticas
  const totalClientes = filteredData.length;
  const clientesNoPrazo = data.filter(c => c.marcoStatus === 'ok').length;
  const clientesAtrasados = data.filter(c => c.marcoStatus === 'atrasado').length;
  const redFlagCount = filteredData.filter(c => !!c.flag).length;

  // Calcular ganho/perda de URs
  const ganhoTotalURs = filteredData.reduce((acc, c) => {
    const ganho = parseInt(c.ganhoUrs || '0', 10);
    return acc + (isNaN(ganho) ? 0 : ganho);
  }, 0);

  const perdaTotalURs = filteredData.reduce((acc, c) => {
    const perda = parseInt(c.perdaUrs || '0', 10);
    return acc + (isNaN(perda) ? 0 : perda);
  }, 0);

  const saldoURs = ganhoTotalURs - Math.abs(perdaTotalURs);

  // Calcular marcos completados
  const marcosCompletados = filteredData.filter(c => c.marco === 5).length;
  const percentualConclusao = totalClientes > 0 ? Math.round((marcosCompletados / totalClientes) * 100) : 0;

  // Obter lista única de CSMs
  const csms = Array.from(new Set(data.map(c => c.atendente).filter(Boolean)));

  // Preparar dados para o modal
  const clientesGanho = filteredData
    .filter(c => parseInt(c.ganhoUrs || '0', 10) > 0)
    .map(c => ({
      nome: c.nome,
      valor: parseInt(c.ganhoUrs || '0', 10),
      tipo: 'ganho' as const
    }))
    .sort((a, b) => b.valor - a.valor);

  const clientesPerda = filteredData
    .filter(c => parseInt(c.perdaUrs || '0', 10) > 0)
    .map(c => ({
      nome: c.nome,
      valor: parseInt(c.perdaUrs || '0', 10),
      tipo: 'perda' as const
    }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <div className="ml-20 p-8" style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#001F3F' }}>
              Dashboard Principal
            </h1>
            <p className="text-gray-600">
              Visão geral do progresso de implementação
            </p>
          </div>
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
          >
            Atualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg p-6 border shadow-sm mb-8" style={{ borderColor: '#E0E8F0' }}>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5" style={{ color: '#00DD00' }} />
            <h2 className="text-lg font-bold" style={{ color: '#001F3F' }}>Filtros</h2>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {/* Filtro por Marco */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Marco</label>
              <select
                value={selectedMarco || ''}
                onChange={(e) => setSelectedMarco(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0', color: '#001F3F' }}
              >
                <option value="">Todos os Marcos</option>
                {[1, 2, 3, 4, 5].map(m => (
                  <option key={m} value={m}>Marco {m}</option>
                ))}
              </select>
            </div>

            {/* Filtro por CSM */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">CSM</label>
              <select
                value={selectedCSM}
                onChange={(e) => setSelectedCSM(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0', color: '#001F3F' }}
              >
                <option value="">Todos os CSMs</option>
                {csms.map(csm => (
                  <option key={csm} value={csm}>{csm}</option>
                ))}
              </select>
            </div>

            {/* Filtro Red Flags */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Status</label>
              <button
                onClick={() => setShowRedFlagsOnly(!showRedFlagsOnly)}
                className="w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: showRedFlagsOnly ? '#FF6B6B' : '#E0E8F0',
                  color: showRedFlagsOnly ? '#FFFFFF' : '#001F3F',
                  borderColor: '#FF6B6B',
                  border: '1px solid'
                }}
              >
                {showRedFlagsOnly ? 'Red Flags' : 'Todos'}
              </button>
            </div>

            {/* Limpar Filtros */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">&nbsp;</label>
              <button
                onClick={() => {
                  setSelectedMarco(null);
                  setSelectedCSM('');
                  setShowRedFlagsOnly(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: '#F5F7FA',
                  color: '#001F3F',
                  borderColor: '#E0E8F0',
                  border: '1px solid'
                }}
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

          {/* Cards de Estatísticas */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {/* Total de Clientes */}
          <div className="bg-white rounded-lg p-4 border shadow-sm cursor-pointer hover:shadow-md transition-shadow" 
            style={{ borderColor: '#E0E8F0' }}
            onClick={() => setStatusFilter('all')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>
                  {totalClientes}
                </p>
              </div>
              <Users className="w-8 h-8" style={{ color: '#00DD00' }} />
            </div>
          </div>

          {/* Clientes No Prazo */}
          <div className="bg-white rounded-lg p-4 border shadow-sm cursor-pointer hover:shadow-md transition-shadow" 
            style={{ 
              borderColor: statusFilter === 'ok' ? '#00DD00' : '#E0E8F0',
              borderWidth: statusFilter === 'ok' ? '2px' : '1px',
              backgroundColor: statusFilter === 'ok' ? '#F0FFF4' : '#FFFFFF'
            }}
            onClick={() => setStatusFilter(statusFilter === 'ok' ? 'all' : 'ok')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">No Prazo</p>
                <p className="text-2xl font-bold" style={{ color: '#00DD00' }}>
                  {clientesNoPrazo}
                </p>
              </div>
              <CheckCircle className="w-8 h-8" style={{ color: '#00DD00' }} />
            </div>
          </div>

          {/* Clientes Atrasados */}
          <div className="bg-white rounded-lg p-4 border shadow-sm cursor-pointer hover:shadow-md transition-shadow" 
            style={{ 
              borderColor: statusFilter === 'atrasado' ? '#EF4444' : '#E0E8F0',
              borderWidth: statusFilter === 'atrasado' ? '2px' : '1px',
              backgroundColor: statusFilter === 'atrasado' ? '#FEF2F2' : '#FFFFFF'
            }}
            onClick={() => setStatusFilter(statusFilter === 'atrasado' ? 'all' : 'atrasado')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Atrasados</p>
                <p className="text-2xl font-bold text-red-600">
                  {clientesAtrasados}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Red Flags */}
          <div className="bg-white rounded-lg p-4 border shadow-sm" style={{ borderColor: '#E0E8F0' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Red Flags</p>
                <p className="text-2xl font-bold text-red-600">
                  {redFlagCount}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Ganho de URs */}
          <div className="bg-white rounded-lg p-4 border shadow-sm cursor-pointer hover:shadow-md transition-shadow" style={{ borderColor: '#E0E8F0' }} onClick={() => { setModalType('ganho'); setModalOpen(true); }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Ganho URs</p>
                <p className="text-2xl font-bold" style={{ color: '#10B981' }}>
                  +{ganhoTotalURs}
                </p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: '#10B981' }} />
            </div>
          </div>

          {/* Perda de URs */}
          <div className="bg-white rounded-lg p-4 border shadow-sm cursor-pointer hover:shadow-md transition-shadow" style={{ borderColor: '#E0E8F0' }} onClick={() => { setModalType('perda'); setModalOpen(true); }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Perda URs</p>
                <p className="text-2xl font-bold text-red-600">
                  {perdaTotalURs > 0 ? '-' : ''}{perdaTotalURs}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Saldo de URs */}
        <div className="bg-white rounded-lg p-6 border shadow-sm mb-8" style={{ borderColor: '#E0E8F0' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#001F3F' }}>Saldo de URs</h2>
              <p className="text-4xl font-bold" style={{ color: saldoURs >= 0 ? '#10B981' : '#EF4444' }}>
                {saldoURs >= 0 ? '+' : ''}{saldoURs}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">Ganho: <span style={{ color: '#10B981' }}>+{ganhoTotalURs}</span></p>
              <p className="text-sm text-gray-600">Perda: <span style={{ color: '#EF4444' }}>-{perdaTotalURs}</span></p>
            </div>
          </div>
        </div>

        {/* Progresso Geral */}
        <div className="bg-white rounded-lg p-6 border shadow-sm" style={{ borderColor: '#E0E8F0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: '#001F3F' }}>
              Progresso Geral de Implementação
            </h2>
            <TrendingUp className="w-6 h-6" style={{ color: '#00DD00' }} />
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Percentual */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Clientes Completados</span>
                <span className="text-3xl font-bold" style={{ color: '#00DD00' }}>
                  {percentualConclusao}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="h-4 rounded-full transition-all duration-500"
                  style={{
                    width: `${percentualConclusao}%`,
                    backgroundColor: '#00DD00',
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {marcosCompletados} de {totalClientes} clientes completaram todos os marcos
              </p>
            </div>

            {/* Distribuição por Marco */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-4">
                Distribuição por Marco
              </h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((marco) => {
                  const clientesNoMarco = filteredData.filter(c => c.marco === marco).length;
                  const percentual = totalClientes > 0 ? Math.round((clientesNoMarco / totalClientes) * 100) : 0;
                  return (
                    <div key={marco}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Marco {marco}</span>
                        <span className="font-bold" style={{ color: '#001F3F' }}>
                          {clientesNoMarco} ({percentual}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${percentual}%`,
                            backgroundColor: '#00DD00',
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mapa do Brasil */}
        <div className="mt-8">
          <BrazilMapVisual clients={data} />
        </div>
      </div>

      {/* Modal de URs */}
      <URsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        clientes={modalType === 'ganho' ? clientesGanho : clientesPerda}
        tipo={modalType || 'ganho'}
      />
    </div>
  );
}
