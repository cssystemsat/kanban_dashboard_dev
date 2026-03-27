import { useEffect, useState, useMemo } from 'react';
import { useMigracaoListData, MigracaoCard } from '@/hooks/useMigracaoListData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type FilterType = 'atendente' | 'plataforma' | 'tempo';

export function Migracao() {
  const { data, loading, error, fetchData } = useMigracaoListData();
  const [filters, setFilters] = useState({
    atendente: '',
    plataforma: '',
    tempo: '',
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extrair valores únicos para filtros
  const atendentes = useMemo(() => Array.from(new Set(data.map(m => m.responsavel).filter(Boolean))), [data]);
  const plataformas = useMemo(() => Array.from(new Set(data.map(m => m.plataforma).filter(Boolean))), [data]);

  // Aplicar filtros
  const filteredData = useMemo(() => {
    return data.filter(migr => {
      if (filters.atendente && migr.responsavel !== filters.atendente) return false;
      if (filters.plataforma && migr.plataforma !== filters.plataforma) return false;
      
      if (filters.tempo) {
        const duracao = migr.duracao || 0;
        if (filters.tempo === 'curto' && duracao > 30) return false;
        if (filters.tempo === 'medio' && (duracao <= 30 || duracao > 90)) return false;
        if (filters.tempo === 'longo' && duracao <= 90) return false;
      }
      
      return true;
    });
  }, [data, filters]);

  // Agrupar por status
  const groupedByStatus = useMemo(() => {
    const groups: Record<string, MigracaoCard[]> = {};
    
    filteredData.forEach(migr => {
      const status = migr.status || 'Sem status';
      if (!groups[status]) groups[status] = [];
      groups[status].push(migr);
    });
    
    return groups;
  }, [filteredData]);

  const handleFilterChange = (type: FilterType, value: string) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  if (loading) {
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
      <div>
        <h1 className="text-3xl font-bold">Migração</h1>
        <p className="text-gray-600 mt-1">Dashboard de migrações em progresso</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg border border-gray-200">
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
            onClick={() => setFilters({ atendente: '', plataforma: '', tempo: '' })}
            className="text-sm"
          >
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedByStatus).map(([status, cards]) => (
          <div key={status} className="flex flex-col gap-4">
            <div className="sticky top-0 bg-white p-3 rounded-lg border-2 border-gray-300">
              <h2 className="font-bold text-lg">{status}</h2>
              <p className="text-sm text-gray-600">{cards.length} migrações</p>
            </div>

            <div className="space-y-3">
              {cards.map(migr => (
                <MigracaoCardComponent key={migr.id} migr={migr} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(groupedByStatus).length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhuma migração encontrada com os filtros selecionados</p>
        </div>
      )}
    </div>
  );
}

interface MigracaoCardComponentProps {
  migr: MigracaoCard;
}

function MigracaoCardComponent({ migr }: MigracaoCardComponentProps) {
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
    <Card className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${getTypeColor(migr.tipo)} border`}>
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
