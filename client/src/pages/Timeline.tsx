import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Info, Loader2, UserRound } from "lucide-react";
import { useKanbanData } from "@/hooks/useKanbanData";
import { trpc } from "@/lib/trpc";

const FRICCOES_GID = 594161358;

type FriccaoEvent = {
  date: string;
  title: string;
  sector: string;
  tag: string;
  description: string;
  csm: string;
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current.trim());
  return values;
}

function parseFriccaoEvents(csv: string, clientName: string): FriccaoEvent[] {
  const normalizedClient = clientName.trim().toLocaleLowerCase("pt-BR");
  return csv
    .split(/\r?\n/)
    .slice(1)
    .map(parseCsvLine)
    .filter(row => {
      const central = row[0]?.trim().toLocaleLowerCase("pt-BR");
      return Boolean(
        central && central === normalizedClient && row[1] && row[2]
      );
    })
    .map(row => ({
      date: row[1].trim(),
      title: row[2].trim(),
      sector: row[3]?.trim() || "Não informado",
      tag: row[4]?.trim() || "Não informado",
      description: row[5]?.trim() || "Não informado",
      csm: row[6]?.trim() || "Não informado",
    }));
}

function dateSortValue(date: string): number {
  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return 0;
  return new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1])
  ).getTime();
}

export default function Timeline({
  sidebarExpanded = false,
}: {
  sidebarExpanded?: boolean;
}) {
  const { data: clients, loading, error, fetchData } = useKanbanData();
  const [selectedClientId, setSelectedClientId] = useState("");
  const [openEventKey, setOpenEventKey] = useState<string | null>(null);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);
  const sidebarOffsetClass = sidebarExpanded ? "md:ml-[200px]" : "md:ml-20";
  const selectedClient = clients.find(client => client.id === selectedClientId);
  const frictionQuery = trpc.sheets.csv.useQuery(
    { source: "primary", gid: FRICCOES_GID },
    { enabled: Boolean(selectedClient) }
  );

  const sortedClients = useMemo(
    () =>
      [...clients].sort((first, second) =>
        first.nome.localeCompare(second.nome, "pt-BR", {
          sensitivity: "base",
        })
      ),
    [clients]
  );

  const eventsByDay = useMemo(() => {
    if (!selectedClient || !frictionQuery.data?.csv) return [];

    const events = parseFriccaoEvents(
      frictionQuery.data.csv,
      selectedClient.nome
    );
    const grouped = new Map<string, FriccaoEvent[]>();
    for (const event of events) {
      const dayEvents = grouped.get(event.date) ?? [];
      dayEvents.push(event);
      grouped.set(event.date, dayEvents);
    }

    return [...grouped.entries()].sort(
      ([firstDate], [secondDate]) =>
        dateSortValue(secondDate) - dateSortValue(firstDate)
    );
  }, [frictionQuery.data?.csv, selectedClient]);

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
              Selecione um cliente da aba Marcos para visualizar os
              acontecimentos registrados por dia.
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

        {selectedClient && (
          <div className="mt-8 border-t border-[#E5E7EB] pt-6">
            <div className="mb-5 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#001F3F]" />
              <h2 className="text-lg font-semibold">Acontecimentos</h2>
            </div>

            {frictionQuery.isLoading && (
              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando acontecimentos...
              </div>
            )}
            {frictionQuery.error && (
              <p className="text-sm text-red-600">
                Não foi possível carregar os acontecimentos deste cliente.
              </p>
            )}
            {!frictionQuery.isLoading &&
              !frictionQuery.error &&
              eventsByDay.length === 0 && (
                <p className="text-sm text-[#6B7280]">
                  Nenhum acontecimento registrado para este cliente.
                </p>
              )}
            {!frictionQuery.isLoading &&
              !frictionQuery.error &&
              eventsByDay.length > 0 && (
                <div className="space-y-6">
                  {eventsByDay.map(([date, events]) => (
                    <div key={date} className="relative pl-7">
                      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-[#DC2626] ring-4 ring-red-50" />
                      <h3 className="text-sm font-bold text-[#001F3F]">
                        {date}
                      </h3>
                      <div className="mt-2 space-y-2 border-l border-[#E5E7EB] pl-4">
                        {events.map((event, index) => {
                          const eventKey = `${date}-${event.title}-${index}`;
                          const isOpen = openEventKey === eventKey;
                          const detailsId = `friccao-details-${index}-${date.replace(/\\D/g, "")}`;
                          return (
                            <div
                              key={eventKey}
                              role="button"
                              tabIndex={0}
                              aria-expanded={isOpen}
                              aria-controls={detailsId}
                              onClick={() =>
                                setOpenEventKey(current =>
                                  current === eventKey ? null : eventKey
                                )
                              }
                              onKeyDown={keyboardEvent => {
                                if (
                                  keyboardEvent.key === "Enter" ||
                                  keyboardEvent.key === " "
                                ) {
                                  keyboardEvent.preventDefault();
                                  setOpenEventKey(current =>
                                    current === eventKey ? null : eventKey
                                  );
                                }
                              }}
                              className="relative cursor-pointer rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-sm text-[#374151] outline-none transition hover:border-[#B8C7D8] focus:border-[#001F3F] focus:ring-2 focus:ring-[#001F3F]/10"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span>{event.title}</span>
                                <Info className="h-4 w-4 shrink-0 text-[#6B7280]" />
                              </div>
                              <div
                                id={detailsId}
                                className={`${isOpen ? "block" : "hidden"} mt-3 rounded-lg border border-[#CBD5E1] bg-[#001F3F] p-4 text-left text-xs text-white shadow-inner`}
                              >
                                <p className="mb-2 text-sm font-semibold text-white">
                                  Detalhes da Fricção
                                </p>
                                <dl className="space-y-1.5 leading-5">
                                  <div>
                                    <dt className="inline font-semibold text-[#B9D7F5]">
                                      Setor:{" "}
                                    </dt>
                                    <dd className="inline">{event.sector}</dd>
                                  </div>
                                  <div>
                                    <dt className="inline font-semibold text-[#B9D7F5]">
                                      Tag:{" "}
                                    </dt>
                                    <dd className="inline">{event.tag}</dd>
                                  </div>
                                  <div>
                                    <dt className="inline font-semibold text-[#B9D7F5]">
                                      Descrição:{" "}
                                    </dt>
                                    <dd className="inline whitespace-pre-wrap">
                                      {event.description}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="inline font-semibold text-[#B9D7F5]">
                                      CSM:{" "}
                                    </dt>
                                    <dd className="inline">{event.csm}</dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </section>
    </main>
  );
}
