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

// Coordenadas dos centros dos estados (em % relativo à imagem)
// Imagem: 390x377px, aspect ratio ~1:1
const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
  'AC': { x: 8.2, y: 38.5 },
  'AL': { x: 85.1, y: 34.0 },
  'AM': { x: 21.8, y: 27.9 },
  'AP': { x: 42.3, y: 8.0 },
  'BA': { x: 71.8, y: 42.4 },
  'CE': { x: 71.8, y: 21.8 },
  'DF': { x: 56.9, y: 50.9 },
  'ES': { x: 78.2, y: 58.4 },
  'GO': { x: 53.8, y: 55.7 },
  'MA': { x: 59.0, y: 25.2 },
  'MG': { x: 66.7, y: 58.4 },
  'MS': { x: 37.2, y: 63.7 },
  'MT': { x: 39.7, y: 49.1 },
  'PA': { x: 42.3, y: 25.2 },
  'PB': { x: 83.3, y: 26.5 },
  'PE': { x: 82.1, y: 29.7 },
  'PI': { x: 63.6, y: 32.4 },
  'PR': { x: 47.4, y: 72.9 },
  'RJ': { x: 70.5, y: 66.3 },
  'RN': { x: 82.1, y: 19.9 },
  'RO': { x: 22.6, y: 42.4 },
  'RR': { x: 29.5, y: 10.1 },
  'RS': { x: 39.7, y: 87.5 },
  'SC': { x: 48.7, y: 79.6 },
  'SE': { x: 80.0, y: 37.7 },
  'SP': { x: 52.6, y: 66.8 },
  'TO': { x: 56.4, y: 40.3 },
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

      {/* Mapa do Brasil com overlay interativo */}
      <div className="flex justify-center bg-gray-50 rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
        <div className="relative w-full max-w-2xl" style={{ aspectRatio: '390/377' }}>
          {/* Imagem do mapa do Brasil */}
          <img 
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663388902916/m4JthXh6fRtQzx9KxAa8P4/mapa-brasil-estados_b1dab211.png"
            alt="Mapa do Brasil"
            className="w-full h-full object-contain rounded"
          />
          
          {/* Overlay com números clicáveis */}
          <div className="absolute inset-0 pointer-events-none">
            {Object.entries(STATE_POSITIONS).map(([state, pos]) => {
              const count = clientsByState[state]?.length || 0;
              if (count === 0) return null;
              return (
                <div
                  key={state}
                  className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  }}
                  onClick={() => handleStateClick(state)}
                  title={`${state}: ${count} cliente(s)`}
                >
                  <span 
                    className="font-bold text-sm hover:font-black transition-all"
                    style={{
                      color: '#0052CC',
                      textShadow: '0 0 3px rgba(255,255,255,0.8)',
                      fontSize: count > 9 ? '14px' : '12px',
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
