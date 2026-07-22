import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

interface LossEntry {
  cliente: string;
  perda: number;
  qtdAtual: string;
  percentual: string;
}

/**
 * Modal de aviso de perdas de URs.
 * Aparece automaticamente na primeira entrada do dia.
 * Mostra clientes que perderam placas de ontem para hoje.
 */
export function DailyLossesAlert() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Verificar se já viu hoje
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastSeen = localStorage.getItem('dailyLossesAlertLastSeen');
    if (lastSeen !== today) {
      setShow(true);
    }
  }, []);

  // Buscar dados apenas quando o modal deve ser exibido
  const { data, isLoading } = trpc.dailyLosses.getAlert.useQuery(undefined, {
    enabled: show && !dismissed,
  });

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('dailyLossesAlertLastSeen', today);
    setDismissed(true);
    setShow(false);
  };

  if (!show || dismissed) return null;
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full" />
            <span className="text-gray-700">Verificando perdas de URs...</span>
          </div>
        </div>
      </div>
    );
  }

  // Se não há perdas, fechar automaticamente
  if (data && data.count === 0) {
    return null;
  }

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-red-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">&#9888;</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Perdas de URs &#8212; Ontem para Hoje</h2>
              <p className="text-sm text-gray-600">
                {data.count} cliente{data.count !== 1 ? 's' : ''} com perda &middot; Total: <span className="font-semibold text-red-600">{data.totalPerdas} URs</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wider">
                <th className="pb-2 pr-3">Cliente</th>
                <th className="pb-2 pr-3 text-right">Perda</th>
                <th className="pb-2 pr-3 text-right">Qtd Atual</th>
                <th className="pb-2 text-right">% Perdida</th>
              </tr>
            </thead>
            <tbody>
              {data.losses.map((loss: LossEntry, i: number) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-red-50/50">
                  <td className="py-2 pr-3 font-medium text-gray-900">{loss.cliente}</td>
                  <td className="py-2 pr-3 text-right font-semibold text-red-600">{loss.perda}</td>
                  <td className="py-2 pr-3 text-right text-gray-600">{loss.qtdAtual}</td>
                  <td className="py-2 text-right text-red-600">{loss.percentual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={handleDismiss}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
