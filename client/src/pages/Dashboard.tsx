import { useEffect, useRef } from 'react';
import { useURsDashboard, DailyUR, ClientDelta, EquipmentCount } from '@/hooks/useURsDashboard';
import { Loader2, AlertCircle, TrendingDown, TrendingUp, Camera, Tag } from 'lucide-react';

/* ─── Gráfico de linha simples com SVG ─── */
function EvolutionChart({ data }: { data: DailyUR[] }) {
  if (data.length === 0) return null;

  const width = 1100;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 70 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const quantities = data.map(d => d.quantity);
  const minQ = Math.min(...quantities);
  const maxQ = Math.max(...quantities);
  const range = maxQ - minQ || 1;

  // Escala Y com margem
  const yMin = minQ - range * 0.05;
  const yMax = maxQ + range * 0.05;
  const yRange = yMax - yMin;

  const getX = (i: number) => padding.left + (i / (data.length - 1)) * chartW;
  const getY = (q: number) => padding.top + chartH - ((q - yMin) / yRange) * chartH;

  // Criar path da linha
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.quantity)}`)
    .join(' ');

  // Área preenchida
  const areaPath = `${linePath} L ${getX(data.length - 1)} ${padding.top + chartH} L ${getX(0)} ${padding.top + chartH} Z`;

  // Grid Y (5 linhas)
  const yTicks = Array.from({ length: 6 }, (_, i) => yMin + (yRange / 5) * i);

  // Labels X (mostrar a cada 3 dias)
  const xLabels = data.filter((_, i) => i % 3 === 0 || i === data.length - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[700px]">
        {/* Fundo */}
        <rect x={padding.left} y={padding.top} width={chartW} height={chartH} fill="#1a1a2e" rx="4" />

        {/* Grid horizontal */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left} y1={getY(tick)}
              x2={padding.left + chartW} y2={getY(tick)}
              stroke="#333" strokeWidth="0.5" strokeDasharray="3,3"
            />
            <text x={padding.left - 8} y={getY(tick) + 4} textAnchor="end" fill="#999" fontSize="10">
              {Math.round(tick).toLocaleString('pt-BR')}
            </text>
          </g>
        ))}

        {/* Área preenchida */}
        <path d={areaPath} fill="url(#areaGradient)" opacity="0.3" />

        {/* Linha principal */}
        <path d={linePath} fill="none" stroke="#ffffff" strokeWidth="2" />

        {/* Linha de tendência (média móvel simples) */}
        {data.length > 5 && (() => {
          const windowSize = 5;
          const maData = data.map((_, i) => {
            if (i < windowSize - 1) return null;
            const sum = data.slice(i - windowSize + 1, i + 1).reduce((s, d) => s + d.quantity, 0);
            return sum / windowSize;
          });
          const maPath = maData
            .map((v, i) => {
              if (v === null) return '';
              return `${maData.slice(0, i).every(x => x === null) ? 'M' : 'L'} ${getX(i)} ${getY(v)}`;
            })
            .filter(Boolean)
            .join(' ');
          return <path d={maPath} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />;
        })()}

        {/* Labels X */}
        {xLabels.map((d, idx) => {
          const originalIdx = data.indexOf(d);
          return (
            <text key={idx} x={getX(originalIdx)} y={height - 5} textAnchor="middle" fill="#999" fontSize="9">
              {d.date.slice(5)} {/* mm-dd */}
            </text>
          );
        })}

        {/* Gradiente */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ─── Tabela de Piores Clientes ─── */
function WorstClientsTable({ clients }: { clients: ClientDelta[] }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: '#E0E8F0' }}>
      <div className="px-4 py-2 border-b" style={{ backgroundColor: '#991B1B', borderColor: '#7F1D1D' }}>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingDown className="w-4 h-4" />
          Piores clientes no Mês
        </h3>
      </div>
      <div className="overflow-y-auto max-h-[400px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="text-left px-3 py-1.5 font-semibold text-gray-700">Central</th>
              <th className="text-right px-3 py-1.5 font-semibold text-gray-700">Delta</th>
              <th className="text-right px-3 py-1.5 font-semibold text-gray-700">Delta %</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-red-50/50">
                <td className="px-3 py-1 text-gray-800 font-medium">{c.clientName}</td>
                <td className="px-3 py-1 text-right text-red-600 font-bold">{c.delta}</td>
                <td className="px-3 py-1 text-right text-red-600">{c.deltaPercent.toFixed(2)}%</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-400">Nenhum dado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Tabela de Melhores Clientes ─── */
function BestClientsTable({ clients }: { clients: ClientDelta[] }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: '#E0E8F0' }}>
      <div className="px-4 py-2 border-b" style={{ backgroundColor: '#166534', borderColor: '#14532D' }}>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Melhores clientes no Mês
        </h3>
      </div>
      <div className="overflow-y-auto max-h-[400px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="text-left px-3 py-1.5 font-semibold text-gray-700">Central</th>
              <th className="text-right px-3 py-1.5 font-semibold text-gray-700">Delta</th>
              <th className="text-right px-3 py-1.5 font-semibold text-gray-700">Delta %</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c, i) => {
              // Intensidade do verde baseada no delta %
              const intensity = Math.min(Math.abs(c.deltaPercent) / 30, 1);
              const bgColor = `rgba(34, 197, 94, ${intensity * 0.15})`;
              return (
                <tr key={i} className="border-t border-gray-100" style={{ backgroundColor: bgColor }}>
                  <td className="px-3 py-1 text-gray-800 font-medium">{c.clientName}</td>
                  <td className="px-3 py-1 text-right text-green-700 font-bold">{c.delta}</td>
                  <td className="px-3 py-1 text-right text-green-700">{c.deltaPercent.toFixed(2)}%</td>
                </tr>
              );
            })}
            {clients.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-400">Nenhum dado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Tabela de Câmeras ─── */
function CamerasTable({ data }: { data: EquipmentCount[] }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: '#E0E8F0' }}>
      <div className="px-4 py-2 border-b" style={{ backgroundColor: '#1E40AF', borderColor: '#1E3A8A' }}>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Câmeras cadastradas no mês
        </h3>
      </div>
      <div className="overflow-y-auto max-h-[400px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="text-left px-3 py-1.5 font-semibold text-gray-700">Central</th>
              <th className="text-right px-3 py-1.5 font-semibold text-gray-700">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-blue-50/50">
                <td className="px-3 py-1 text-gray-800 font-medium">{c.clientName}</td>
                <td className="px-3 py-1 text-right text-blue-700 font-bold">{c.quantity}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={2} className="px-3 py-4 text-center text-gray-400">Nenhum dado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Tabela de Tags ─── */
function TagsTable({ data }: { data: EquipmentCount[] }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: '#E0E8F0' }}>
      <div className="px-4 py-2 border-b" style={{ backgroundColor: '#7C3AED', borderColor: '#6D28D9' }}>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tag's cadastradas no mês
        </h3>
      </div>
      <div className="overflow-y-auto max-h-[400px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="text-left px-3 py-1.5 font-semibold text-gray-700">Central</th>
              <th className="text-right px-3 py-1.5 font-semibold text-gray-700">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-purple-50/50">
                <td className="px-3 py-1 text-gray-800 font-medium">{c.clientName}</td>
                <td className="px-3 py-1 text-right text-purple-700 font-bold">{c.quantity}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={2} className="px-3 py-4 text-center text-gray-400">Nenhum dado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Página principal ─── */
export default function Dashboard() {
  const { data, loading, error, fetchData } = useURsDashboard();

  if (loading) {
    return (
      <div className="min-h-screen md:ml-20 flex flex-col items-center justify-center" style={{ backgroundColor: '#F0F4F8' }}>
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-base text-gray-500 mt-3">Carregando dados de evolução de UR's...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen md:ml-20 flex flex-col items-center justify-center" style={{ backgroundColor: '#F0F4F8' }}>
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-base text-gray-600 mt-3">Erro ao carregar dados: {error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen md:ml-20" style={{ backgroundColor: '#F0F4F8' }}>
      <header className="sticky top-0 z-40 border-b px-5 py-3 flex items-center justify-between"
        style={{ backgroundColor: '#001F3F', borderColor: '#1a3a5c' }}>
        <div>
          <h1 className="text-lg font-bold text-white">Evolução de UR's REAIS no SSX dos últimos 30 dias</h1>
        </div>
      </header>

      <main className="px-4 pt-4 pb-8 w-full space-y-4">
        {/* Gráfico de evolução */}
        <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
          <EvolutionChart data={data.evolution} />
        </div>

        {/* 4 tabelas em grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <WorstClientsTable clients={data.worstClients} />
          <BestClientsTable clients={data.bestClients} />
          <CamerasTable data={data.cameras} />
          <TagsTable data={data.tags} />
        </div>
      </main>
    </div>
  );
}
