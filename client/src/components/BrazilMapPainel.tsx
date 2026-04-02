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

// Coordenadas dos centros dos estados para posicionar números no mapa (em %)
const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
  'AC': { x: 15, y: 65 },
  'AL': { x: 82, y: 35 },
  'AP': { x: 25, y: 18 },
  'AM': { x: 18, y: 32 },
  'BA': { x: 78, y: 62 },
  'CE': { x: 72, y: 38 },
  'DF': { x: 58, y: 60 },
  'ES': { x: 80, y: 67 },
  'GO': { x: 55, y: 64 },
  'MA': { x: 68, y: 40 },
  'MT': { x: 48, y: 55 },
  'MS': { x: 52, y: 77 },
  'MG': { x: 73, y: 67 },
  'PA': { x: 35, y: 36 },
  'PB': { x: 82, y: 32 },
  'PR': { x: 73, y: 82 },
  'PE': { x: 78, y: 38 },
  'PI': { x: 68, y: 48 },
  'RJ': { x: 81, y: 73 },
  'RN': { x: 78, y: 28 },
  'RS': { x: 65, y: 90 },
  'RO': { x: 18, y: 57 },
  'RR': { x: 22, y: 19 },
  'SC': { x: 73, y: 92 },
  'SP': { x: 73, y: 81 },
  'SE': { x: 81, y: 48 },
  'TO': { x: 53, y: 50 },
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
        <div className="relative w-full max-w-2xl" style={{ aspectRatio: '16/10' }}>
          {/* Imagem do mapa do Brasil */}
          <img 
            src="https://private-us-east-1.manuscdn.com/sessionFile/qIN3XO1hRZMZhD9fFDUrap/sandbox/FSTgVDKw1fLp01jau3dbcD-img-1_1772152530000_na1fn_bWFwYS1icmFzaWwtY2xpZW50ZXM.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvcUlOM1hPMWhSWk1aaEQ5ZkZEVXJhcC9zYW5kYm94L0ZTVGdWREt3MWZMcDAxamF1M2RiY0QtaW1nLTFfMTc3MjE1MjUzMDAwMF9uYTFmbl9iV0Z3WVMxaWNtRnphV3d0WTJ4cFpXNTBaWE0ucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=GulO6xkO3I75YDFU1qWNxfsizzFKNM5u0cxy~m66pwrWpuYaQmmINsrd~YJ-2yP1hkA3O7W1pt3vAalFXF7DCqzNUFx1zbzP6WP4mtEDJ-BS-GwXSgPwqLDW3T86RyfNT7Xeefhh4NwO4cc034R6ai0aFmeeOlvC2PlEwHW4oOJKzUfLchcE0UZLRoqMPUg~qI39b~JD0kiisqlB8KfQu6QDaljgrfuNfNVkzW47-R~DXx2sDtfL1iJIK8T8r3PTCIcQXnS0ssOsxcXnj2k2yXaZI4-sBfOR8cm2Vn~ND9B5fqFzqpioEaK8pHVqKRz30QwDaZOzS5iZHcPpaXvP1w__"
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
