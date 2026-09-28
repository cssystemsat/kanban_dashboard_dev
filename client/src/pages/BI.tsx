import { BarChart3, Construction } from "lucide-react";

export default function BI() {
  return (
    <main className="ml-20 min-h-screen bg-[#F5F7FA] px-6 py-8 text-[#001F3F]">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1D4ED8] text-white shadow-sm">
            <BarChart3 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Inteligência financeira
            </p>
            <h1 className="text-3xl font-bold tracking-tight">BI</h1>
          </div>
        </header>

        <section className="mt-10 flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
          <Construction className="h-10 w-10 text-[#1D4ED8]" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-[#001F3F]">
            Área de BI preparada
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Esta aba está pronta para receber os indicadores financeiros e as
            análises de produtos dos clientes.
          </p>
        </section>
      </div>
    </main>
  );
}
