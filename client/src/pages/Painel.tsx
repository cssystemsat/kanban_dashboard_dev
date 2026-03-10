import { useEffect, useState, useRef } from 'react';
import { usePainelData, CoberturaCSM, ClienteContato, FlagTipo } from '@/hooks/usePainelData';
import { RefreshCw, TrendingUp, TrendingDown, CheckCircle2, XCircle, Loader2, AlertCircle, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';

const META = 25; // 25%

function pct(v: number) {
  return (v * 100).toFixed(0) + '%';
}

function StatusIcon({ bateu }: { bateu: boolean }) {
  return bateu ? (
    <span className="inline-flex items-center gap-1 text-green-600 font-bold text-sm">
      <CheckCircle2 className="w-4 h-4" /> Atingiu
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-500 font-bold text-sm">
      <XCircle className="w-4 h-4" /> Abaixo
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
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-1 rounded text-sm"
            style={{ backgroundColor: c.flag ? colors.bg : 'transparent' }}
          >
            {c.flag ? (
              <Flag className="w-3 h-3 shrink-0" style={{ color: colors.dot }} fill={colors.dot} />
            ) : (
              <span className="w-3 h-3 shrink-0 inline-block rounded-full bg-gray-200" />
            )}
            <span className="font-medium leading-tight" style={{ color: c.flag ? colors.text : '#374151' }}>
              {c.nome}
            </span>
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

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const inBtn = btnRef.current?.contains(e.target as Node);
      const inTip = tooltipRef.current?.contains(e.target as Node);
      if (!inBtn && !inTip) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleMouseEnter() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.top + window.scrollY - 8,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
    setOpen(true);
  }

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors px-1 rounded text-xl"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      >
        {row.contatosSemana}
      </button>

      {open && createPortal(
        <div
          ref={tooltipRef}
          className="w-80 bg-white rounded-xl shadow-2xl border"
          style={{
            position: 'absolute',
            zIndex: 99999,
            borderColor: '#E0E8F0',
            top: pos.top,
            left: pos.left,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px',
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: '#E0E8F0', backgroundColor: '#F8FAFC' }}>
            <span className="text-sm font-bold text-gray-700">{row.csm}</span>
            <span className="text-xs text-gray-500">{row.contatosSemana} contato{row.contatosSemana !== 1 ? 's' : ''} na semana</span>
          </div>

          {row.clientesContatados.some(c => c.flag) && (
            <div className="px-3 py-1.5 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: '#F0F4F8', backgroundColor: '#FAFBFC' }}>
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

          <div className="px-2 py-1.5">
            <TooltipClientes clientes={row.clientesContatados} />
          </div>

          <div
            className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
            style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #E0E8F0' }}
          />
        </div>,
        document.body
      )}
    </div>
  );
}

function TabelaCobertura({
  titulo,
  cor,
  dados,
  total,
}: {
  titulo: string;
  cor: string;
  dados: CoberturaCSM[];
  total: { contatos: number; total: number; percentual: number; bateuMeta: boolean; acumuladoMes: number };
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E0E8F0' }}>
      <div className="px-4 py-2.5 rounded-t-xl" style={{ backgroundColor: cor }}>
        <h3 className="text-sm font-bold text-white tracking-wide">{titulo}</h3>
      </div>

      <table className="w-full table-fixed">
        <colgroup>
          <col style={{ width: '22%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
        </colgroup>
        <thead>
          <tr className="border-b" style={{ borderColor: '#E0E8F0', backgroundColor: '#F8FAFC' }}>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">CSM</th>
            <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contatos</th>
            <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
            <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">% Semana</th>
            <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meta 25%</th>
            <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">% Mês</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((row, idx) => {
            const pctMes = row.totalClientes > 0 ? (row.acumuladoMes / row.totalClientes) * 100 : 0;
            return (
              <tr
                key={row.csm}
                className="border-b transition-colors hover:bg-blue-50/30"
                style={{ borderColor: '#F0F4F8', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC' }}
              >
                <td className="px-3 py-2.5 font-semibold text-gray-800 text-base truncate">{row.csm}</td>
                <td className="px-2 py-2.5 text-center">
                  <ContatosCell row={row} />
                </td>
                <td className="px-2 py-2.5 text-center text-xl font-bold text-gray-700">{row.totalClientes}</td>
                <td className="px-2 py-2.5 text-center">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-base font-bold"
                    style={{
                      backgroundColor: row.bateuMeta ? '#DCFCE7' : '#FEE2E2',
                      color: row.bateuMeta ? '#166534' : '#991B1B',
                    }}
                  >
                    {pct(row.percentual)}
                  </span>
                </td>
                <td className="px-2 py-2.5 text-center">
                  <StatusIcon bateu={row.bateuMeta} />
                </td>
                <td className="px-2 py-2.5 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-base font-bold bg-indigo-50 text-indigo-700">
                    {pctMes.toFixed(0)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#F1F5F9' }}>
            <td className="px-3 py-2.5 font-bold text-gray-700 text-xs uppercase tracking-wide">Total</td>
            <td className="px-2 py-2.5 text-center font-bold text-gray-800 text-xl">{total.contatos}</td>
            <td className="px-2 py-2.5 text-center font-bold text-gray-800 text-xl">{total.total}</td>
            <td className="px-2 py-2.5 text-center">
              <span
                className="inline-block px-2 py-0.5 rounded-full text-base font-bold"
                style={{
                  backgroundColor: total.bateuMeta ? '#DCFCE7' : '#FEE2E2',
                  color: total.bateuMeta ? '#166534' : '#991B1B',
                }}
              >
                {pct(total.percentual)}
              </span>
            </td>
            <td className="px-2 py-2.5 text-center">
              <StatusIcon bateu={total.bateuMeta} />
            </td>
            <td className="px-2 py-2.5 text-center">
              {(() => {
                const pctMes = total.total > 0 ? (total.acumuladoMes / total.total) * 100 : 0;
                return (
                  <span className="inline-block px-2 py-0.5 rounded-full text-base font-bold bg-indigo-100 text-indigo-800">
                    {pctMes.toFixed(0)}%
                  </span>
                );
              })()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function Painel() {
  const { data, loading, error, fetchData } = usePainelData();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen md:ml-20" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b px-5 py-3 flex items-center justify-between"
        style={{ backgroundColor: '#001F3F', borderColor: '#1a3a5c' }}
      >
        <div>
          <h1 className="text-lg font-bold text-white">Painel de Gestão CS</h1>
          {data && (
            <p className="text-sm text-gray-400 mt-0.5">
              Semana: {data.semanaAtual.inicio} — {data.semanaAtual.fim} · {data.mesAtual}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchData}
          disabled={loading}
          className="gap-1.5 border-white/30 text-white hover:bg-white/10 bg-transparent"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </header>

      <main className="px-4 pt-4 pb-8 max-w-7xl mx-auto space-y-5">
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
            {/* Cards de resumo geral */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Onboarding', color: '#2563EB', t: data.totalOnboarding },
                { label: 'Ongoing',    color: '#7C3AED', t: data.totalOngoing },
                { label: 'Geral',      color: '#059669', t: data.totalGeral },
              ].map(({ label, color, t }) => {
                const pctMes = t.total > 0 ? (t.acumuladoMes / t.total) * 100 : 0;
                return (
                  <div key={label} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-1" style={{ borderColor: '#E0E8F0', borderLeft: `4px solid ${color}` }}>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
                    <p className="text-4xl font-bold text-gray-800">{pct(t.percentual)}</p>
                    <p className="text-sm text-gray-500">{t.contatos} de {t.total} clientes na semana</p>
                    <p className="text-sm font-semibold" style={{ color }}>
                      {pctMes.toFixed(0)}% acumulado no mês ({t.acumuladoMes} clientes)
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {t.bateuMeta ? (
                        <><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm text-green-600 font-semibold">Meta atingida</span></>
                      ) : (
                        <><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-sm text-red-500 font-semibold">Abaixo da meta</span></>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabelas por analista lado a lado */}
            <div className="grid grid-cols-2 gap-4">
              <TabelaCobertura
                titulo="Cobertura Semanal — Onboarding"
                cor="#2563EB"
                dados={data.onboarding}
                total={data.totalOnboarding}
              />
              <TabelaCobertura
                titulo="Cobertura Semanal — Ongoing"
                cor="#7C3AED"
                dados={data.ongoing}
                total={data.totalOngoing}
              />
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
