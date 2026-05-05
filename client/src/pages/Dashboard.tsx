import { useEffect, useRef, useState, useMemo } from 'react';
import { useURsDashboard, DailyUR, ClientDelta, EquipmentCount } from '@/hooks/useURsDashboard';
import { Loader2, AlertCircle, TrendingDown, TrendingUp, Camera as CameraIcon, Tag, MessageSquarePlus, ArrowUpDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import html2canvas from 'html2canvas';

/* ─── Gráfico de linha simples com SVG ─── */
function EvolutionChart({ data }: { data: DailyUR[] }) {
  if (data.length === 0) return null;

  const width = 1100;
  const height = 200;
  const padding = { top: 15, right: 20, bottom: 35, left: 70 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const quantities = data.map(d => d.quantity);
  const minQ = Math.min(...quantities);
  const maxQ = Math.max(...quantities);
  const range = maxQ - minQ || 1;

  const yMin = minQ - range * 0.05;
  const yMax = maxQ + range * 0.05;
  const yRange = yMax - yMin;

  const getX = (i: number) => padding.left + (i / (data.length - 1)) * chartW;
  const getY = (q: number) => padding.top + chartH - ((q - yMin) / yRange) * chartH;

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.quantity)}`)
    .join(' ');

  const areaPath = `${linePath} L ${getX(data.length - 1)} ${padding.top + chartH} L ${getX(0)} ${padding.top + chartH} Z`;

  const yTicks = Array.from({ length: 6 }, (_, i) => yMin + (yRange / 5) * i);
  const xLabels = data.filter((_, i) => i % 3 === 0 || i === data.length - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[700px]">
        <rect x={padding.left} y={padding.top} width={chartW} height={chartH} fill="#1a1a2e" rx="4" />
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={padding.left} y1={getY(tick)} x2={padding.left + chartW} y2={getY(tick)} stroke="#333" strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={padding.left - 8} y={getY(tick) + 4} textAnchor="end" fill="#999" fontSize="10">
              {Math.round(tick).toLocaleString('pt-BR')}
            </text>
          </g>
        ))}
        <path d={areaPath} fill="url(#areaGradient)" opacity="0.3" />
        <path d={linePath} fill="none" stroke="#ffffff" strokeWidth="2" />
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
        {xLabels.map((d, idx) => {
          const originalIdx = data.indexOf(d);
          return (
            <text key={idx} x={getX(originalIdx)} y={height - 5} textAnchor="middle" fill="#999" fontSize="9">
              {d.date.slice(5)}
            </text>
          );
        })}
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

/* ─── Modal de Comentário ─── */
function CommentModal({ 
  clientName, 
  currentComment, 
  onSave, 
  onDelete,
  onClose 
}: { 
  clientName: string; 
  currentComment: string;
  onSave: (comment: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(currentComment);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-gray-800 mb-1">Comentário</h3>
        <p className="text-xs text-gray-500 mb-3">{clientName}</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          rows={4}
          placeholder="Digite um comentário sobre este cliente..."
          autoFocus
        />
        <div className="flex justify-between mt-3">
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            disabled={!currentComment}
          >
            Remover
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(text)}
              disabled={!text.trim()}
              className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tooltip de Comentário ─── */
function CommentTooltip({ comment, clientName }: { comment: string; clientName: string }) {
  return (
    <div className="absolute z-50 left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl max-w-[250px] whitespace-pre-wrap">
      <p className="font-semibold mb-1 text-blue-300">{clientName}</p>
      <p>{comment}</p>
    </div>
  );
}

type SortMode = 'qty' | 'percent';

/* ─── Tabela de Piores Clientes ─── */
function WorstClientsTable({ 
  clients, 
  comments, 
  onAddComment 
}: { 
  clients: ClientDelta[]; 
  comments: Record<string, string>;
  onAddComment: (clientName: string) => void;
}) {
  const [sortMode, setSortMode] = useState<SortMode>('qty');
  const [hoveredClient, setHoveredClient] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...clients].sort((a, b) => {
      if (sortMode === 'qty') return a.delta - b.delta; // mais negativo primeiro
      return a.deltaPercent - b.deltaPercent; // mais negativo % primeiro
    });
  }, [clients, sortMode]);

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: '#E0E8F0' }}>
      <div className="px-4 py-2 border-b flex items-center justify-between" style={{ backgroundColor: '#991B1B', borderColor: '#7F1D1D' }}>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingDown className="w-4 h-4" />
          Piores clientes no Mês
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setSortMode('qty')}
            className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
              sortMode === 'qty' ? 'bg-white text-red-800' : 'bg-red-800/50 text-white hover:bg-red-800/70'
            }`}
          >
            Qtd
          </button>
          <button
            onClick={() => setSortMode('percent')}
            className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
              sortMode === 'percent' ? 'bg-white text-red-800' : 'bg-red-800/50 text-white hover:bg-red-800/70'
            }`}
          >
            %
          </button>
        </div>
      </div>
      <div className="overflow-y-auto max-h-[400px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="text-left px-3 py-1.5 font-semibold text-gray-700">Central</th>
              <th className="w-6"></th>
              <th className="text-right px-3 py-1.5 font-semibold text-gray-700">Delta</th>
              <th className="text-right px-3 py-1.5 font-semibold text-gray-700">Delta %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => {
              const hasComment = !!comments[c.clientName];
              return (
                <tr key={i} className="border-t border-gray-100 hover:bg-red-50/50 relative"
                  onMouseEnter={() => hasComment && setHoveredClient(c.clientName)}
                  onMouseLeave={() => setHoveredClient(null)}
                >
                  <td className="px-3 py-1 relative">
                    <span className={`text-gray-800 font-medium ${hasComment ? 'underline decoration-dotted cursor-pointer' : ''}`}>
                      {c.clientName}
                    </span>
                    {hoveredClient === c.clientName && hasComment && (
                      <CommentTooltip comment={comments[c.clientName]} clientName={c.clientName} />
                    )}
                  </td>
                  <td className="py-1">
                    <button
                      onClick={() => onAddComment(c.clientName)}
                      className="p-0.5 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-blue-600"
                      title="Adicionar comentário"
                    >
                      <MessageSquarePlus className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="px-3 py-1 text-right text-red-600 font-bold">{c.delta}</td>
                  <td className="px-3 py-1 text-right text-red-600">{c.deltaPercent.toFixed(2)}%</td>
                </tr>
              );
            })}
            {clients.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-400">Nenhum dado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Tabela de Melhores Clientes ─── */
function BestClientsTable({ 
  clients, 
  comments, 
  onAddComment 
}: { 
  clients: ClientDelta[]; 
  comments: Record<string, string>;
  onAddComment: (clientName: string) => void;
}) {
  const [sortMode, setSortMode] = useState<SortMode>('qty');
  const [hoveredClient, setHoveredClient] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...clients].sort((a, b) => {
      if (sortMode === 'qty') return b.delta - a.delta; // maior primeiro
      return b.deltaPercent - a.deltaPercent; // maior % primeiro
    });
  }, [clients, sortMode]);

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: '#E0E8F0' }}>
      <div className="px-4 py-2 border-b flex items-center justify-between" style={{ backgroundColor: '#166534', borderColor: '#14532D' }}>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Melhores clientes no Mês
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setSortMode('qty')}
            className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
              sortMode === 'qty' ? 'bg-white text-green-800' : 'bg-green-800/50 text-white hover:bg-green-800/70'
            }`}
          >
            Qtd
          </button>
          <button
            onClick={() => setSortMode('percent')}
            className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
              sortMode === 'percent' ? 'bg-white text-green-800' : 'bg-green-800/50 text-white hover:bg-green-800/70'
            }`}
          >
            %
          </button>
        </div>
      </div>
      <div className="overflow-y-auto max-h-[400px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="text-left px-3 py-1.5 font-semibold text-gray-700">Central</th>
              <th className="w-6"></th>
              <th className="text-right px-3 py-1.5 font-semibold text-gray-700">Delta</th>
              <th className="text-right px-3 py-1.5 font-semibold text-gray-700">Delta %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => {
              const hasComment = !!comments[c.clientName];
              return (
                <tr key={i} className="border-t border-gray-100 hover:bg-green-50/50 relative"
                  onMouseEnter={() => hasComment && setHoveredClient(c.clientName)}
                  onMouseLeave={() => setHoveredClient(null)}
                >
                  <td className="px-3 py-1 relative">
                    <span className={`text-gray-800 font-medium ${hasComment ? 'underline decoration-dotted cursor-pointer' : ''}`}>
                      {c.clientName}
                    </span>
                    {hoveredClient === c.clientName && hasComment && (
                      <CommentTooltip comment={comments[c.clientName]} clientName={c.clientName} />
                    )}
                  </td>
                  <td className="py-1">
                    <button
                      onClick={() => onAddComment(c.clientName)}
                      className="p-0.5 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-blue-600"
                      title="Adicionar comentário"
                    >
                      <MessageSquarePlus className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="px-3 py-1 text-right text-green-700 font-bold">{c.delta}</td>
                  <td className="px-3 py-1 text-right text-green-700">{c.deltaPercent.toFixed(2)}%</td>
                </tr>
              );
            })}
            {clients.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-400">Nenhum dado</td></tr>
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
          <CameraIcon className="w-4 h-4" />
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
  const [commentModal, setCommentModal] = useState<{ clientName: string; comment: string } | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScreenshot = async () => {
    if (!contentRef.current) return;
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#F0F4F8',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Screenshot copiado para a área de transferência!');
          } catch {
            // Fallback: download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `controle-urs-${new Date().toISOString().slice(0, 10)}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error('Erro ao capturar screenshot:', err);
    }
  };

  // Mês atual no formato YYYY-MM
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Buscar comentários do mês
  const commentsQuery = trpc.clientComments.list.useQuery({ monthYear: currentMonth });
  const upsertMutation = trpc.clientComments.upsert.useMutation({
    onSuccess: () => commentsQuery.refetch(),
  });
  const deleteMutation = trpc.clientComments.delete.useMutation({
    onSuccess: () => commentsQuery.refetch(),
  });

  // Converter lista de comentários em mapa
  useEffect(() => {
    if (commentsQuery.data) {
      const map: Record<string, string> = {};
      for (const c of commentsQuery.data) {
        map[c.clientName] = c.comment;
      }
      setComments(map);
    }
  }, [commentsQuery.data]);

  const handleAddComment = (clientName: string) => {
    setCommentModal({ clientName, comment: comments[clientName] || '' });
  };

  const handleSaveComment = (comment: string) => {
    if (!commentModal) return;
    upsertMutation.mutate({
      clientName: commentModal.clientName,
      comment,
      monthYear: currentMonth,
    });
    setComments(prev => ({ ...prev, [commentModal.clientName]: comment }));
    setCommentModal(null);
  };

  const handleDeleteComment = () => {
    if (!commentModal) return;
    deleteMutation.mutate({
      clientName: commentModal.clientName,
      monthYear: currentMonth,
    });
    setComments(prev => {
      const next = { ...prev };
      delete next[commentModal.clientName];
      return next;
    });
    setCommentModal(null);
  };

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
          <h1 className="text-lg font-bold text-white">
            Controle de UR's, Câmeras e Tags no mês de {new Date().toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
          </h1>
        </div>
        <button
          onClick={handleScreenshot}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors border border-white/20"
          title="Capturar tela e copiar"
        >
          <CameraIcon className="w-3.5 h-3.5" />
          Print
        </button>
      </header>

      <main ref={contentRef} className="px-4 pt-4 pb-8 w-full space-y-4">
        {/* Gráfico de evolução */}
        <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
          <EvolutionChart data={data.evolution} />
        </div>

        {/* 4 tabelas em grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <WorstClientsTable clients={data.worstClients} comments={comments} onAddComment={handleAddComment} />
          <BestClientsTable clients={data.bestClients} comments={comments} onAddComment={handleAddComment} />
          <CamerasTable data={data.cameras} />
          <TagsTable data={data.tags} />
        </div>
      </main>

      {/* Modal de comentário */}
      {commentModal && (
        <CommentModal
          clientName={commentModal.clientName}
          currentComment={commentModal.comment}
          onSave={handleSaveComment}
          onDelete={handleDeleteComment}
          onClose={() => setCommentModal(null)}
        />
      )}
    </div>
  );
}
