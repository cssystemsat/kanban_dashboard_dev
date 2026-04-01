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

// Coordenadas dos centros dos estados para posicionar números no mapa
const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
  'AC': { x: 165, y: 365 },
  'AL': { x: 760, y: 210 },
  'AP': { x: 215, y: 115 },
  'AM': { x: 140, y: 200 },
  'BA': { x: 750, y: 375 },
  'CE': { x: 685, y: 240 },
  'DF': { x: 560, y: 360 },
  'ES': { x: 765, y: 400 },
  'GO': { x: 530, y: 385 },
  'MA': { x: 640, y: 240 },
  'MT': { x: 450, y: 330 },
  'MS': { x: 490, y: 460 },
  'MG': { x: 700, y: 400 },
  'PA': { x: 315, y: 215 },
  'PB': { x: 765, y: 195 },
  'PR': { x: 700, y: 490 },
  'PE': { x: 740, y: 230 },
  'PI': { x: 640, y: 290 },
  'RJ': { x: 775, y: 440 },
  'RN': { x: 750, y: 170 },
  'RS': { x: 615, y: 540 },
  'RO': { x: 140, y: 340 },
  'RR': { x: 185, y: 115 },
  'SC': { x: 700, y: 550 },
  'SP': { x: 700, y: 485 },
  'SE': { x: 775, y: 290 },
  'TO': { x: 500, y: 300 },
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

      {/* Mapa do Brasil com números interativos */}
      <div className="flex justify-center bg-gray-50 rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
        <div className="relative w-full max-w-2xl" style={{ aspectRatio: '960/600' }}>
          <svg 
            viewBox="0 0 960 600" 
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <style>{`
              .state-circle { fill: #f0f4f8; stroke: #ccc; stroke-width: 2; cursor: pointer; transition: fill 0.2s; }
              .state-circle:hover { fill: #e0e8f0; }
              .state-circle.active { fill: #dbeafe; stroke: #0052CC; stroke-width: 3; }
              .state-text { font-size: 14px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; pointer-events: none; fill: #001F3F; }
            `}</style>
            
            {/* Estados como círculos com números */}
            {Object.entries(STATE_POSITIONS).map(([state, pos]) => (
              <g key={state}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="25"
                  className={`state-circle ${selectedState === state ? 'active' : ''}`}
                  onClick={() => handleStateClick(state)}
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  className="state-text"
                  onClick={() => handleStateClick(state)}
                >
                  {clientsByState[state]?.length || 0}
                </text>
              </g>
            ))}
          </svg>
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
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto"
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
