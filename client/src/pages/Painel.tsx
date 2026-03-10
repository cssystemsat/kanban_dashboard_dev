import { useEffect, useState, useRef } from 'react';
import { usePainelData, CoberturaCSM, ClienteContato, FlagTipo } from '@/hooks/usePainelData';
import { RefreshCw, TrendingUp, TrendingDown, CheckCircle2, XCircle, Loader2, AlertCircle, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const META = 25; // 25%

function pct(v: number) {
  return (v * 100).toFixed(0) + '%';
}

function StatusIcon({ bateu }: { bateu: boolean }) {
  return bateu ? (
    <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-xs">
      <CheckCircle2 className="w-4 h-4" /> Atingiu
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-500 font-semibold text-xs">
      <XCircle className="w-4 h-4" /> Abaixo
    </span>
  );
}

const FLAG_COLORS: Record<FlagTipo, { text: string; bg: string; dot: string; label: string }> = {
  'Red Flag':    { text: '#991B1B', bg: '#FEF2F2', dot: '#EF4444', label: 'Red Flag' },
  'Yellow Flag': { text: '#92400E', bg: '#FFFBEB', dot: '#F59E0B', label: 'Yellow Flag' },
  'Black Flag':  { text: '#1F2937', bg: '#F3F4F6', dot: '#374151', label: 'Black Flag' },
  '':            { text: '#374151', bg: 'transparent', dot: 'transparent', label: '' },
};

function TooltipClientes({ clientes }: { clientes: ClienteContato[] }) {
  if (clientes.length === 0) {
    return (
      <div className="text-xs text-gray-400 italic py-1">Nenhum contato registrado</div>
    );
  }

  return (
    <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
      {clientes.map((c, i) => {
        const colors = FLAG_COLORS[c.flag];
        return (
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-1 rounded text-xs"
            style={{ backgroundColor: c.flag ? colors.bg : 'transparent' }}
          >
            {c.flag ? (
              <Flag
                className="w-3 h-3 shrink-0"
                style={{ color: colors.dot }}
                fill={colors.dot}
              />
            ) : (
              <span className="w-3 h-3 shrink-0 inline-block rounded-full bg-gray-200" />
            )}
            <span
              className="font-medium leading-tight"
              style={{ color: c.flag ? colors.text : '#374151' }}
            >
              {c.nome}
            </span>
            <span className="ml-auto text-gray-400 shrink-0">{c.ultimoContato}</span>
          </div>
        );
      })}
    </div>
  );
}

function ContatosCell({ row }: { row: CoberturaCSM }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors px-1 rounded"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        title="Ver lista de clientes contatados"
      >
        {row.contatosSemana}
      </button>

      {open && (
        <div
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-white rounded-xl shadow-2xl border"
          style={{ borderColor: '#E0E8F0' }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {/* Header do tooltip */}
          <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: '#E0E8F0', backgroundColor: '#F8FAFC' }}>
            <span className="text-xs font-bold text-gray-700">{row.csm}</span>
            <span className="text-xs text-gray-500">{row.contatosSemana} contato{row.contatosSemana !== 1 ? 's' : ''}</span>
          </div>

          {/* Legenda de flags */}
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

          {/* Lista de clientes */}
          <div className="px-2 py-1.5">
            <TooltipClientes clientes={row.clientesContatados} />
          </div>

          {/* Seta apontando para baixo */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #E0E8F0',
            }}
          />
        </div>
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
  total: { contatos: number; total: number; percentual: number; bateuMeta: boolean };
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-visible" style={{ borderColor: '#E0E8F0' }}>
      <div className="px-5 py-3 rounded-t-xl" style={{ backgroundColor: cor }}>
        <h3 className="text-sm font-bold text-white tracking-wide">{titulo}</h3>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: '#E0E8F0', backgroundColor: '#F8FAFC' }}>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">CSM</th>
            <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Contatos
              <span className="ml-1 text-gray-400 font-normal normal-case">(hover)</span>
            </th>
            <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
            <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">% Semanal</th>
            <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Meta 25%</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((row, idx) => (
            <tr
              key={row.csm}
              className="border-b transition-colors hover:bg-gray-50"
              style={{ borderColor: '#F0F4F8', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC' }}
            >
              <td className="px-4 py-2.5 font-medium text-gray-800">{row.csm}</td>
              <td className="px-3 py-2.5 text-center">
                <ContatosCell row={row} />
              </td>
              <td className="px-3 py-2.5 text-center text-gray-600">{row.totalClientes}</td>
              <td className="px-3 py-2.5 text-center">
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: row.bateuMeta ? '#DCFCE7' : '#FEE2E2',
                    color: row.bateuMeta ? '#166534' : '#991B1B',
                  }}
                >
                  {pct(row.percentual)}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center">
                <StatusIcon bateu={row.bateuMeta} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#F1F5F9' }}>
            <td className="px-4 py-2.5 font-bold text-gray-800 text-xs uppercase tracking-wide">Total</td>
            <td className="px-3 py-2.5 text-center font-bold text-gray-800">{total.contatos}</td>
            <td className="px-3 py-2.5 text-center font-bold text-gray-800">{total.total}</td>
            <td className="px-3 py-2.5 text-center">
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: total.bateuMeta ? '#DCFCE7' : '#FEE2E2',
                  color: total.bateuMeta ? '#166534' : '#991B1B',
                }}
              >
                {pct(total.percentual)}
              </span>
            </td>
            <td className="px-3 py-2.5 text-center">
              <StatusIcon bateu={total.bateuMeta} />
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
          <h1 className="text-base font-bold text-white">Painel de Gestão CS</h1>
          {data && (
            <p className="text-xs text-gray-400 mt-0.5">
              Semana: {data.semanaAtual.inicio} — {data.semanaAtual.fim}
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

      <main className="px-4 pt-4 pb-8 max-w-6xl mx-auto space-y-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Carregando dados das planilhas...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-gray-600">{error}</p>
            <Button size="sm" onClick={fetchData}>Tentar novamente</Button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Cards de resumo geral */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-1" style={{ borderColor: '#E0E8F0', borderLeft: '4px solid #2563EB' }}>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Onboarding</p>
                <p className="text-2xl font-bold text-gray-800">{pct(data.totalOnboarding.percentual)}</p>
                <p className="text-xs text-gray-500">{data.totalOnboarding.contatos} de {data.totalOnboarding.total} clientes</p>
                <div className="flex items-center gap-1 mt-1">
                  {data.totalOnboarding.bateuMeta ? (
                    <><TrendingUp className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-600 font-semibold">Meta atingida</span></>
                  ) : (
                    <><TrendingDown className="w-3.5 h-3.5 text-red-500" /><span className="text-xs text-red-500 font-semibold">Abaixo da meta</span></>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-1" style={{ borderColor: '#E0E8F0', borderLeft: '4px solid #7C3AED' }}>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ongoing</p>
                <p className="text-2xl font-bold text-gray-800">{pct(data.totalOngoing.percentual)}</p>
                <p className="text-xs text-gray-500">{data.totalOngoing.contatos} de {data.totalOngoing.total} clientes</p>
                <div className="flex items-center gap-1 mt-1">
                  {data.totalOngoing.bateuMeta ? (
                    <><TrendingUp className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-600 font-semibold">Meta atingida</span></>
                  ) : (
                    <><TrendingDown className="w-3.5 h-3.5 text-red-500" /><span className="text-xs text-red-500 font-semibold">Abaixo da meta</span></>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-1" style={{ borderColor: '#E0E8F0', borderLeft: '4px solid #059669' }}>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Geral</p>
                <p className="text-2xl font-bold text-gray-800">{pct(data.totalGeral.percentual)}</p>
                <p className="text-xs text-gray-500">{data.totalGeral.contatos} de {data.totalGeral.total} clientes</p>
                <div className="flex items-center gap-1 mt-1">
                  {data.totalGeral.bateuMeta ? (
                    <><TrendingUp className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-600 font-semibold">Meta atingida</span></>
                  ) : (
                    <><TrendingDown className="w-3.5 h-3.5 text-red-500" /><span className="text-xs text-red-500 font-semibold">Abaixo da meta</span></>
                  )}
                </div>
              </div>
            </div>

            {/* Tabelas por analista */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TabelaCobertura
                titulo="Cobertura de Base Semanal — Onboarding"
                cor="#2563EB"
                dados={data.onboarding}
                total={data.totalOnboarding}
              />
              <TabelaCobertura
                titulo="Cobertura de Base Semanal — Ongoing"
                cor="#7C3AED"
                dados={data.ongoing}
                total={data.totalOngoing}
              />
            </div>

            <p className="text-xs text-gray-400 text-center">
              Meta semanal: {META}% de cobertura da base por analista (segunda a domingo) · Passe o mouse nos contatos para ver a lista
            </p>
          </>
        )}
      </main>
    </div>
  );
}
