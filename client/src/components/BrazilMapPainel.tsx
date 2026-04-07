'use client';
import { useMemo, useState } from 'react';
import { X } from 'lucide-react';

interface ClienteEstado {
  nome: string;
  estado?: string;
  faturamento?: string;
  atendente?: string;
}

interface BrazilMapPainelProps {
  title: string;
  clients: ClienteEstado[];
}

// Coordenadas dos centros dos estados (em % relativo à imagem 390x377px)
const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
  'AC': { x: 7.7, y: 37.7 },
  'AL': { x: 85.9, y: 33.2 },
  'AM': { x: 21.0, y: 26.5 },
  'AP': { x: 43.1, y: 7.4 },
  'BA': { x: 72.3, y: 41.1 },
  'CE': { x: 72.3, y: 20.7 },
  'DF': { x: 57.7, y: 49.9 },
  'ES': { x: 79.0, y: 57.8 },
  'GO': { x: 54.4, y: 55.2 },
  'MA': { x: 59.5, y: 23.3 },
  'MG': { x: 67.2, y: 57.8 },
  'MS': { x: 37.9, y: 63.1 },
  'MT': { x: 40.5, y: 48.3 },
  'PA': { x: 43.1, y: 23.9 },
  'PB': { x: 84.1, y: 25.2 },
  'PE': { x: 82.6, y: 28.6 },
  'PI': { x: 64.1, y: 31.3 },
  'PR': { x: 48.2, y: 72.1 },
  'RJ': { x: 71.3, y: 65.8 },
  'RN': { x: 82.6, y: 19.1 },
  'RO': { x: 23.1, y: 41.9 },
  'RR': { x: 28.7, y: 9.3 },
  'RS': { x: 40.5, y: 87.0 },
  'SC': { x: 49.2, y: 79.0 },
  'SE': { x: 80.8, y: 37.1 },
  'SP': { x: 53.3, y: 66.3 },
  'TO': { x: 56.9, y: 39.3 },
};

export default function BrazilMapPainel({ title, clients }: BrazilMapPainelProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Contar clientes por estado
  const clientsByState = useMemo(() => {
    const counts: Record<string, ClienteEstado[]> = {};
    
    clients.forEach(client => {
      if (client.estado) {
        if (!counts[client.estado]) counts[client.estado] = [];
        counts[client.estado].push(client);
      }
    });
    
    return counts;
  }, [clients]);

  const totalClients = clients.length;
  const statesWithClients = Object.keys(clientsByState).length;

  // Ranking de estados
  const stateRanking = useMemo(() => {
    return Object.entries(clientsByState)
      .map(([state, clientes]) => ({ state, count: clientes.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [clientsByState]);

  const selectedStateClients = selectedState ? clientsByState[selectedState] || [] : [];

  const handleStateClick = (state: string) => {
    if (clientsByState[state]) {
      setSelectedState(state);
    }
  };



  return (
    <div className="w-full flex flex-col gap-4 bg-white rounded-lg p-6 border" style={{ borderColor: '#E0E8F0' }}>
      <h2 className="text-lg font-bold" style={{ color: '#001F3F' }}>{title}</h2>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 border text-center" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>{totalClients}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border text-center" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-xs text-gray-600 mb-1">Estados</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>{statesWithClients}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border text-center" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-xs text-gray-600 mb-1">Maior</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>
            {stateRanking[0]?.state || '—'}
          </p>
        </div>
      </div>

      {/* Mapa do Brasil com overlay interativo - Maior */}
      <div className="flex justify-center bg-white rounded-lg p-6 border" style={{ borderColor: '#E0E8F0' }}>
        <div className="relative w-full" style={{ maxWidth: '900px', aspectRatio: '390/377' }}>
          {/* Imagem do mapa do Brasil */}
          <img 
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663388902916/m4JthXh6fRtQzx9KxAa8P4/mapa-brasil-estados_b1dab211.png"
            alt="Mapa do Brasil"
            className="w-full h-full rounded"
            style={{ objectFit: 'fill' }}
          />
          
          {/* Overlay com números em círculos com gradiente de cores */}
          <div className="absolute inset-0 pointer-events-none">
            {Object.entries(STATE_POSITIONS).map(([state, pos]) => {
              const count = clientsByState[state]?.length || 0;
              if (count === 0) return null;
              
              // Calcular cor baseada na densidade
              const maxCount = Math.max(...Object.values(clientsByState).map(c => c.length));
              const intensity = Math.min(count / maxCount, 1);
              
              // Gradiente: azul claro (poucos) -> azul escuro (muitos)
              const colors = ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1565C0', '#0D47A1'];
              const colorIndex = Math.floor(intensity * (colors.length - 1));
              const bgColor = colors[colorIndex];
              const borderColor = colors[Math.min(colorIndex + 2, colors.length - 1)];
              
              // Tamanho do círculo baseado na quantidade
              const baseSize = 45;
              const circleSize = Math.max(baseSize, Math.min(baseSize + count * 2.5, 90));
              
              return (
                <div
                  key={state}
                  className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: `${circleSize}px`,
                    height: `${circleSize}px`,
                    backgroundColor: bgColor,
                    borderRadius: '50%',
                    border: `2px solid ${borderColor}`,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                  onClick={() => handleStateClick(state)}
                  title={`${state}: ${count} cliente(s)`}
                >
                  <span 
                    className="font-bold hover:font-black transition-all"
                    style={{
                      color: intensity > 0.5 ? '#FFFFFF' : '#0D47A1',
                      textShadow: intensity > 0.5 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                      fontSize: count > 99 ? '18px' : count > 9 ? '16px' : '14px',
                    }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>



      {/* Ranking de Estados - Clicável */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid #E0E8F0' }}>
              <th className="text-left py-2 px-2 font-semibold text-xs" style={{ color: '#001F3F' }}>Estado</th>
              <th className="text-right py-2 px-2 font-semibold text-xs" style={{ color: '#001F3F' }}>Qtd</th>
              <th className="text-right py-2 px-2 font-semibold text-xs" style={{ color: '#001F3F' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {stateRanking.map(({ state, count }) => {
              const percentage = ((count / totalClients) * 100).toFixed(0);
              return (
                <tr 
                  key={state} 
                  style={{ borderBottom: '1px solid #E0E8F0', cursor: 'pointer' }}
                  onClick={() => setSelectedState(state)}
                  className={selectedState === state ? 'bg-blue-50' : 'hover:bg-gray-50'}
                >
                  <td className="py-2 px-2 font-semibold">{state}</td>
                  <td className="py-2 px-2 text-right font-bold" style={{ color: '#0052CC' }}>{count}</td>
                  <td className="py-2 px-2 text-right text-gray-600">{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal com clientes do estado selecionado */}
      {selectedState && selectedStateClients.length > 0 && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50" onClick={() => setSelectedState(null)}>
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#001F3F' }}>
                Clientes em {selectedState}
              </h3>
              <button onClick={() => setSelectedState(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {selectedStateClients.map((client, i) => (
                <div key={i} className="p-3 border rounded-lg" style={{ borderColor: '#E0E8F0' }}>
                  <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>{client.nome}</p>
                  <p className="text-xs text-gray-600">Fat: {client.faturamento || '—'}</p>
                  <p className="text-xs text-gray-600">Atend: {client.atendente || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
