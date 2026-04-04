import { useMemo } from 'react';
import { ClientData } from '@/hooks/useKanbanData';

interface BrazilMapVisualProps {
  clients: ClientData[];
}

export default function BrazilMapVisual({ clients }: BrazilMapVisualProps) {
  // Contar clientes por estado
  const clientsByState = useMemo(() => {
    const counts: Record<string, number> = {};
    
    clients.forEach(client => {
      if (client.estado) {
        counts[client.estado] = (counts[client.estado] || 0) + 1;
      }
    });
    
    return counts;
  }, [clients]);

  const totalClients = clients.length;
  const statesWithClients = Object.keys(clientsByState).length;
  const maxClients = Math.max(...Object.values(clientsByState), 1);

  // Ranking de estados
  const stateRanking = useMemo(() => {
    return Object.entries(clientsByState)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24);
  }, [clientsByState]);

  return (
    <div className="w-full flex flex-col gap-6 bg-white rounded-lg p-6 border" style={{ borderColor: '#E0E8F0' }}>
      <h2 className="text-xl font-bold" style={{ color: '#001F3F' }}>
        Distribuição de Clientes por Estado
      </h2>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-sm text-gray-600 mb-1">Total de Clientes</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>{totalClients}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-sm text-gray-600 mb-1">Estados com Clientes</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>{statesWithClients}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-sm text-gray-600 mb-1">Maior Concentração</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>
            {stateRanking[0]?.[0] || '—'}
          </p>
        </div>
      </div>

      {/* Mapa do Brasil */}
      <div className="flex justify-center">
        <img 
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663388902916/m4JthXh6fRtQzx9KxAa8P4/mapa-brasil-estados_b1dab211.png" 
          alt="Mapa do Brasil com distribuição de clientes"
          className="max-w-2xl h-auto rounded-lg"
        />
      </div>

      {/* Ranking de Estados */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#001F3F' }}>
          Ranking de Estados
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '2px solid #E0E8F0' }}>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: '#001F3F' }}>Posição</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: '#001F3F' }}>Estado</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: '#001F3F' }}>Quantidade</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: '#001F3F' }}>Percentual</th>
              </tr>
            </thead>
            <tbody>
              {stateRanking.map((entry, index) => {
                const [state, count] = entry;
                const percentage = ((count / totalClients) * 100).toFixed(1);
                return (
                  <tr key={state} style={{ borderBottom: '1px solid #E0E8F0' }}>
                    <td className="py-2 px-3">#{index + 1}</td>
                    <td className="py-2 px-3 font-semibold">{state}</td>
                    <td className="py-2 px-3 text-right">{count}</td>
                    <td className="py-2 px-3 text-right">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
