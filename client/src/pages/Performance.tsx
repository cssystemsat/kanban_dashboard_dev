import { BarChart3 } from 'lucide-react';

export const PERFORMANCE_TITLE = 'Performance';

export default function Performance() {
  return (
    <main className="min-h-screen md:ml-20 bg-[#F5F7FA]">
      <header className="sticky top-0 z-30 border-b border-[#DCE5EE] bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9] text-[#008F00]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#001F3F]">{PERFORMANCE_TITLE}</h1>
            <p className="text-sm text-[#64748B]">Acompanhamento de desempenho da operação de Customer Success</p>
          </div>
        </div>
      </header>

      <section className="p-6">
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-[#B8C7D9] bg-white shadow-sm">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F0F4F8] text-[#64748B]">
              <BarChart3 className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold text-[#001F3F]">Painel de Performance</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Esta área está pronta para receber os indicadores, metas e análises de performance da equipe.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
