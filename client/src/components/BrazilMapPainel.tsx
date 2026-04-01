import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';

interface ClienteEstado {
  nome: string;
  faturamento: string;
  atendente: string;
}

interface BrazilMapPainelProps {
  title: string;
  clients: Array<{ estado?: string; nome: string; faturamento?: string; atendente?: string }>;
}

// Coordenadas aproximadas dos estados do Brasil (para posicionamento de números no mapa)
const stateCoordinates: Record<string, { x: number; y: number }> = {
  'AC': { x: 10, y: 65 }, 'AL': { x: 75, y: 10 }, 'AP': { x: 50, y: 5 }, 'AM': { x: 30, y: 20 },
  'BA': { x: 70, y: 35 }, 'CE': { x: 65, y: 15 }, 'DF': { x: 55, y: 50 }, 'ES': { x: 75, y: 55 },
  'GO': { x: 50, y: 45 }, 'MA': { x: 60, y: 10 }, 'MT': { x: 40, y: 35 }, 'MS': { x: 45, y: 55 },
  'MG': { x: 65, y: 50 }, 'PA': { x: 45, y: 15 }, 'PB': { x: 75, y: 12 }, 'PR': { x: 60, y: 70 },
  'PE': { x: 75, y: 18 }, 'PI': { x: 60, y: 20 }, 'RJ': { x: 75, y: 60 }, 'RN': { x: 75, y: 10 },
  'RS': { x: 55, y: 85 }, 'RO': { x: 20, y: 50 }, 'RR': { x: 35, y: 5 }, 'SC': { x: 60, y: 78 },
  'SP': { x: 65, y: 65 }, 'SE': { x: 75, y: 25 }, 'TO': { x: 45, y: 30 },
};

export default function BrazilMapPainel({ title, clients }: BrazilMapPainelProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Contar clientes por estado
  const clientsByState = useMemo(() => {
    const counts: Record<string, ClienteEstado[]> = {};
    
    clients.forEach(client => {
      if (client.estado) {
        if (!counts[client.estado]) counts[client.estado] = [];
        counts[client.estado].push({
          nome: client.nome,
          faturamento: client.faturamento || '—',
          atendente: client.atendente || '—',
        });
      }
    });
    
    return counts;
  }, [clients]);

  const clientsInSelectedState = selectedState ? clientsByState[selectedState] || [] : [];

  // Função para obter cor baseada na quantidade de clientes
  const getStateColor = (count: number): string => {
    if (count === 0) return '#E0E8F0';
    if (count <= 2) return '#B3D9FF';
    if (count <= 5) return '#66B2FF';
    if (count <= 10) return '#1A7FFF';
    return '#0052CC';
  };

  const states = Object.keys(stateCoordinates);
  const totalClients = clients.length;

  return (
    <div className="w-full flex flex-col gap-4 bg-white rounded-lg p-6 border" style={{ borderColor: '#E0E8F0' }}>
      <h2 className="text-lg font-bold" style={{ color: '#001F3F' }}>{title}</h2>

      {/* SVG Mapa do Brasil */}
      <div className="flex justify-center">
        <svg viewBox="0 0 100 100" className="w-full max-w-2xl h-auto" style={{ border: '1px solid #E0E8F0', borderRadius: '8px', backgroundColor: '#F9FAFB' }}>
          {/* Fundo */}
          <rect width="100" height="100" fill="#F9FAFB" />

          {/* Grid de estados */}
          <g>
            {states.map(state => {
              const count = (clientsByState[state] || []).length;
              const color = getStateColor(count);
              const coords = stateCoordinates[state];

              return (
                <g key={state}>
                  {/* Quadrado do estado */}
                  <rect
                    x={coords.x - 3}
                    y={coords.y - 3}
                    width="6"
                    height="6"
                    fill={color}
                    stroke={count > 0 ? '#0052CC' : '#E0E8F0'}
                    strokeWidth="0.2"
                    style={{ cursor: count > 0 ? 'pointer' : 'default' }}
                    onClick={() => count > 0 && setSelectedState(state)}
                  />

                  {/* Sigla do estado */}
                  <text
                    x={coords.x}
                    y={coords.y - 4}
                    textAnchor="middle"
                    fontSize="1.5"
                    fontWeight="bold"
                    fill={count > 0 ? '#0052CC' : '#9CA3AF'}
                    style={{ cursor: count > 0 ? 'pointer' : 'default', pointerEvents: 'none' }}
                  >
                    {state}
                  </text>

                  {/* Número de clientes */}
                  {count > 0 && (
                    <text
                      x={coords.x}
                      y={coords.y + 2}
                      textAnchor="middle"
                      fontSize="1.2"
                      fontWeight="bold"
                      fill="#FFFFFF"
                      style={{ cursor: 'pointer', pointerEvents: 'none' }}
                    >
                      {count}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Modal com fundo transparente */}
      {selectedState && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setSelectedState(null)}>
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#001F3F' }}>
                Clientes em {selectedState}
              </h3>
              <button
                onClick={() => setSelectedState(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {clientsInSelectedState.length > 0 ? (
                clientsInSelectedState.map((cliente, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border" style={{ borderColor: '#E0E8F0' }}>
                    <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>{cliente.nome}</p>
                    <p className="text-xs text-gray-600 mt-1">Fat: {cliente.faturamento}</p>
                    <p className="text-xs text-gray-600">Atendente: {cliente.atendente}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhum cliente neste estado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-gray-600">Total</p>
          <p className="text-xl font-bold" style={{ color: '#001F3F' }}>{totalClients}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-gray-600">Estados</p>
          <p className="text-xl font-bold" style={{ color: '#001F3F' }}>{Object.keys(clientsByState).length}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-gray-600">Maior</p>
          <p className="text-xl font-bold" style={{ color: '#001F3F' }}>
            {Object.entries(clientsByState).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
