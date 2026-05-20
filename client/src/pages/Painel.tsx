import { useEffect, useState, useRef, useCallback } from 'react';
import { usePainelData, CoberturaCSM, ClienteContato, FlagTipo, MarcoStats, ClienteMarcoDetalhado } from '@/hooks/usePainelData';
import { useMigracaoData } from '@/hooks/useMigracaoData';
import { useEstadosData } from '@/hooks/useEstadosData';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import BrazilMapPainel from '@/components/BrazilMapPainel';
import URsTrendIndicator from '@/components/URsTrendIndicator';
import { RefreshCw, TrendingUp, TrendingDown, CheckCircle2, XCircle, Loader2, AlertCircle, Flag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';

const META = 25;

function pct(v: number) {
  return (v * 100).toFixed(0) + '%';
}

function useAutoRefresh(callback: () => void, intervalMs: number = 600000) {
  useEffect(() => {
    const interval = setInterval(callback, intervalMs);
    return () => clearInterval(interval);
  }, [callback, intervalMs]);
}

function useCountdown(initialSeconds: number, onComplete: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  const resetCountdown = useCallback(() => {
    setTimeLeft(initialSeconds);
    hasCompletedRef.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (hasCompletedRef.current) {
          return initialSeconds;
        }
        
        const newTime = prev - 1;
        if (newTime <= 0) {
          hasCompletedRef.current = true;
          onComplete();
          return initialSeconds;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [initialSeconds, onComplete]);

  return { timeLeft, resetCountdown };
}

function StatusBadge({ bateu }: { bateu: boolean }) {
  return bateu ? (
    <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs whitespace-nowrap">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Atingiu
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-500 font-bold text-xs whitespace-nowrap">
      <XCircle className="w-3.5 h-3.5 shrink-0" /> Abaixo
    </span>
  );
}

const FLAG_COLORS: Record<FlagTipo, { text: string; bg: string; dot: string }> = {
  'Red Flag':    { text: '#991B1B', bg: '#FEF2F2', dot: '#EF4444' },
  'Yellow Flag': { text: '#92400E', bg: '#FFFBEB', dot: '#F59E0B' },
  'Black Flag':  { text: '#1F2937', bg: '#F3F4F6', dot: '#374151' },
  '':            { text: '#374151', bg: 'transparent', dot: 'transparent' },
};

function TooltipClientes({ clientes }: { clientes: ClienteContato[] }) {
  if (clientes.length === 0) {
    return <div className="text-sm text-gray-400 italic py-1">Nenhum contato registrado</div>;
  }
  return (
    <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
      {clientes.map((c, i) => {
        const colors = FLAG_COLORS[c.flag];
        return (
          <div key={i} className="flex flex-col gap-0.5 px-2 py-1 rounded text-sm"
            style={{ backgroundColor: c.flag ? colors.bg : 'transparent' }}>
            <div className="flex items-center gap-2">
              {c.flag
                ? <Flag className="w-3 h-3 shrink-0" style={{ color: colors.dot }} fill={colors.dot} />
                : <span className="w-3 h-3 shrink-0 inline-block rounded-full bg-gray-200" />}
              <span className="font-medium leading-tight" style={{ color: c.flag ? colors.text : '#374151' }}>{c.nome}</span>
              <span className="ml-auto text-gray-400 shrink-0 text-xs">{c.ultimoContato}</span>
            </div>
            {c.faturamento && (
              <div className="flex items-center gap-2 pl-5 text-xs text-gray-600">
                <span className="font-semibold">Fat:</span>
                <span>{c.faturamento}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ContatosCell({ row }: { row: CoberturaCSM }) {
  const [open, setOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FlagTipo | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const inBtn = btnRef.current?.contains(e.target as Node);
      const inTip = tooltipRef.current?.contains(e.target as Node);
      if (!inBtn && !inTip) {
        closeTimeoutRef.current = setTimeout(() => setOpen(false), 200);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [open]);

  const clientesFiltrados = selectedFlag
    ? row.clientesContatados.filter(c => c.flag === selectedFlag)
    : row.clientesContatados;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors px-1 rounded text-2xl leading-none"
        onClick={() => setOpen(v => !v)}
      >
        {row.contatosSemana}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setOpen(false)} />
          <div ref={tooltipRef} className="w-80 bg-white rounded-xl shadow-2xl border fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col max-h-96"
            style={{ zIndex: 99999, borderColor: '#E0E8F0' }}
            >
          <div className="px-3 py-2 border-b flex items-center justify-between shrink-0"
            style={{ borderColor: '#E0E8F0', backgroundColor: '#F8FAFC' }}>
            <span className="text-sm font-bold text-gray-700">{row.csm}</span>
            <span className="text-xs text-gray-500">{clientesFiltrados.length} contato{clientesFiltrados.length !== 1 ? 's' : ''}</span>
          </div>
          {row.clientesContatados.some(c => c.flag) && (
            <div className="px-3 py-1.5 border-b flex items-center gap-2 flex-wrap shrink-0"
              style={{ borderColor: '#F0F4F8', backgroundColor: '#FAFBFC' }}>
              <button
                onClick={() => setSelectedFlag(null)}
                className="px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: selectedFlag === null ? '#E0E7FF' : '#F3F4F6',
                  color: selectedFlag === null ? '#4F46E5' : '#6B7280',
                  border: selectedFlag === null ? '1px solid #C7D2FE' : '1px solid #D1D5DB',
                  cursor: 'pointer'
                }}
              >
                Todos
              </button>
              {(['Red Flag', 'Yellow Flag', 'Black Flag'] as FlagTipo[]).map(f => {
                const count = row.clientesContatados.filter(c => c.flag === f).length;
                if (count === 0) return null;
                const colors = FLAG_COLORS[f];
                return (
                  <button
                    key={f}
                    onClick={() => setSelectedFlag(f)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                    style={{
                      backgroundColor: selectedFlag === f ? colors.bg : '#F3F4F6',
                      color: selectedFlag === f ? colors.text : '#6B7280',
                      border: selectedFlag === f ? `1px solid ${colors.dot}` : '1px solid #D1D5DB'
                    }}
                  >
                    <Flag className="w-2.5 h-2.5" fill={colors.dot} style={{ color: colors.dot }} />
                    {count}
                  </button>
                );
              })}
            </div>
          )}
          <div className="px-2 py-1.5 overflow-y-auto flex-1"><TooltipClientes clientes={clientesFiltrados} /></div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── SemContatoCell (Clientes sem contato na semana) ────────────────── */

function SemContatoCell({ row }: { row: CoberturaCSM }) {
  const [open, setOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FlagTipo | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const inBtn = btnRef.current?.contains(e.target as Node);
      const inTip = tooltipRef.current?.contains(e.target as Node);
      if (!inBtn && !inTip) {
        closeTimeoutRef.current = setTimeout(() => setOpen(false), 200);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [open]);

  const clientesFiltrados = selectedFlag
    ? row.clientesSemContato.filter(c => c.flag === selectedFlag)
    : row.clientesSemContato;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors px-1 rounded text-2xl leading-none"
        onClick={() => setOpen(v => !v)}
      >
        {row.totalClientes}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setOpen(false)} />
          <div ref={tooltipRef} className="w-80 bg-white rounded-xl shadow-2xl border fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col max-h-96"
            style={{ zIndex: 99999, borderColor: '#E0E8F0' }}
            >
          <div className="px-3 py-2 border-b flex items-center justify-between shrink-0"
            style={{ borderColor: '#E0E8F0', backgroundColor: '#F8FAFC' }}>
            <span className="text-sm font-bold text-gray-700">{row.csm}</span>
            <span className="text-xs text-gray-500">{clientesFiltrados.length} sem contato</span>
          </div>
          {row.clientesSemContato.some(c => c.flag) && (
            <div className="px-3 py-1.5 border-b flex items-center gap-2 flex-wrap shrink-0"
              style={{ borderColor: '#F0F4F8', backgroundColor: '#FAFBFC' }}>
              <button
                onClick={() => setSelectedFlag(null)}
                className="px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: selectedFlag === null ? '#E0E7FF' : '#F3F4F6',
                  color: selectedFlag === null ? '#4F46E5' : '#6B7280',
                  border: selectedFlag === null ? '1px solid #C7D2FE' : '1px solid #D1D5DB',
                  cursor: 'pointer'
                }}
              >
                Todos
              </button>
              {(['Red Flag', 'Yellow Flag', 'Black Flag'] as FlagTipo[]).map(f => {
                const count = row.clientesSemContato.filter(c => c.flag === f).length;
                if (count === 0) return null;
                const colors = FLAG_COLORS[f];
                return (
                  <button
                    key={f}
                    onClick={() => setSelectedFlag(f)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                    style={{
                      backgroundColor: selectedFlag === f ? colors.bg : '#F3F4F6',
                      color: selectedFlag === f ? colors.text : '#6B7280',
                      border: selectedFlag === f ? `1px solid ${colors.dot}` : '1px solid #D1D5DB'
                    }}
                  >
                    <Flag className="w-2.5 h-2.5" fill={colors.dot} style={{ color: colors.dot }} />
                    {count}
                  </button>
                );
              })}
            </div>
          )}
          <div className="px-2 py-1.5 overflow-y-auto flex-1"><TooltipClientes clientes={clientesFiltrados} /></div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Tabela de Cobertura ─────────────────────────────────────────────── */
function TabelaCobertura({ titulo, cor, dados, total }: {
  titulo: string; cor: string;
  dados: CoberturaCSM[];
  total: { contatos: number; total: number; percentual: number; bateuMeta: boolean; acumuladoMes: number };
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm flex flex-col h-full" style={{ borderColor: '#E0E8F0', overflow: 'visible' }}>
      <div className="px-4 py-2.5 shrink-0" style={{ backgroundColor: cor }}>
        <h3 className="text-sm font-bold text-white tracking-wide">{titulo}</h3>
      </div>
      <table className="w-full table-fixed">
        <colgroup>
          <col style={{ width: '20%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '17%' }} />
        </colgroup>
        <thead>
          <tr className="border-b" style={{ borderColor: '#E0E8F0', backgroundColor: '#F8FAFC' }}>
            <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">CSM</th>
            <th className="text-center px-1 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cont.</th>
            <th className="text-center px-1 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
            <th className="text-center px-1 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">% Sem.</th>
            <th className="text-center px-1 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meta 25%</th>
            <th className="text-center px-1 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">% Mês</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((row, idx) => {
            const pctMes = row.totalClientes > 0 ? (row.acumuladoMes / row.totalClientes) * 100 : 0;
            return (
              <tr key={row.csm} className="border-b transition-colors hover:bg-blue-50/30"
                style={{ borderColor: '#F0F4F8', backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                <td className="px-2 py-2.5 font-semibold text-gray-800 text-sm truncate">{row.csm}</td>
                <td className="px-1 py-2.5 text-center"><ContatosCell row={row} /></td>
                <td className="px-1 py-2.5 text-center"><SemContatoCell row={row} /></td>
                <td className="px-1 py-2.5 text-center">
                  <span className="inline-block px-1.5 py-0.5 rounded-full text-sm font-bold"
                    style={{ backgroundColor: row.bateuMeta ? '#DCFCE7' : '#FEE2E2', color: row.bateuMeta ? '#166534' : '#991B1B' }}>
                    {pct(row.percentual)}
                  </span>
                </td>
                <td className="px-1 py-2.5 text-center"><StatusBadge bateu={row.bateuMeta} /></td>
                <td className="px-1 py-2.5 text-center">
                  <span className="inline-block px-1.5 py-0.5 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700">
                    {pctMes.toFixed(0)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#F1F5F9' }}>
            <td className="px-2 py-2.5 font-bold text-gray-600 text-xs uppercase tracking-wide">Total</td>
            <td className="px-1 py-2.5 text-center font-bold text-gray-800 text-2xl">{total.contatos}</td>
            <td className="px-1 py-2.5 text-center font-bold text-gray-800 text-2xl">{total.total}</td>
            <td className="px-1 py-2.5 text-center">
              <span className="inline-block px-1.5 py-0.5 rounded-full text-sm font-bold"
                style={{ backgroundColor: total.bateuMeta ? '#DCFCE7' : '#FEE2E2', color: total.bateuMeta ? '#166534' : '#991B1B' }}>
                {pct(total.percentual)}
              </span>
            </td>
            <td className="px-1 py-2.5 text-center"><StatusBadge bateu={total.bateuMeta} /></td>
            <td className="px-1 py-2.5 text-center">
              {(() => {
                const p = total.total > 0 ? (total.acumuladoMes / total.total) * 100 : 0;
                return <span className="inline-block px-1.5 py-0.5 rounded-full text-sm font-bold bg-indigo-100 text-indigo-800">{p.toFixed(0)}%</span>;
              })()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ─── Tabela de Marcos ────────────────────────────────────────────────── */
function TabelaMarcos({ 
  dados, 
  total,
  startDate,
  endDate,
  clientes
}: { 
  dados: MarcoStats[]; 
  total: number;
  startDate: string;
  endDate: string;
  clientes: Array<{ codigoCliente: string; nome: string }>;
}) {
  const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626'];
  
  return (
    <div className="bg-white rounded-xl border shadow-sm flex flex-col h-full" style={{ borderColor: '#E0E8F0', overflow: 'visible' }}>
      <div className="px-3 py-2.5 shrink-0" style={{ backgroundColor: '#0F4C81' }}>
        <h3 className="text-sm font-bold text-white tracking-wide">Marcos ≤ 90 dias</h3>
      </div>
      <div className="flex-1 flex flex-col divide-y" style={{ borderColor: '#F0F4F8' }}>
        {dados.map((row, idx) => {
          const clienteDoMarco = clientes.find(c => c.nome === String(row.marco));
          return (
            <div key={row.marco} className="flex flex-col px-4 py-3 hover:bg-blue-50/30 transition-colors"
              style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFBFC' }}>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center font-bold text-sm w-8 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: colors[idx] + '20', color: colors[idx] }}>
                  M{row.marco}
                </span>
                <span className="text-4xl font-bold tabular-nums" style={{ color: colors[idx] }}>
                  {row.quantidade}
                </span>
              </div>
              {startDate && endDate && clienteDoMarco && (
                <div className="mt-2">
                  <URsTrendIndicator
                    codigoCliente={clienteDoMarco.codigoCliente}
                    startDate={new Date(startDate)}
                    endDate={new Date(endDate)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2.5 border-t flex items-center justify-between shrink-0"
        style={{ borderColor: '#E0E8F0', backgroundColor: '#F1F5F9' }}>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Total</span>
        <span className="text-3xl font-bold text-gray-800">{total}</span>
      </div>
    </div>
  );
}

/* ─── Tabela de Migração ──────────────────────────────────────────────── */
function TabelaMigracao() {
  const { data: mig, loading: migLoading, fetchData: fetchMig } = useMigracaoData();

  useEffect(() => { fetchMig(); }, []);

  const fmt = (val: number | null) => {
    if (val === null) return <span className="text-gray-300">—</span>;
    return val.toLocaleString('pt-BR');
  };

  const itens = [
    { label: 'Em migração',  valor: fmt(mig.emMigracao),   cor: '#2563EB', bg: '#EFF6FF' },
    { label: 'Migrado hoje', valor: fmt(mig.migradoHoje),  cor: '#059669', bg: '#ECFDF5' },
    { label: 'No mês',       valor: fmt(mig.migradoMes),   cor: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Finalizadas',  valor: fmt(mig.finalizadas),  cor: '#D97706', bg: '#FFFBEB' },
  ];
  return (
    <div className="bg-white rounded-xl border shadow-sm flex flex-col h-full" style={{ borderColor: '#E0E8F0', overflow: 'visible' }}>
      <div className="px-3 py-2.5 shrink-0 flex items-center gap-2" style={{ backgroundColor: '#1E3A5F' }}>
        <Truck className="w-4 h-4 text-white opacity-80 shrink-0" />
        <h3 className="text-sm font-bold text-white tracking-wide">Migração</h3>
      </div>
      <div className="flex-1 flex flex-col divide-y" style={{ borderColor: '#F0F4F8' }}>
        {itens.map((item, idx) => (
          <div key={item.label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition-colors flex-1"
            style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFBFC' }}>
            <span className="text-xs font-semibold text-gray-500 leading-tight">{item.label}</span>
            <span className="text-4xl font-bold tabular-nums px-2 py-0.5 rounded-lg"
              style={{ color: item.cor, backgroundColor: item.bg }}>
              {item.valor}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Componente de Mapas com Seletor de Abas ──────────────────────────────────────────────── */
function MapasComAbas({ data }: { data: ReturnType<typeof useEstadosData> }) {
  const [abaAtiva, setAbaAtiva] = useState<'onboarding' | 'ongoing' | 'geral'>('geral');

  const abas = [
    { id: 'onboarding', label: 'Onboarding', cor: '#2563EB', clients: data.onboarding },
    { id: 'ongoing', label: 'Ongoing', cor: '#7C3AED', clients: data.ongoing },
    { id: 'geral', label: 'Geral', cor: '#059669', clients: data.geral },
  ] as const;

  const abaAtualData = abas.find(a => a.id === abaAtiva)!;

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4" style={{ borderColor: '#E0E8F0' }}>
      {/* Seletor de Abas */}
      <div className="flex gap-2 mb-4 border-b pb-3" style={{ borderColor: '#E0E8F0' }}>
        {abas.map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className="px-4 py-2 rounded-t-lg font-medium text-sm transition-all"
            style={{
              backgroundColor: abaAtiva === aba.id ? aba.cor : '#F3F4F6',
              color: abaAtiva === aba.id ? '#FFFFFF' : '#6B7280',
              borderBottom: abaAtiva === aba.id ? `3px solid ${aba.cor}` : 'none',
            }}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* Mapa Único Maior */}
      <div className="flex justify-center">
        <BrazilMapPainel title={`Distribuição - ${abaAtualData.label}`} clients={abaAtualData.clients} />
      </div>
    </div>
  );
}

/* ─── Página principal ──────────────────────────────────────────────── */
export default function Painel() {
  const { data, loading, error, fetchData } = usePainelData();
  const { data: mig, loading: migLoading, fetchData: fetchMig } = useMigracaoData();
  const estadosData = useEstadosData();
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const { user, loading: authLoading } = useAuth();
  const [topBoleto, setTopBoleto] = useState<number>(0);
  const [topVolume, setTopVolume] = useState<number>(0);
  const [marcosTrendStartDate, setMarcosTrendStartDate] = useState<string>('');
  const [marcosTrendEndDate, setMarcosTrendEndDate] = useState<string>('');

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchMig(); }, []);
  useEffect(() => { 
    if (fetchData) fetchData(); 
  }, []);

  // Cronômetro regressivo (10 minutos = 600 segundos)
  const { timeLeft, resetCountdown } = useCountdown(600, () => {
    fetchData();
    fetchMig();
    setLastRefreshTime(new Date());
  });

  // Auto-refresh a cada 10 minutos (600000ms)
  useAutoRefresh(() => {
    fetchData();
    fetchMig();
    setLastRefreshTime(new Date());
    resetCountdown();
  }, 600000);

  return (
    <div className="min-h-screen md:ml-20" style={{ backgroundColor: '#F0F4F8' }}>
      <header className="sticky top-0 z-40 border-b px-5 py-3 flex items-center justify-between"
        style={{ backgroundColor: '#001F3F', borderColor: '#1a3a5c' }}>
        <div>
          <h1 className="text-lg font-bold text-white">Painel de Gestão CS</h1>
          {data && (
            <p className="text-sm text-gray-400 mt-0.5">
              Semana: {data.semanaAtual.inicio} — {data.semanaAtual.fim} · {data.mesAtual}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtro de Tendência */}
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Tendência De</label>
              <input
                type="date"
                value={marcosTrendStartDate}
                onChange={(e) => setMarcosTrendStartDate(e.target.value)}
                className="h-7 px-2 rounded text-xs text-gray-700 bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Tendência Até</label>
              <input
                type="date"
                value={marcosTrendEndDate}
                onChange={(e) => setMarcosTrendEndDate(e.target.value)}
                className="h-7 px-2 rounded text-xs text-gray-700 bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <button
              onClick={() => {
                setMarcosTrendStartDate('');
                setMarcosTrendEndDate('');
              }}
              className="h-7 px-2 rounded text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Limpar
            </button>
          </div>

          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span className="text-gray-500">Próx.:</span>
            <span className="font-mono text-gray-300 w-8 text-right">
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
          {lastRefreshTime && (
            <span className="text-xs text-gray-400">
              Atualizado às {lastRefreshTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={() => { fetchData(); fetchMig(); setLastRefreshTime(new Date()); resetCountdown(); }} disabled={loading}
            className="gap-1.5 border-white/30 text-white hover:bg-white/10 bg-transparent">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </header>



      <main className="px-4 pt-4 pb-8 w-full space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-base text-gray-500">Carregando dados das planilhas...</p>
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-base text-gray-600">{error}</p>
            <Button size="sm" onClick={fetchData}>Tentar novamente</Button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* ── Cards de resumo: 4 colunas ── */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Onboarding', color: '#2563EB', t: data.totalOnboarding },
                { label: 'Ongoing',    color: '#7C3AED', t: data.totalOngoing },
                { label: 'Geral',      color: '#059669', t: data.totalGeral },
              ].map(({ label, color, t }) => {
                const pctMes = t.total > 0 ? (t.acumuladoMes / t.total) * 100 : 0;
                return (
                  <div key={label} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-1"
                    style={{ borderColor: '#E0E8F0', borderLeft: `4px solid ${color}` }}>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
                    <p className="text-5xl font-bold text-gray-800 leading-none">{pct(t.percentual)}</p>
                    <p className="text-sm text-gray-500 mt-1">{t.contatos} de {t.total} na semana</p>
                    <p className="text-sm font-semibold" style={{ color }}>{pctMes.toFixed(0)}% no mês ({t.acumuladoMes})</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {t.bateuMeta
                        ? <><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm text-green-600 font-semibold">Meta atingida</span></>
                        : <><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-sm text-red-500 font-semibold">Abaixo da meta</span></>}
                    </div>
                  </div>
                );
              })}

              {/* Card Migrados no Ano */}
              <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-1"
                style={{ borderColor: '#E0E8F0', borderLeft: '4px solid #0EA5E9' }}>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-sky-500" /> Migrados no Ano
                </p>
                {migLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-sky-400 mt-1" />
                ) : (
                  <p className="text-5xl font-bold text-sky-500 leading-none">
                    {mig.migradosAno !== null ? mig.migradosAno.toLocaleString('pt-BR') : '—'}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">placas migradas em 2026</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs text-sky-600 font-semibold">Acumulado anual</span>
                </div>
              </div>
            </div>

            {/* ── 4 tabelas em linha única ── */}
            {/* Onboarding e Ongoing dividem o espaço; Marcos e Migração têm largura mínima fixa */}
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr minmax(300px, 350px) minmax(200px, 240px)' }}>
              <TabelaCobertura titulo="Cobertura Semanal — Onboarding" cor="#2563EB"
                dados={data.onboarding} total={data.totalOnboarding} />
              <TabelaCobertura titulo="Cobertura Semanal — Ongoing" cor="#7C3AED"
                dados={data.ongoing} total={data.totalOngoing} />
              <TabelaMarcos 
                dados={data.clientesPorMarco} 
                total={data.totalClientesMarco}
                startDate={marcosTrendStartDate}
                endDate={marcosTrendEndDate}
                clientes={data.clientesMarcoDetalhado.map(c => ({ codigoCliente: c.nome, nome: String(c.marco) }))}
              />
              <TabelaMigracao />
            </div>

            {/* Mapas do Brasil por Estado - Seletor de Abas - Apenas para usuários logados */}
            {!estadosData.loading && user && (
              <MapasComAbas data={estadosData} />
            )}
            
            {/* Mensagem para usuários não logados */}
            {!authLoading && !user && (
              <div className="bg-white rounded-xl border shadow-sm p-8 text-center" style={{ borderColor: '#E0E8F0' }}>
                <p className="text-gray-600 mb-4">Para visualizar os mapas de distribuição por estado, você precisa fazer login.</p>
                <button
                  onClick={() => window.location.href = getLoginUrl()}
                  className="px-6 py-2 rounded-lg font-medium text-white transition-all"
                  style={{ backgroundColor: '#2563EB' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
                >
                  Fazer Login
                </button>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              Meta semanal: {META}% de cobertura da base (segunda a domingo) · Passe o mouse nos contatos para ver a lista de clientes
            </p>
          </>
        )}
      </main>
    </div>
  );
}
