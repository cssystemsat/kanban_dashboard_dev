import { useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import { useKanbanData } from "@/hooks/useKanbanData";

export default function Timeline({
  sidebarExpanded = false,
}: {
  sidebarExpanded?: boolean;
}) {
  const { data: clients, loading, error } = useKanbanData();
  const [selectedClientId, setSelectedClientId] = useState("");
  const sidebarOffsetClass = sidebarExpanded ? "md:ml-[200px]" : "md:ml-20";

  const sortedClients = useMemo(
    () =>
      [...clients].sort((first, second) =>
        first.nome.localeCompare(second.nome, "pt-BR", {
          sensitivity: "base",
        })
      ),
    [clients]
  );

  return (
    <main
      className={`${sidebarOffsetClass} min-h-screen bg-[#F5F7FA] px-6 py-8 text-[#001F3F]`}
    >
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-[#E0E8F0] bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#001F3F] text-white">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A5F7F]">
              Acompanhamento de cliente
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Timeline</h1>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              Selecione um cliente da aba Marcos para iniciar o acompanhamento
              da linha do tempo.
            </p>
          </div>
        </div>

        <div className="mt-8 max-w-xl">
          <label
            htmlFor="timeline-client"
            className="mb-2 block text-sm font-semibold text-[#374151]"
          >
            Cliente
          </label>
          <select
            id="timeline-client"
            value={selectedClientId}
            onChange={event => setSelectedClientId(event.target.value)}
            disabled={loading || !!error}
            className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition-colors focus:border-[#001F3F] focus:ring-2 focus:ring-[#001F3F]/10 disabled:cursor-not-allowed disabled:bg-[#F3F4F6]"
          >
            <option value="">
              {loading ? "Carregando clientes..." : "Selecione um cliente..."}
            </option>
            {sortedClients.map(client => (
              <option key={client.id} value={client.id}>
                {client.nome}
              </option>
            ))}
          </select>

          {error && (
            <p className="mt-2 text-sm text-red-600">
              Não foi possível carregar os clientes da aba Marcos.
            </p>
          )}
          {!loading && !error && sortedClients.length === 0 && (
            <p className="mt-2 text-sm text-[#6B7280]">
              Nenhum cliente disponível na aba Marcos.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
