import { useEffect, useState, useMemo } from 'react';
import { useMigracaoListData, MigracaoCard } from '@/hooks/useMigracaoListData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, X, RefreshCw, Search } from 'lucide-react';

type FilterType = 'atendente' | 'plataforma' | 'tempo' | 'cliente';

type EtapaType = 'nao-iniciado' | 'levantamento' | 'envio' | 'cancelada' | 'paralisada' | 'finalizada';

export function Migracao() {
  const { data, loading, error, fetchData } = useMigracaoListData();
  const [filters, setFilters] = useState({
    atendente: '',
    plataforma: '',
    tempo: '',
    cliente: '',
  });
  const [selectedCard, setSelectedCard] = useState<MigracaoCard | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extrair valores únicos para filtros
  const atendentes = useMemo(() => Array.from(new Set(data.map(m => m.responsavel).filter(Boolean))), [data]);
  const plataformas = useMemo(() => Array.from(new Set(data.map(m => m.plataforma).filter(Boolean))), [data]);

  // Função para determinar etapa com lógica correta
  const getEtapa = (migr: MigracaoCard): EtapaType => {
    // Cancelada: T = "Cancelado"
    if (migr.situacao?.toLowerCase() === 'cancelado') return 'cancelada';
    
    // Paralisada: T = "Paralisado"
    if (migr.situacao?.toLowerCase() === 'paralisado') return 'paralisada';
    
    // Finalizada: T = "Finalizada"
    if (migr.situacao?.toLowerCase() === 'finalizada') return 'finalizada';
    
    // Não iniciou: L vazia
    if (!migr.levantamentoDados || migr.levantamentoDados.trim() === '') return 'nao-iniciado';
    
    // Levantamento: L com info e P vazia
    if (migr.levantamentoDados && (!migr.envioDados || migr.envioDados.trim() === '')) {
      return 'levantamento';
    }
    
    // Envio: P com alguma informação
    if (migr.envioDados && migr.envioDados.trim() !== '') {
      return 'envio';
    }
    
    return 'nao-iniciado';
  };

  // Aplicar filtros
  const filteredData = useMemo(() => {
    return data.filter(migr => {
      if (filters.atendente && migr.responsavel !== filters.atendente) return false;
      if (filters.plataforma && migr.plataforma !== filters.plataforma) return false;
      if (filters.cliente && !migr.empresa.toLowerCase().includes(filters.cliente.toLowerCase())) return false;
      
      if (filters.tempo) {
        const duracao = migr.duracao || 0;
        if (filters.tempo === 'curto' && duracao > 30) return false;
        if (filters.tempo === 'medio' && (duracao <= 30 || duracao > 90)) return false;
        if (filters.tempo === 'longo' && duracao <= 90) return false;
      }
      
      return true;
    });
  }, [data, filters]);

  // Agrupar por etapa
  const groupedByEtapa = useMemo(() => {
    const groups: Record<EtapaType, MigracaoCard[]> = {
      'nao-iniciado': [],
      'levantamento': [],
      'envio': [],
      'cancelada': [],
      'paralisada': [],
      'finalizada': [],
    };
    
    filteredData.forEach(migr => {
      const etapa = getEtapa(migr);
      groups[etapa].push(migr);
    });
    
    return groups;
  }, [filteredData]);

  const handleFilterChange = (type: FilterType, value: string) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const etapaLabels: Record<EtapaType, string> = {
    'nao-iniciado': 'Não Iniciou',
    'levantamento': 'Levantamento de Organização de Dados',
    'envio': 'Envio de Comandos',
    'cancelada': 'Cancelada',
    'paralisada': 'Paralisada',
    'finalizada': 'Finalizada',
  };

  const etapaColors: Record<EtapaType, string> = {
    'nao-iniciado': 'bg-gray-50 border-gray-300',
    'levantamento': 'bg-blue-50 border-blue-300',
    'envio': 'bg-purple-50 border-purple-300',
    'cancelada': 'bg-red-50 border-red-300',
    'paralisada': 'bg-yellow-50 border-yellow-300',
    'finalizada': 'bg-green-50 border-green-300',
  };

  if (loading && !data.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Erro ao carregar dados: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Migração</h1>
          <p className="text-gray-600 mt-1">Dashboard de migrações por etapa</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg border border-gray-200">
        {/* Pesquisa por Cliente */}
        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <label className="text-sm font-medium flex items-center gap-2">
            <Search className="w-4 h-4" />
            Pesquisar Cliente
          </label>
          <input
            type="text"
            placeholder="Digite o nome da empresa..."
            value={filters.cliente}
            onChange={(e) => handleFilterChange('cliente', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Atendente</label>
          <select
            value={filters.atendente}
            onChange={(e) => handleFilterChange('atendente', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos</option>
            {atendentes.map(at => (
              <option key={at} value={at}>{at}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Plataforma</label>
          <select
            value={filters.plataforma}
            onChange={(e) => handleFilterChange('plataforma', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todas</option>
            {plataformas.map(plat => (
              <option key={plat} value={plat}>{plat || 'Sem plataforma'}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tempo de Migração</label>
          <select
            value={filters.tempo}
            onChange={(e) => handleFilterChange('tempo', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos</option>
            <option value="curto">&lt; 30 dias</option>
            <option value="medio">30-90 dias</option>
            <option value="longo">&gt; 90 dias</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => setFilters({ atendente: '', plataforma: '', tempo: '', cliente: '' })}
            className="text-sm"
          >
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(etapaLabels).map(([etapa, label]) => {
          const cards = groupedByEtapa[etapa as EtapaType];
          const colors = etapaColors[etapa as EtapaType];
          
          return (
            <div key={etapa} className="flex flex-col gap-4">
              <div className={`sticky top-0 p-3 rounded-lg border-2 ${colors}`}>
                <h2 className="font-bold text-lg">{label}</h2>
                <p className="text-sm text-gray-600">{cards.length} migrações</p>
              </div>

              <div className="space-y-3">
                {cards.map(migr => (
                  <MigracaoCardComponent
                    key={migr.id}
                    migr={migr}
                    onClick={() => setSelectedCard(migr)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalhes */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedCard.empresa}</h2>
                <Badge className="mt-2">{selectedCard.tipo}</Badge>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Status (Coluna H)</p>
                  <p className="text-lg font-semibold mt-1">{selectedCard.status || 'Não informado'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Data Início</p>
                    <p className="font-semibold">{selectedCard.dataInicio}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duração</p>
                    <p className="font-semibold">{selectedCard.duracao || '-'} dias</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Plataforma</p>
                    <p className="font-semibold">{selectedCard.plataforma || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Responsável</p>
                    <p className="font-semibold">{selectedCard.responsavel || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Levantamento de Dados (L)</p>
                  <p className="font-semibold">{selectedCard.levantamentoDados || 'Vazio'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Envio de Comandos (P)</p>
                  <p className="font-semibold">{selectedCard.envioDados || 'Vazio'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Situação Atual (T)</p>
                  <p className="font-semibold">{selectedCard.situacao || 'Não informado'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Progresso</p>
                  <p className="font-semibold text-lg mt-1">
                    {selectedCard.migrados} / {selectedCard.total} ({selectedCard.percentual.toFixed(1)}%)
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div
                      className="h-3 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(selectedCard.percentual, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setSelectedCard(null)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {Object.values(groupedByEtapa).every(cards => cards.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhuma migração encontrada com os filtros selecionados</p>
        </div>
      )}
    </div>
  );
}

interface MigracaoCardComponentProps {
  migr: MigracaoCard;
  onClick: () => void;
}

function MigracaoCardComponent({ migr, onClick }: MigracaoCardComponentProps) {
  const getTypeColor = (tipo: string) => {
    if (tipo.toLowerCase().includes('ongoing')) return 'bg-blue-50 border-blue-200';
    if (tipo.toLowerCase().includes('onboarding')) return 'bg-purple-50 border-purple-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getProgressColor = (percentual: number) => {
    if (percentual >= 90) return 'bg-green-500';
    if (percentual >= 70) return 'bg-yellow-500';
    if (percentual >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${getTypeColor(migr.tipo)} border`}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Empresa e Tipo */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm line-clamp-2">{migr.empresa}</h3>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {migr.tipo}
          </Badge>
        </div>

        {/* Data de Início */}
        {migr.dataInicio && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Início:</span> {migr.dataInicio}
          </div>
        )}

        {/* Duração */}
        {migr.duracao && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Duração:</span> {migr.duracao} dias
          </div>
        )}

        {/* Plataforma */}
        {migr.plataforma && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Plataforma:</span> {migr.plataforma}
          </div>
        )}

        {/* Progresso */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Progresso</span>
            <span className="font-bold">{migr.percentual.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(migr.percentual)}`}
              style={{ width: `${Math.min(migr.percentual, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 text-center">
            {migr.migrados} / {migr.total} placas
          </div>
        </div>

        {/* Responsável */}
        {migr.responsavel && (
          <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
            <span className="font-medium">Responsável:</span> {migr.responsavel}
          </div>
        )}
      </div>
    </Card>
  );
}
