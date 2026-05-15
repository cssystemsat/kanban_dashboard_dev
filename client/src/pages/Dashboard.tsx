'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useURsDashboard, DailyUR, ClientDelta, EquipmentCount } from '@/hooks/useURsDashboard';
import { Loader2, AlertCircle, TrendingDown, TrendingUp, Camera as CameraIcon, Tag, MessageSquarePlus, ArrowUpDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { domToPng } from 'modern-screenshot';

/* ─── Gráfico de linha simples com SVG ─── */
function EvolutionChart({ data }: { data: DailyUR[] }) {
  if (data.length === 0) return null;

  const width = 1400;
  const height = 200;
  const padding = { top: 10, right: 15, bottom: 30, left: 60 };

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
    <div className="w-full overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[700px]">
        <rect x={padding.left} y={padding.top} width={chartW} height={chartH} fill="#0f0f1e" rx="4" stroke="#444" strokeWidth="1" />
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

/* ─── Tipos de Comentário ─── */
interface CommentEntry {
  text: string;
  user: string;
  date: string;
}

interface CommentData {
  current: CommentEntry | null;
  history: CommentEntry[];
}

/* ─── Modal de Comentário ─── */
function CommentModal({ 
  clientName, 
  commentData, 
  currentUser,
  onSave, 
  onDelete,
  onClose 
}: { 
  clientName: string; 
  commentData: CommentData | null;
  currentUser: string;
  onSave: (comment: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(commentData?.current?.text || '');
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-gray-800 mb-1">Comentário</h3>
        <p className="text-xs text-gray-500 mb-3">{clientName}</p>
        
        {/* Informações do comentário atual */}
        {commentData?.current && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs">
            <p className="text-gray-600"><strong>Usuário:</strong> {commentData.current.user}</p>
            <p className="text-gray-600"><strong>Data:</strong> {new Date(commentData.current.date).toLocaleString('pt-BR')}</p>
          </div>
        )}
        
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          rows={4}
          placeholder="Digite um comentário sobre este cliente..."
          autoFocus
        />
        
        {/* Botão para mostrar histórico */}
        {commentData && commentData.history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            {showHistory ? 'Ocultar' : 'Mostrar'} histórico ({commentData.history.length})
          </button>
        )}
        
        {/* Histórico de alterações */}
        {showHistory && commentData && commentData.history.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-[200px] overflow-y-auto">
            <p className="text-xs font-semibold text-gray-700 mb-2">Histórico de Alterações:</p>
            {commentData.history.map((entry, idx) => (
              <div key={idx} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0">
                <p className="text-xs text-gray-600"><strong>{entry.user}</strong> - {new Date(entry.date).toLocaleString('pt-BR')}</p>
                <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between mt-3">
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            disabled={!commentData?.current}
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

type SortMode = 'qty' | 'percent';

/* ─── Tabela de Piores Clientes ─── */
function WorstClientsTable({ 
  clients, 
  comments, 
  onAddComment 
}: { 
  clients: ClientDelta[]; 
  comments: Record<string, CommentData>;
  onAddComment: (clientName: string) => void;
}) {
  const [sortMode, setSortMode] = useState<SortMode>('qty');

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
      <div className="overflow-y-auto max-h-[350px]">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="text-left px-2 py-1 font-semibold text-gray-700 text-[10px]">Central</th>
              <th className="w-5"></th>
              <th className="text-right px-2 py-1 font-semibold text-gray-700 text-[10px]">Delta</th>
              <th className="text-right px-2 py-1 font-semibold text-gray-700 text-[10px]">Delta %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => {
              const hasComment = !!comments[c.clientName]?.current;
              return (
                <tr key={i} className="border-t border-gray-100 hover:bg-red-50/50 relative">
                  <td className="px-2 py-0.5 relative">
                    <span 
                      className={`text-gray-800 font-medium text-[11px] ${hasComment ? 'underline decoration-dotted cursor-pointer' : ''}`}
                      onClick={() => hasComment && onAddComment(c.clientName)}
                    >
                      {c.clientName}
                    </span>
                  </td>
                  <td className="py-0.5">
                    <button
                      onClick={() => onAddComment(c.clientName)}
                      className="p-0.5 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-blue-600"
                      title="Adicionar comentário"
                    >
                      <MessageSquarePlus className="w-2.5 h-2.5" />
                    </button>
                  </td>
                  <td className="px-2 py-0.5 text-right text-red-600 font-bold text-[11px]">{c.delta}</td>
                  <td className="px-2 py-0.5 text-right text-red-600 text-[11px]">{c.deltaPercent.toFixed(2)}%</td>
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
  comments: Record<string, CommentData>;
  onAddComment: (clientName: string) => void;
}) {
  const [sortMode, setSortMode] = useState<SortMode>('qty');

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
      <div className="overflow-y-auto max-h-[350px]">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="text-left px-2 py-1 font-semibold text-gray-700 text-[10px]">Central</th>
              <th className="w-5"></th>
              <th className="text-right px-2 py-1 font-semibold text-gray-700 text-[10px]">Delta</th>
              <th className="text-right px-2 py-1 font-semibold text-gray-700 text-[10px]">Delta %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => {
              const hasComment = !!comments[c.clientName]?.current;
              return (
                <tr key={i} className="border-t border-gray-100 hover:bg-green-50/50 relative">
                  <td className="px-2 py-0.5 relative">
                    <span 
                      className={`text-gray-800 font-medium text-[11px] ${hasComment ? 'underline decoration-dotted cursor-pointer' : ''}`}
                      onClick={() => hasComment && onAddComment(c.clientName)}
                    >
                      {c.clientName}
                    </span>
                  </td>
                  <td className="py-0.5">
                    <button
                      onClick={() => onAddComment(c.clientName)}
                      className="p-0.5 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-blue-600"
                      title="Adicionar comentário"
                    >
                      <MessageSquarePlus className="w-2.5 h-2.5" />
                    </button>
                  </td>
                  <td className="px-2 py-0.5 text-right text-green-600 font-bold text-[11px]">{c.delta}</td>
                  <td className="px-2 py-0.5 text-right text-green-600 text-[11px]">{c.deltaPercent.toFixed(2)}%</td>
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
      <div className="px-2 py-1 border-b" style={{ backgroundColor: '#1E40AF', borderColor: '#1E3A8A' }}>
        <h3 className="text-xs font-bold text-white flex items-center gap-1">
          <CameraIcon className="w-3 h-3" />
          Câmeras
        </h3>
      </div>
      <div className="overflow-y-auto max-h-[280px]">
        <table className="w-full text-[9px]">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="text-left px-1.5 py-0.5 font-semibold text-gray-700 text-[8px]">Cliente</th>
              <th className="text-right px-1.5 py-0.5 font-semibold text-gray-700 text-[8px]">Qtd</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-blue-50/50">
                <td className="px-1.5 py-0.5 text-gray-800 font-medium text-[9px] truncate">{c.clientName}</td>
                <td className="px-1.5 py-0.5 text-right text-blue-700 font-bold text-[9px]">{c.quantity}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={2} className="px-1.5 py-1 text-center text-gray-400 text-[9px]">Nenhum dado</td></tr>
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
      <div className="px-2 py-1 border-b" style={{ backgroundColor: '#7C3AED', borderColor: '#6D28D9' }}>
        <h3 className="text-xs font-bold text-white flex items-center gap-1">
          <Tag className="w-3 h-3" />
          Tags
        </h3>
      </div>
      <div className="overflow-y-auto max-h-[280px]">
        <table className="w-full text-[9px]">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              <th className="text-left px-1.5 py-0.5 font-semibold text-gray-700 text-[8px]">Cliente</th>
              <th className="text-right px-1.5 py-0.5 font-semibold text-gray-700 text-[8px]">Qtd</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-purple-50/50">
                <td className="px-1.5 py-0.5 text-gray-800 font-medium text-[9px] truncate">{c.clientName}</td>
                <td className="px-1.5 py-0.5 text-right text-purple-700 font-bold text-[9px]">{c.quantity}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={2} className="px-1.5 py-1 text-center text-gray-400 text-[9px]">Nenhum dado</td></tr>
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
  const { data: authData } = trpc.auth.me.useQuery();
  const [commentModal, setCommentModal] = useState<{ clientName: string } | null>(null);
  const [comments, setComments] = useState<Record<string, CommentData>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Carregar comentários do banco ao inicializar
  const monthYear = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const { data: dbComments } = trpc.clientComments.list.useQuery({ monthYear });

  useEffect(() => {
    if (dbComments && dbComments.length > 0) {
      const commentsMap: Record<string, CommentData> = {};
      dbComments.forEach(comment => {
        commentsMap[comment.clientName] = {
          current: {
            text: comment.comment,
            user: comment.authorName || 'Usuário',
            date: comment.updatedAt?.toISOString() || new Date().toISOString(),
          },
          history: [],
        };
      });
      setComments(commentsMap);
    }
  }, [dbComments]);

  const handleScreenshot = async () => {
    if (!contentRef.current) return;
    try {
      const dataUrl = await domToPng(contentRef.current, {
        backgroundColor: '#F0F4F8',
        scale: 2,
      });
      // Converter data URL para blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
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
    } catch (err) {
      console.error('Erro ao capturar screenshot:', err);
      alert('Erro ao capturar screenshot');
    }
  };

  const handleAddComment = (clientName: string) => {
    setCommentModal({ clientName });
  };

  // Mutation para salvar comentário no banco
  const upsertCommentMutation = trpc.clientComments.upsert.useMutation();
  const deleteCommentMutation = trpc.clientComments.delete.useMutation();

  const handleSaveComment = async (text: string) => {
    if (!commentModal) return;
    
    const clientName = commentModal.clientName;
    const currentData = comments[clientName] || { current: null, history: [] };
    
    // Adicionar comentário atual ao histórico
    const newHistory = currentData.current 
      ? [...currentData.history, currentData.current]
      : currentData.history;
    
    // Criar novo comentário
    const newComment: CommentEntry = {
      text,
      user: authData?.name || 'Usuário',
      date: new Date().toISOString(),
    };
    
    const updatedComments = {
      ...comments,
      [clientName]: {
        current: newComment,
        history: newHistory,
      }
    };
    
    setComments(updatedComments);
    
    // Salvar no banco de dados
    try {
      await upsertCommentMutation.mutateAsync({
        clientName,
        comment: text,
        monthYear,
      });
    } catch (err) {
      console.error('Erro ao salvar comentário:', err);
    }
    
    setCommentModal(null);
  };

  const handleDeleteComment = async () => {
    if (!commentModal) return;
    
    const clientName = commentModal.clientName;
    const updated = { ...comments };
    delete updated[clientName];
    
    setComments(updated);
    
    // Deletar do banco de dados
    try {
      await deleteCommentMutation.mutateAsync({
        clientName,
        monthYear,
      });
    } catch (err) {
      console.error('Erro ao deletar comentário:', err);
    }
    
    setCommentModal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F0F4F8' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: '#001F3F' }} />
          <p style={{ color: '#001F3F' }}>Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F0F4F8' }}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <p className="text-red-600">Erro ao carregar dados: {error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F0F4F8', minHeight: '100vh', padding: '20px' }}>
      <div ref={contentRef} className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#001F3F' }}>
            Controle de UR's, Câmeras e Tags no mês de Maio
          </h1>
          <button
            onClick={handleScreenshot}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Screenshot
          </button>
        </div>

        {/* Gráfico de Evolução */}
        {data && data.evolution && <EvolutionChart data={data.evolution} />}

        {/* Tabelas */}
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <WorstClientsTable 
                clients={data.worstClients} 
                comments={comments}
                onAddComment={handleAddComment}
              />
              <BestClientsTable 
                clients={data.bestClients} 
                comments={comments}
                onAddComment={handleAddComment}
              />
            </div>

            {/* Equipamentos */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <CamerasTable data={data.cameras} />
              <TagsTable data={data.tags} />
            </div>
          </>
        )}
      </div>

      {/* Modal de Comentário */}
      {commentModal && (
        <CommentModal
          clientName={commentModal.clientName}
          commentData={comments[commentModal.clientName] || null}
          currentUser={authData?.name || 'Usuário'}
          onSave={handleSaveComment}
          onDelete={handleDeleteComment}
          onClose={() => setCommentModal(null)}
        />
      )}
    </div>
  );
}
