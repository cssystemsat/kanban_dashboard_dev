import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function NewClientsAlert() {
  const { user } = useAuth();
  const [show, setShow] = useState(true);
  const [isCiente, setIsCiente] = useState(false);
  const pendingQuery = trpc.appKanban.pendingNewClients.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: true,
  });
  const acknowledge = trpc.appKanban.acknowledgeNewClients.useMutation({
    onSuccess: () => {
      setShow(false);
      setIsCiente(false);
      void pendingQuery.refetch();
    },
  });

  const clients = pendingQuery.data ?? [];
  const handleConfirm = async () => {
    if (!isCiente || clients.length === 0) return;
    await acknowledge.mutateAsync({ cardIds: clients.map(client => client.id) });
  };

  if (!user || !show || pendingQuery.isLoading || clients.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent">
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b bg-blue-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Novo cliente no Kanban
            </h2>
            <p className="text-sm text-gray-600">
              {clients.length} novo{clients.length !== 1 ? "s" : ""} cliente
              {clients.length !== 1 ? "s" : ""} entrou na etapa Vendido.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Fechar temporariamente"
            aria-label="Fechar temporariamente"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <ul className="divide-y divide-gray-100">
            {clients.map(client => (
              <li key={client.id} className="py-3 flex items-center justify-between gap-4">
                <span className="font-medium text-gray-900">{client.companyName}</span>
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {client.comercial || "Comercial não informado"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isCiente}
              onChange={event => setIsCiente(event.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Estou ciente dos novos clientes
            </span>
          </label>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isCiente || acknowledge.isPending}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${
              isCiente && !acknowledge.isPending
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {acknowledge.isPending ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
