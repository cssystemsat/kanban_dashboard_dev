import { useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCw, Trophy, Users, AlertCircle } from 'lucide-react';
import { usePainelData, CoberturaCSM } from '@/hooks/usePainelData';
import { trpc } from '@/lib/trpc';

export const PERFORMANCE_TITLE = 'Performance';

interface PenaltyItem {
  date: string;
  points: number;
  reason: string;
}

interface AnalystData {
  name: string;
  score: number;
  penalties: PenaltyItem[];
  cobertura?: CoberturaCSM;
}

interface RankingColumnProps {
  title: string;
  subtitle: string;
  analysts: AnalystData[];
  accent: string;
  softAccent: string;
}

function getCurrentWeekLabel(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const format = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${format(monday)} a ${format(sunday)}`;
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
          analysts.map((item, index) => {
            const hasPenalties = item.penalties.length > 0;
            const tooltipText = hasPenalties
              ? item.penalties.map(p => `-${p.points} pontos : ${p.reason} (${p.date})`).join('\n')
              : 'Nenhuma penalização este mês (100% de aproveitamento)';

            return (
              <div key={`${title}-${item.name}`} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-[#F8FAFC]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: index === 0 ? softAccent : '#F1F5F9', color: index === 0 ? accent : '#64748B' }}>
                    {index === 0 ? <Trophy className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#243B53]" title={item.name}>{item.name}</span>
                    {item.cobertura && (
                      <span className="text-[11px] text-[#64748B]">
                        Cob: {(item.cobertura.percentual * 100).toFixed(0)}% ({item.cobertura.contatosSemana}/{item.cobertura.totalClientes})
                      </span>
                    )}
                  </div>
                </div>

                <div className="group relative">
                  <span
                    className="inline-flex cursor-help items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-extrabold transition-all"
                    style={{ backgroundColor: softAccent, color: accent }}
                  >
                    {item.score}
                    {hasPenalties && <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
                  </span>

                  {/* Tooltip profissional flutuante */}
                  <div className="pointer-events-none absolute right-0 bottom-full z-50 mb-2 hidden w-64 rounded-xl border border-slate-200 bg-slate-900 px-3 py-2.5 text-xs text-white shadow-xl group-hover:block whitespace-pre-line leading-relaxed">
                    <div className="font-bold text-slate-200 mb-1 border-b border-slate-700 pb-1">Histórico de Pontuação:</div>
                    {tooltipText}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default function Performance() {
  const { data, loading, error, fetchData } = usePainelData();
  const currentYearMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const [simulationActive, setSimulationActive] = useState(false);

  const { data: scoresRecords, refetch: refetchScores } = trpc.analystScores.list.useQuery({
    yearMonth: currentYearMonth,
  });

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const scoresMap = useMemo(() => {
    const map: Record<string, { score: number; penalties: PenaltyItem[] }> = {};
    if (scoresRecords) {
      for (const rec of scoresRecords) {
        const key = `${rec.analystName}|${rec.category}`;
        let parsedPenalties: PenaltyItem[] = [];
        try {
          parsedPenalties = JSON.parse(rec.penaltiesJson || '[]');
        } catch {
          parsedPenalties = [];
        }
        map[key] = { score: rec.score, penalties: parsedPenalties };
      }
    }
    return map;
  }, [scoresRecords]);

  // Processar analistas de Onboarding
  const onboardingList = useMemo(() => {
    const list = data?.onboarding ?? [];
    return list.map(item => {
      const name = item.csm.trim();
      const key = `${name}|onboarding`;
      const record = scoresMap[key];
      const simulatedPenalty = simulationActive && item.percentual < 0.25
        ? [{ date: `Semana vigente`, points: 8, reason: 'meta de contato (< 25%)' }]
        : [];
      return {
        name,
        score: Math.max(0, (record ? record.score : 100) - (simulatedPenalty.length ? 8 : 0)),
        penalties: [...(record ? record.penalties : []), ...simulatedPenalty],
        cobertura: item,
      };
    }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }, [data?.onboarding, scoresMap, simulationActive]);

  // Processar analistas de Ongoing
  const ongoingList = useMemo(() => {
    const list = data?.ongoing ?? [];
    return list.map(item => {
      const name = item.csm.trim();
      const key = `${name}|ongoing`;
      const record = scoresMap[key];
      const simulatedPenalty = simulationActive && item.percentual < 0.25
        ? [{ date: `Semana vigente`, points: 8, reason: 'meta de contato (< 25%)' }]
        : [];
      return {
        name,
        score: Math.max(0, (record ? record.score : 100) - (simulatedPenalty.length ? 8 : 0)),
        penalties: [...(record ? record.penalties : []), ...simulatedPenalty],
        cobertura: item,
      };
    }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }, [data?.ongoing, scoresMap, simulationActive]);

  // Processar analistas Geral (unificado com soma/média de pontuação ou combinados)
  const generalList = useMemo(() => {
    const map: Record<string, { scoreSum: number; count: number; penalties: PenaltyItem[]; coberturaTotal: { contatos: number; total: number } }> = {};
    
    for (const item of [...onboardingList, ...ongoingList]) {
      if (!map[item.name]) {
        map[item.name] = { scoreSum: 0, count: 0, penalties: [], coberturaTotal: { contatos: 0, total: 0 } };
      }
      map[item.name].scoreSum += item.score;
      map[item.name].count += 1;
      if (item.penalties) {
        map[item.name].penalties.push(...item.penalties);
      }
      if (item.cobertura) {
        map[item.name].coberturaTotal.contatos += item.cobertura.contatosSemana;
        map[item.name].coberturaTotal.total += item.cobertura.totalClientes;
      }
    }

    return Object.entries(map).map(([name, info]) => {
      const avgScore = Math.round(info.scoreSum / info.count);
      const fakeCob: CoberturaCSM = {
        csm: name,
        contatosSemana: info.coberturaTotal.contatos,
        totalClientes: info.coberturaTotal.total,
        percentual: info.coberturaTotal.total > 0 ? info.coberturaTotal.contatos / info.coberturaTotal.total : 0,
        bateuMeta: (info.coberturaTotal.total > 0 ? info.coberturaTotal.contatos / info.coberturaTotal.total : 0) >= 0.25,
        clientesContatados: [],
        clientesSemContato: [],
        acumuladoMes: 0,
      };
      return {
        name,
        score: avgScore,
        penalties: info.penalties,
        cobertura: fakeCob,
      };
    }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }, [onboardingList, ongoingList]);

  return (
    <main className="min-h-screen bg-[#F5F7FA] md:ml-20">
      <header className="sticky top-0 z-30 border-b border-[#DCE5EE] bg-white px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9] text-[#008F00]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-[#001F3F]">{PERFORMANCE_TITLE}</h1>
              <span className="rounded-md border border-[#DCE5EE] bg-[#F8FAFC] px-2 py-1 text-xs font-semibold text-[#52677A]">
                Semana vigente: <span className="text-[#001F3F]">{getCurrentWeekLabel()}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSimulationActive((active) => !active)}
              aria-pressed={simulationActive}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${simulationActive ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
              title={simulationActive ? 'Desfaz a simulação e restaura as notas anteriores' : 'Simula -8 pontos para analistas com cobertura abaixo de 25%'}
            >
              {simulationActive ? 'Desfazer Simulação' : 'Simular Fechamento Sexta (-8 pts)'}
            </button>
            <button type="button" onClick={() => { void fetchData(); void refetchScores(); }} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-[#C8D4E0] bg-white px-3 py-2 text-sm font-semibold text-[#24435C] transition hover:bg-[#F4F8FB] disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar dados
            </button>
          </div>
        </div>
      </header>

      <section className="p-3 md:p-4">
        {loading && !data ? (
          <div className="rounded-2xl border border-[#DCE5EE] bg-white px-6 py-16 text-center shadow-sm">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#1683E8]" />
            <p className="mt-3 text-sm font-medium text-[#64748B]">Carregando ranking e pontuações...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-700">
            Não foi possível carregar o ranking. Tente atualizar novamente.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <RankingColumn title="Ongoing" subtitle={`${ongoingList.length} analista(s)`} analysts={ongoingList} accent="#7C3AED" softAccent="#F0EAFE" />
            <RankingColumn title="Onboarding" subtitle={`${onboardingList.length} analista(s)`} analysts={onboardingList} accent="#1683E8" softAccent="#E8F3FF" />
            <RankingColumn title="Geral" subtitle={`${generalList.length} analista(s)`} analysts={generalList} accent="#008F5A" softAccent="#E7F8EF" />
          </div>
        )}
      </section>
    </main>
  );
}
