import { useEffect } from 'react';
import { usePainelData, CoberturaCSM } from '@/hooks/usePainelData';
import { RefreshCw, TrendingUp, TrendingDown, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
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
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E0E8F0' }}>
      <div className="px-5 py-3" style={{ backgroundColor: cor }}>
        <h3 className="text-sm font-bold text-white tracking-wide">{titulo}</h3>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: '#E0E8F0', backgroundColor: '#F8FAFC' }}>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">CSM</th>
            <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contatos</th>
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
              <td className="px-3 py-2.5 text-center font-semibold text-gray-700">{row.contatosSemana}</td>
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
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Carregando dados das planilhas...</p>
          </div>
        )}

        {/* Erro */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-gray-600">{error}</p>
            <Button size="sm" onClick={fetchData}>Tentar novamente</Button>
          </div>
        )}

        {/* Conteúdo */}
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
              Meta semanal: {META}% de cobertura da base por analista (segunda a domingo)
            </p>
          </>
        )}
      </main>
    </div>
  );
}
