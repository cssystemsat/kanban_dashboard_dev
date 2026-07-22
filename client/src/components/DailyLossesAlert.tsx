import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface ClienteLoss {
  cliente: string;
  qtdPerdida: number;
  percentual: string;
  data: string;
}

interface DailyLossesAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyLossesAlert({ open, onOpenChange }: DailyLossesAlertProps) {
  const [clientes, setClientes] = useState<ClienteLoss[]>([]);
  const [datas, setDatas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const updateLastAlert = trpc.config.updateLastDailyAlert.useMutation();
  const getDailyLosses = trpc.urs.getDailyLossesAlert.useQuery({ csvData: '' }, { enabled: false });

  // Buscar dados da planilha
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    // Chamar procedure via fetch direto para contornar CORS
    fetch('/api/trpc/urs.getDailyLossesAlert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { csvData: '' } }),
    })
      .then(r => r.json())
      .then(result => {
        if (result.result?.data?.success) {
          setClientes(result.result.data.clientes);
          setDatas(result.result.data.datas);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('[DailyLossesAlert] Erro ao buscar dados:', error);
        setLoading(false);
      });
  }, [open, getDailyLosses]);

  const handleClose = () => {
    updateLastAlert.mutate(undefined, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>📊 Perdas de ontem para hoje:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClose()}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum cliente com perda de placas nos últimos dias. Ótima notícia! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {datas.length > 0 ? `Comparação entre ${datas.join(' e ')}` : 'Carregando...'}
            </p>

            <div className="space-y-2">
              {clientes.map((cliente, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-red-200 bg-red-50 rounded-lg flex justify-between items-center hover:bg-red-100 transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{cliente.cliente}</p>
                    <p className="text-sm text-gray-600">{cliente.data}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">-{cliente.qtdPerdida}</p>
                    <p className="text-sm text-red-500">{cliente.percentual}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-900">
                💡 <strong>Dica:</strong> Verifique com estes clientes para entender as causas das perdas.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => handleClose()}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
