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
 * - Fechar (X): desaparece temporariamente, reaparece ao trocar de aba
 * - Marcar "Ciente" + Confirmar: desaparece permanentemente por hoje
 */
export function DailyLossesAlert() {
  const [show, setShow] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isCiente, setIsCiente] = useState(false);

  // Data de hoje em formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const storageKey = `losses_dismissed_${today}`;

  // Verificar se já marcou como ciente hoje (permanente)
  const { data: acknowledged } = trpc.dailyLosses.checkAcknowledged.useQuery(
    { acknowledgedDate: today },
    { enabled: !isAcknowledged }
  );

  // Buscar dados apenas quando o modal deve ser exibido
  const { data, isLoading } = trpc.dailyLosses.getAlert.useQuery(undefined, {
    enabled: show && !isAcknowledged && !acknowledged,
  });

  // Mutation para marcar como ciente
  const markAcknowledged = trpc.dailyLosses.markAsAcknowledged.useMutation();

  // Verificar status ao carregar
  useEffect(() => {
    if (acknowledged === true) {
      // Já marcou como ciente hoje - não mostrar
      setIsAcknowledged(true);
      setShow(false);
      localStorage.removeItem(storageKey);
    } else if (acknowledged === false) {
      // Ainda não marcou como ciente
      // Verificar se foi dismissido temporariamente
      const wasDismissed = localStorage.getItem(storageKey) === 'true';
      setShow(!wasDismissed);
    }
  }, [acknowledged, storageKey]);

  // Fechar temporariamente (X button)
  const handleTemporaryClose = () => {
    setShow(false);
    localStorage.setItem(storageKey, 'true');
  };

  // Confirmar "Ciente" (permanente)
  const handleConfirm = async () => {
    if (!isCiente) return;
    try {
      await markAcknowledged.mutateAsync({ acknowledgedDate: today });
      setIsAcknowledged(true);
      setShow(false);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Erro ao marcar como ciente:', error);
    }
  };

  if (!show || isAcknowledged) return null;
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
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 text-xl">&#9888;</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Perdas de URs &#8212; Ontem para Hoje</h2>
              <p className="text-sm text-gray-600">
                {data.count} cliente{data.count !== 1 ? 's' : ''} com perda &middot; Total: <span className="font-semibold text-red-600">{data.totalPerdas} URs</span>
              </p>
            </div>
          </div>
          {/* Botão fechar (X) - temporário */}
          <button
            onClick={handleTemporaryClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0"
            title="Fechar temporariamente (reaparece ao trocar de aba)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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

        {/* Footer com Checkbox */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isCiente}
              onChange={(e) => setIsCiente(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Estou ciente das perdas acima
            </span>
          </label>
          <button
            onClick={handleConfirm}
            disabled={!isCiente || markAcknowledged.isPending}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${
              isCiente && !markAcknowledged.isPending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {markAcknowledged.isPending ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
