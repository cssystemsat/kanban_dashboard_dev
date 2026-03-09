import { Construction, Rocket } from "lucide-react";

export default function Painel() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: '#1D4ED8' }}>
            <Rocket className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3" style={{ color: '#111827' }}>
          Painel
        </h1>
        <p className="text-base mb-8" style={{ color: '#6B7280' }}>
          Esta seção está em construção e em breve trará novidades para a equipe.
        </p>
        <div className="rounded-2xl p-6 flex items-center gap-4 shadow-sm"
          style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
          <Construction className="w-8 h-8 shrink-0" style={{ color: '#D97706' }} />
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: '#92400E' }}>Em construção</p>
            <p className="text-xs mt-0.5" style={{ color: '#B45309' }}>
              Funcionalidades serão adicionadas em breve. Fique atento às atualizações!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
