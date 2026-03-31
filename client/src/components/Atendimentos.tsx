import { useEffect, useState } from 'react';
import { useAtendimentosData } from '@/hooks/useAtendimentosData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

export function Atendimentos() {
  const { data, stats, loading, error, fetchData } = useAtendimentosData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  if (loading && !data.length) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">Erro ao carregar atendimentos: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Atendimentos</h2>
          <p className="text-gray-600 text-sm mt-1">Gestão e estatísticas de atendimentos</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas Principais */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Total de Atendimentos */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-xs text-gray-600 font-medium">Total de Atendimentos</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{stats.totalAtendimentos}</p>
          </Card>

          {/* Tempo Total */}
          <Card className="p-4 bg-purple-50 border-purple-200">
            <p className="text-xs text-gray-600 font-medium">Tempo Total</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {Math.floor(stats.tempoTotalMinutos / 60)}h {stats.tempoTotalMinutos % 60}m
            </p>
          </Card>

          {/* Tempo Médio */}
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-xs text-gray-600 font-medium">Tempo Médio</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{stats.tempoMedioMinutos} min</p>
          </Card>

          {/* Clientes Únicos */}
          <Card className="p-4 bg-orange-50 border-orange-200">
            <p className="text-xs text-gray-600 font-medium">Clientes Únicos</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {stats.clientesMaisAtendidos.length}
            </p>
          </Card>

          {/* Assuntos Únicos */}
          <Card className="p-4 bg-pink-50 border-pink-200">
            <p className="text-xs text-gray-600 font-medium">Assuntos Únicos</p>
            <p className="text-2xl font-bold text-pink-600 mt-2">
              {stats.assuntosMaisFalados.length}
            </p>
          </Card>
        </div>
      )}

      {/* Detalhes de Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Clientes Mais Atendidos */}
          <Card className="p-4">
            <h3 className="font-bold text-sm mb-3">Clientes Mais Atendidos</h3>
            <div className="space-y-2">
              {stats.clientesMaisAtendidos.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 line-clamp-1">{item.cliente}</span>
                  <span className="font-bold text-blue-600 flex-shrink-0 ml-2">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Assuntos Mais Falados */}
          <Card className="p-4">
            <h3 className="font-bold text-sm mb-3">Assuntos Mais Falados</h3>
            <div className="space-y-2">
              {stats.assuntosMaisFalados.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 line-clamp-1">{item.assunto}</span>
                  <span className="font-bold text-purple-600 flex-shrink-0 ml-2">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Origem Mais Comum */}
          <Card className="p-4">
            <h3 className="font-bold text-sm mb-3">Origem Mais Comum</h3>
            <div className="space-y-2">
              {stats.origemMaisComum.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 line-clamp-1">{item.origem}</span>
                  <span className="font-bold text-green-600 flex-shrink-0 ml-2">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Tipo Mais Comum */}
          <Card className="p-4">
            <h3 className="font-bold text-sm mb-3">Tipo Mais Comum</h3>
            <div className="space-y-2">
              {stats.tipoMaisComum.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 line-clamp-1">{item.tipo}</span>
                  <span className="font-bold text-orange-600 flex-shrink-0 ml-2">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Atendentes com Mais Atendimentos */}
          <Card className="p-4">
            <h3 className="font-bold text-sm mb-3">Atendentes (Mais Ativo)</h3>
            <div className="space-y-2">
              {stats.atendentesComMaisAtendimentos.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 line-clamp-1">{item.atendente}</span>
                  <span className="font-bold text-pink-600 flex-shrink-0 ml-2">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {data.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum atendimento encontrado</p>
        </div>
      )}
    </div>
  );
}
