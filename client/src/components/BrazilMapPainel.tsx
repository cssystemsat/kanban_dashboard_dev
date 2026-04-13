'use client';
import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
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
  'AC': { x: 10, y: 40 },
  'AL': { x: 82, y: 37 },
  'AM': { x: 22, y: 28 },
  'AP': { x: 45, y: 10 },
  'BA': { x: 72, y: 44 },
  'CE': { x: 70, y: 20 },
  'DF': { x: 58, y: 51 },
  'ES': { x: 78, y: 62 },
  'GO': { x: 55, y: 56 },
  'MA': { x: 58, y: 24 },
  'MG': { x: 68, y: 60 },
  'MS': { x: 39, y: 64 },
  'MT': { x: 42, y: 50 },
  'PA': { x: 45, y: 26 },
  'PB': { x: 82, y: 28 },
  'PE': { x: 82, y: 33 },
  'PI': { x: 66, y: 33 },
  'PR': { x: 50, y: 73 },
  'RJ': { x: 72, y: 67 },
  'RN': { x: 82, y: 22 },
  'RO': { x: 25, y: 44 },
  'RR': { x: 30, y: 11 },
  'RS': { x: 42, y: 88 },
  'SC': { x: 48, y: 82 },
  'SE': { x: 82, y: 40 },
  'SP': { x: 55, y: 68 },
  'TO': { x: 58, y: 41 },
};

// Estados pequenos que precisam de setas
const SMALL_STATES = ['RN', 'PB', 'PE', 'AL', 'SE'];

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

  // Ranking de estados - TODOS os estados (sem limitação de 10)
  const stateRanking = useMemo(() => {
    return Object.entries(clientsByState)
      .map(([state, clientes]) => ({ state, count: clientes.length }))
      .sort((a, b) => b.count - a.count);
  }, [clientsByState]);

  // Função para exportar tabela como CSV
  const exportToCSV = () => {
    const headers = ['Estado', 'Quantidade', 'Percentual'];
    const rows = stateRanking.map(({ state, count }) => {
      const percentage = ((count / totalClients) * 100).toFixed(1);
      return [state, count.toString(), `${percentage}%`];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estados_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          
          {/* Overlay com números em círculos com gradiente de cores + setas para estados pequenos */}
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
              
              const isSmallState = SMALL_STATES.includes(state);
              
              return (
                <div key={state}>
                  {/* Seta vermelha para estados pequenos */}
                  {isSmallState && (
                    <svg
                      className="absolute pointer-events-none"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        width: '80px',
                        height: '40px',
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <line x1="0" y1="20" x2="50" y2="20" stroke="#EF4444" strokeWidth="2.5" />
                      <polygon points="50,20 40,14 40,26" fill="#EF4444" />
                    </svg>
                  )}
                  
                  {/* Círculo com número */}
                  <div
                    className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      left: isSmallState ? `${pos.x + 15}%` : `${pos.x}%`,
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
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranking de Estados - Clicável */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-semibold" style={{ color: '#001F3F' }}>Todos os Estados ({stateRanking.length})</p>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: '#E0E8F0', color: '#001F3F' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D0D8E0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E0E8F0')}
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid #E0E8F0' }}>
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
