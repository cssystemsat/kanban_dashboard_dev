import React, { useMemo } from 'react';
import { ClientData } from '@/hooks/useKanbanData';

interface BrazilMapProps {
  clients: ClientData[];
}

// Coordenadas aproximadas dos estados do Brasil (para posicionamento)
const stateCoordinates: Record<string, { x: number; y: number }> = {
  'AC': { x: 1, y: 65 }, // Acre
  'AL': { x: 75, y: 10 }, // Alagoas
  'AP': { x: 50, y: 5 }, // Amapá
  'AM': { x: 25, y: 20 }, // Amazonas
  'BA': { x: 70, y: 35 }, // Bahia
  'CE': { x: 65, y: 15 }, // Ceará
  'DF': { x: 55, y: 50 }, // Distrito Federal
  'ES': { x: 75, y: 55 }, // Espírito Santo
  'GO': { x: 50, y: 45 }, // Goiás
  'MA': { x: 60, y: 10 }, // Maranhão
  'MT': { x: 40, y: 35 }, // Mato Grosso
  'MS': { x: 45, y: 55 }, // Mato Grosso do Sul
  'MG': { x: 65, y: 50 }, // Minas Gerais
  'PA': { x: 45, y: 15 }, // Pará
  'PB': { x: 75, y: 12 }, // Paraíba
  'PR': { x: 60, y: 70 }, // Paraná
  'PE': { x: 75, y: 18 }, // Pernambuco
  'PI': { x: 60, y: 20 }, // Piauí
  'RJ': { x: 75, y: 60 }, // Rio de Janeiro
  'RN': { x: 75, y: 10 }, // Rio Grande do Norte
  'RS': { x: 55, y: 85 }, // Rio Grande do Sul
  'RO': { x: 20, y: 50 }, // Rondônia
  'RR': { x: 35, y: 5 }, // Roraima
  'SC': { x: 60, y: 78 }, // Santa Catarina
  'SP': { x: 65, y: 65 }, // São Paulo
  'SE': { x: 75, y: 25 }, // Sergipe
  'TO': { x: 45, y: 30 }, // Tocantins
};

export default function BrazilMap({ clients }: BrazilMapProps) {
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

  // Encontrar o máximo para escala de cores
  const maxClients = useMemo(() => {
    return Math.max(...Object.values(clientsByState), 1);
  }, [clientsByState]);

  // Função para obter cor baseada na quantidade de clientes
  const getStateColor = (count: number): string => {
    if (count === 0) return '#E0E8F0';
    const intensity = count / maxClients;
    
    // Gradiente de azul
    if (intensity < 0.25) return '#B3D9FF';
    if (intensity < 0.5) return '#66B2FF';
    if (intensity < 0.75) return '#1A7FFF';
    return '#0052CC';
  };

  const states = Object.keys(stateCoordinates);
  const totalClients = clients.length;
  const statesWithClients = Object.keys(clientsByState).length;

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-sm text-gray-600 mb-1">Total de Clientes</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>{totalClients}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-sm text-gray-600 mb-1">Estados com Clientes</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>{statesWithClients}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-sm text-gray-600 mb-1">Maior Concentração</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>
            {Object.entries(clientsByState).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'}
          </p>
        </div>
      </div>

      {/* Mapa */}
      <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#E0E8F0' }}>
        <h3 className="font-bold mb-4" style={{ color: '#001F3F' }}>Distribuição de Clientes por Estado</h3>
        
        <div className="grid grid-cols-4 gap-3">
          {states.map(state => {
            const count = clientsByState[state] || 0;
            const color = getStateColor(count);
            
            return (
              <div
                key={state}
                className="p-3 rounded-lg border-2 text-center cursor-pointer transition-all hover:shadow-md"
                style={{
                  backgroundColor: color,
                  borderColor: count > 0 ? '#0052CC' : '#E0E8F0',
                  opacity: count > 0 ? 1 : 0.6,
                }}
                title={`${state}: ${count} cliente${count !== 1 ? 's' : ''}`}
              >
                <p className="font-bold text-sm" style={{ color: count > 0 ? '#FFFFFF' : '#666' }}>
                  {state}
                </p>
                <p className="text-xs font-semibold" style={{ color: count > 0 ? '#FFFFFF' : '#999' }}>
                  {count}
                </p>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-xs text-gray-600 mb-2">Legenda:</p>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E0E8F0' }}></div>
              <span className="text-xs text-gray-600">Sem clientes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#B3D9FF' }}></div>
              <span className="text-xs text-gray-600">Baixa concentração</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#66B2FF' }}></div>
              <span className="text-xs text-gray-600">Média concentração</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1A7FFF' }}></div>
              <span className="text-xs text-gray-600">Alta concentração</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0052CC' }}></div>
              <span className="text-xs text-gray-600">Muito alta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Detalhes */}
      <div className="bg-white rounded-lg border" style={{ borderColor: '#E0E8F0' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E0E8F0' }}>
          <h3 className="font-bold" style={{ color: '#001F3F' }}>Detalhes por Estado</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#F5F7FA', borderBottom: '2px solid #E0E8F0' }}>
              <tr>
                <th className="px-4 py-3 text-left font-bold" style={{ color: '#001F3F' }}>Estado</th>
                <th className="px-4 py-3 text-left font-bold" style={{ color: '#001F3F' }}>Quantidade</th>
                <th className="px-4 py-3 text-left font-bold" style={{ color: '#001F3F' }}>Percentual</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(clientsByState)
                .sort((a, b) => b[1] - a[1])
                .map(([state, count], idx) => (
                  <tr key={state} style={{ borderBottom: '1px solid #E0E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#001F3F' }}>{state}</td>
                    <td className="px-4 py-3 text-gray-600">{count}</td>
                    <td className="px-4 py-3 text-gray-600">{((count / totalClients) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
