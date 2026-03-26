import { useEffect, useState, useRef } from 'react';
import { usePainelData, CoberturaCSM, ClienteContato, FlagTipo, MarcoStats } from '@/hooks/usePainelData';
import { useMigracaoData } from '@/hooks/useMigracaoData';
import { RefreshCw, TrendingUp, TrendingDown, CheckCircle2, XCircle, Loader2, AlertCircle, Flag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';

const META = 25;

function pct(v: number) {
  return (v * 100).toFixed(0) + '%';
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
          <div key={i} className="flex items-center gap-2 px-2 py-1 rounded text-sm"
            style={{ backgroundColor: c.flag ? colors.bg : 'transparent' }}>
            {c.flag
              ? <Flag className="w-3 h-3 shrink-0" style={{ color: colors.dot }} fill={colors.dot} />
              : <span className="w-3 h-3 shrink-0 inline-block rounded-full bg-gray-200" />}
            <span className="font-medium leading-tight" style={{ color: c.flag ? colors.text : '#374151' }}>{c.nome}</span>
            <span className="ml-auto text-gray-400 shrink-0 text-xs">{c.ultimoContato}</span>
          </div>
        );
      })}
    </div>
  );
}

function ContatosCell({ row }: { row: CoberturaCSM }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const inBtn = btnRef.current?.contains(e.target as Node);
      const inTip = tooltipRef.current?.contains(e.target as Node);
      if (!inBtn && !inTip) {
        // Delay de 500ms antes de fechar para permitir scroll
        closeTimeoutRef.current = setTimeout(() => setOpen(false), 500);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [open]);

  function handleMouseMove(e: React.MouseEvent) {
    // Cancelar timeout se o mouse voltar
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    
    const TW = 320;
    let left = e.clientX + 12;
    let top = e.clientY + 12;
    
    // Ajustar se sair da tela
    if (left + TW > window.innerWidth) {
      left = window.innerWidth - TW - 8;
    }
    if (top + 340 > window.innerHeight) {
      top = e.clientY - 340 - 8;
    }
    
    setPos({ top, left });
  }

  function handleMouseEnter() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  }

  function handleMouseLeave() {
    // Delay antes de fechar
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 500);
  }

  return (
    <div className="relative inline-block" onMouseLeave={handleMouseLeave}>
      <button
        ref={btnRef}
        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors px-1 rounded text-2xl leading-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setOpen(v => !v)}
        onMouseMove={handleMouseMove}
      >
        {row.contatosSemana}
      </button>

      {open && (
        <div ref={tooltipRef} className="w-80 bg-white rounded-xl shadow-2xl border fixed"
          style={{ zIndex: 99999, borderColor: '#E0E8F0', top: `${pos.top}px`, left: `${pos.left}px` }}
          onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove}>
          <div className="px-3 py-2 border-b flex items-center justify-between"
            style={{ borderColor: '#E0E8F0', backgroundColor: '#F8FAFC' }}>
            <span className="text-sm font-bold text-gray-700">{row.csm}</span>
            <span className="text-xs text-gray-500">{row.contatosSemana} contato{row.contatosSemana !== 1 ? 's' : ''} na semana</span>
          </div>
          {row.clientesContatados.some(c => c.flag) && (
            <div className="px-3 py-1.5 border-b flex items-center gap-3 flex-wrap"
              style={{ borderColor: '#F0F4F8', backgroundColor: '#FAFBFC' }}>
              {(['Red Flag', 'Yellow Flag', 'Black Flag'] as FlagTipo[]).map(f => {
                const count = row.clientesContatados.filter(c => c.flag === f).length;
                if (count === 0) return null;
                const colors = FLAG_COLORS[f];
                return (
                  <span key={f} className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: colors.text }}>
                    <Flag className="w-2.5 h-2.5" fill={colors.dot} style={{ color: colors.dot }} />
                    {count} {f}
                  </span>
                );
              })}
            </div>
          )}
          <div className="px-2 py-1.5 max-h-64 overflow-y-auto"><TooltipClientes clientes={row.clientesContatados} /></div>
          {/* Removido scroll duplicado - TooltipClientes já tem seu próprio overflow */}
        </div>
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
                <td className="px-1 py-2.5 text-center text-2xl font-bold text-gray-700">{row.totalClientes}</td>
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
function TabelaMarcos({ dados, total }: { dados: MarcoStats[]; total: number }) {
  const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626'];
  return (
    <div className="bg-white rounded-xl border shadow-sm flex flex-col h-full" style={{ borderColor: '#E0E8F0', overflow: 'visible' }}>
      <div className="px-3 py-2.5 shrink-0" style={{ backgroundColor: '#0F4C81' }}>
        <h3 className="text-sm font-bold text-white tracking-wide">Marcos ≤ 90 dias</h3>
      </div>
      <div className="flex-1 flex flex-col divide-y" style={{ borderColor: '#F0F4F8' }}>
        {dados.map((row, idx) => (
          <div key={row.marco} className="flex items-center justify-between px-4 py-3 hover:bg-blue-50/30 transition-colors flex-1"
            style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFBFC' }}>
            <span className="inline-flex items-center justify-center font-bold text-sm w-8 h-8 rounded-full shrink-0"
              style={{ backgroundColor: colors[idx] + '20', color: colors[idx] }}>
              M{row.marco}
            </span>
            <span className="text-4xl font-bold tabular-nums" style={{ color: colors[idx] }}>
              {row.quantidade}
            </span>
          </div>
        ))}
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

/* ─── Página principal ──────────────────────────────────────────────── */
export default function Painel() {
  const { data, loading, error, fetchData } = usePainelData();
  const { data: mig, loading: migLoading, fetchData: fetchMig } = useMigracaoData();

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchMig(); }, []);

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
        <Button size="sm" variant="outline" onClick={fetchData} disabled={loading}
          className="gap-1.5 border-white/30 text-white hover:bg-white/10 bg-transparent">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
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
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr minmax(200px, 240px) minmax(200px, 240px)' }}>
              <TabelaCobertura titulo="Cobertura Semanal — Onboarding" cor="#2563EB"
                dados={data.onboarding} total={data.totalOnboarding} />
              <TabelaCobertura titulo="Cobertura Semanal — Ongoing" cor="#7C3AED"
                dados={data.ongoing} total={data.totalOngoing} />
              <TabelaMarcos dados={data.clientesPorMarco} total={data.totalClientesMarco} />
              <TabelaMigracao />
            </div>

            <p className="text-xs text-gray-400 text-center">
              Meta semanal: {META}% de cobertura da base (segunda a domingo) · Passe o mouse nos contatos para ver a lista de clientes
            </p>
          </>
        )}
      </main>
    </div>
  );
}
