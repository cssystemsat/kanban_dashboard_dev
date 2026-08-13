import { useEffect, useMemo } from 'react';
import { BarChart3, RefreshCw, Trophy, Users } from 'lucide-react';
import { usePainelData } from '@/hooks/usePainelData';

export const PERFORMANCE_TITLE = 'Performance';

interface RankingColumnProps {
  title: string;
  subtitle: string;
  analysts: string[];
  accent: string;
  softAccent: string;
}

function RankingColumn({ title, subtitle, analysts, accent, softAccent }: RankingColumnProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#DCE5EE] bg-white shadow-sm">
      <div className="border-b border-[#E5EAF0] px-4 py-4" style={{ borderTop: `4px solid ${accent}` }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#001F3F]">{title}</h2>
            <p className="mt-1 text-xs text-[#64748B]">{subtitle}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: softAccent, color: accent }}>
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] items-center px-3 text-[11px] font-bold uppercase tracking-wide text-[#8A99A8]">
          <span>Analista</span>
          <span>Pontos</span>
        </div>
      </div>

      <div className="divide-y divide-[#EEF2F6]">
        {analysts.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#94A3B8]">Nenhum analista encontrado.</div>
        ) : (
          analysts.map((analyst, index) => (
            <div key={`${title}-${analyst}`} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-[#F8FAFC]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: index === 0 ? softAccent : '#F1F5F9', color: index === 0 ? accent : '#64748B' }}>
                  {index === 0 ? <Trophy className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="truncate text-sm font-semibold text-[#243B53]" title={analyst}>{analyst}</span>
              </div>
              <span className="rounded-lg px-3 py-1 text-sm font-extrabold" style={{ backgroundColor: softAccent, color: accent }}>100</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function Performance() {
  const { data, loading, error, fetchData } = usePainelData();

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const onboardingAnalysts = useMemo(
    () => [...new Set((data?.onboarding ?? []).map((item) => item.csm.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [data?.onboarding],
  );
  const ongoingAnalysts = useMemo(
    () => [...new Set((data?.ongoing ?? []).map((item) => item.csm.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [data?.ongoing],
  );
  const generalAnalysts = useMemo(
    () => [...new Set([...onboardingAnalysts, ...ongoingAnalysts])].sort((a, b) => a.localeCompare(b)),
    [onboardingAnalysts, ongoingAnalysts],
  );

  return (
    <main className="min-h-screen bg-[#F5F7FA] md:ml-20">
      <header className="sticky top-0 z-30 border-b border-[#DCE5EE] bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9] text-[#008F00]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#001F3F]">{PERFORMANCE_TITLE}</h1>
              <p className="text-sm text-[#64748B]">Ranking inicial dos analistas por frente de atendimento</p>
            </div>
          </div>
          <button type="button" onClick={() => void fetchData()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-[#C8D4E0] bg-white px-3 py-2 text-sm font-semibold text-[#24435C] transition hover:bg-[#F4F8FB] disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar analistas
          </button>
        </div>
      </header>

      <section className="space-y-5 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE5EE] bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#52677A]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00A63C]" />
            Todos os analistas começam com <strong className="text-[#001F3F]">100 pontos</strong>
          </div>
          <span className="text-xs text-[#8291A0]">A pontuação será ajustada conforme os critérios definidos</span>
        </div>

        {loading && !data ? (
          <div className="rounded-2xl border border-[#DCE5EE] bg-white px-6 py-16 text-center shadow-sm">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#1683E8]" />
            <p className="mt-3 text-sm font-medium text-[#64748B]">Carregando analistas dos painéis...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-700">
            Não foi possível carregar os analistas. Tente atualizar novamente.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <RankingColumn title="Ongoing" subtitle={`${ongoingAnalysts.length} analista(s)`} analysts={ongoingAnalysts} accent="#7C3AED" softAccent="#F0EAFE" />
            <RankingColumn title="Onboarding" subtitle={`${onboardingAnalysts.length} analista(s)`} analysts={onboardingAnalysts} accent="#1683E8" softAccent="#E8F3FF" />
            <RankingColumn title="Geral" subtitle={`${generalAnalysts.length} analista(s)`} analysts={generalAnalysts} accent="#008F5A" softAccent="#E7F8EF" />
          </div>
        )}
      </section>
    </main>
  );
}
