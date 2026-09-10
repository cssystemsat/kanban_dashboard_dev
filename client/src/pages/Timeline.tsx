import { useEffect, useMemo, useState } from "react";
import { Loader2, Milestone, UserRound } from "lucide-react";
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

type TimelineEvent = FriccaoEvent & {
  day: string;
  daysSincePrevious?: number;
};

function formatElapsedDays(days: number): string {
  if (days === 0) return "No mesmo dia";
  return days === 1 ? "1 dia" : `${days} dias`;
}

const TAG_LEGEND = [
  { label: "Operação", color: "#2563EB" },
  { label: "Migração", color: "#16A34A" },
  { label: "Fricção", color: "#EAB308" },
  { label: "Sugestão de desenvolvimento", color: "#D1D5DB" },
  { label: "Travamento", color: "#FCA5A5" },
  { label: "Problema", color: "#991B1B" },
] as const;

function normalizeTag(tag: string): string {
  return tag
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getTagColor(tag: string): string {
  const normalizedTag = normalizeTag(tag);

  switch (normalizedTag) {
    case "operacao":
      return "#2563EB";
    case "migracao":
      return "#16A34A";
    case "friccao":
      return "#EAB308";
    case "sugestao de desenvolvimento":
    case "sugestao":
      return "#D1D5DB";
    case "travamento":
      return "#FCA5A5";
    case "problema":
      return "#991B1B";
    default:
      return "#2845B8";
  }
}

function chunkEvents(events: TimelineEvent[], size: number) {
  return Array.from({ length: Math.ceil(events.length / size) }, (_, index) =>
    events.slice(index * size, index * size + size)
  );
}

export default function Timeline({
  sidebarExpanded = false,
}: {
  sidebarExpanded?: boolean;
}) {
  const { data: clients, loading, error, fetchData } = useKanbanData();
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [openEventKey, setOpenEventKey] = useState<string | null>(null);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);
  const sidebarOffsetClass = sidebarExpanded ? "md:ml-[200px]" : "md:ml-20";
  const availableWidthClass = sidebarExpanded
    ? "md:w-[calc(100%-200px)]"
    : "md:w-[calc(100%-80px)]";
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
    ).filter(
      event =>
        !selectedTag || normalizeTag(event.tag) === normalizeTag(selectedTag)
    );
    const grouped = new Map<string, FriccaoEvent[]>();
    for (const event of events) {
      const dayEvents = grouped.get(event.date) ?? [];
      dayEvents.push(event);
      grouped.set(event.date, dayEvents);
    }

    return [...grouped.entries()].sort(
      ([firstDate], [secondDate]) =>
        dateSortValue(firstDate) - dateSortValue(secondDate)
    );
  }, [frictionQuery.data?.csv, selectedClient, selectedTag]);

  const eventRows = useMemo(() => {
    const orderedEvents = eventsByDay.flatMap(([date, events]) =>
      events.map(event => ({ ...event, day: date }))
    );
    const flatEvents: TimelineEvent[] = orderedEvents.map((event, index) => {
      if (index === 0) return event;
      const elapsedDays = Math.max(
        0,
        Math.round(
          (dateSortValue(event.day) -
            dateSortValue(orderedEvents[index - 1].day)) /
            (1000 * 60 * 60 * 24)
        )
      );
      return { ...event, daysSincePrevious: elapsedDays };
    });
    return chunkEvents(flatEvents, 5);
  }, [eventsByDay]);

  return (
    <main
      className={`${sidebarOffsetClass} ${availableWidthClass} min-w-0 min-h-screen overflow-x-hidden bg-[#F5F7FA] px-2 py-3 text-[#001F3F] transition-[width,margin] duration-300 sm:px-4 md:px-5 md:py-4`}
    >
      <section className="w-full rounded-2xl border border-[#DDE6F0] bg-white px-3 py-3 shadow-sm sm:px-5 md:px-6">
        <div className="flex flex-col gap-4 border-b border-[#E7EDF4] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#102A72] text-white shadow-sm">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#536784]">
                Acompanhamento de cliente
              </p>
              <h1 className="text-xl font-bold tracking-tight text-[#102A72] md:text-2xl">
                Timeline
              </h1>
            </div>
          </div>
          <div className="w-full lg:max-w-md">
            <label htmlFor="timeline-client" className="sr-only">
              Cliente
            </label>
            <select
              id="timeline-client"
              value={selectedClientId}
              onChange={event => {
                setSelectedClientId(event.target.value);
                setOpenEventKey(null);
              }}
              disabled={loading || !!error}
              className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2.5 text-sm font-medium text-[#111827] outline-none transition focus:border-[#102A72] focus:ring-2 focus:ring-[#102A72]/10 disabled:cursor-not-allowed disabled:bg-[#F3F4F6]"
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
          </div>
          <div className="w-full lg:max-w-xs">
            <label htmlFor="timeline-tag" className="sr-only">
              Filtrar por Tag
            </label>
            <select
              id="timeline-tag"
              value={selectedTag}
              onChange={event => {
                setSelectedTag(event.target.value);
                setOpenEventKey(null);
              }}
              disabled={!selectedClient || frictionQuery.isLoading}
              className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2.5 text-sm font-medium text-[#111827] outline-none transition focus:border-[#102A72] focus:ring-2 focus:ring-[#102A72]/10 disabled:cursor-not-allowed disabled:bg-[#F3F4F6]"
            >
              <option value="">Todas as Tags</option>
              {TAG_LEGEND.map(tag => (
                <option key={tag.label} value={tag.label}>
                  {tag.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[#E7EDF4] py-2.5 text-[10px] text-[#536784]">
          <span className="font-bold uppercase tracking-[0.12em] text-[#102A72]">
            Tags
          </span>
          {TAG_LEGEND.map(tag => (
            <span
              key={tag.label}
              className="inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full border border-white shadow-[0_0_0_1px_rgba(15,23,42,0.12)]"
                style={{ backgroundColor: tag.color }}
              />
              {tag.label}
            </span>
          ))}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">
            Não foi possível carregar os clientes da aba Marcos.
          </p>
        )}
        {!loading && !error && sortedClients.length === 0 && (
          <p className="mt-3 text-sm text-[#6B7280]">
            Nenhum cliente disponível na aba Marcos.
          </p>
        )}

        {selectedClient && (
          <div className="pt-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Milestone className="h-5 w-5 text-[#102A72]" />
                <h2 className="text-base font-bold text-[#102A72]">
                  Caminho do cliente
                </h2>
              </div>
              {eventRows.length > 0 && (
                <span className="text-xs font-medium text-[#64748B]">
                  {eventRows.flat().length} acontecimentos
                </span>
              )}
            </div>

            {frictionQuery.isLoading && (
              <div className="flex items-center gap-2 py-8 text-sm text-[#6B7280]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando acontecimentos...
              </div>
            )}
            {frictionQuery.error && (
              <p className="py-6 text-sm text-red-600">
                Não foi possível carregar os acontecimentos deste cliente.
              </p>
            )}
            {!frictionQuery.isLoading &&
              !frictionQuery.error &&
              eventRows.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-8 text-center text-sm text-[#6B7280]">
                  {selectedTag
                    ? `Nenhum acontecimento com a Tag “${selectedTag}” para este cliente.`
                    : "Nenhum acontecimento registrado para este cliente."}
                </p>
              )}
            {!frictionQuery.isLoading &&
              !frictionQuery.error &&
              eventRows.length > 0 && (
                <div className="space-y-0 overflow-visible pb-2">
                  {eventRows.map((row, rowIndex) => {
                    const isReversed = rowIndex % 2 === 1;
                    const displayRow = isReversed ? [...row].reverse() : row;
                    const transitionEvent = eventRows[rowIndex + 1]?.[0];
                    return (
                      <div
                        key={`timeline-row-${rowIndex}`}
                        className="relative min-h-[150px] px-1 py-3 sm:px-3"
                      >
                        {rowIndex === 0 && (
                          <div className="absolute left-0 top-[34px] z-20 hidden flex-col items-center gap-1 xl:flex">
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#536784]">
                              Início
                            </span>
                            <span className="h-4 w-4 rounded-full border-4 border-white bg-[#F4B942] shadow-[0_0_0_3px_#FDECC2]" />
                          </div>
                        )}
                        <div className="absolute left-6 right-6 top-[52px] hidden h-1 rounded-full bg-[#D9E4F3] xl:block" />
                        {rowIndex < eventRows.length - 1 && (
                          <>
                            <div
                              className={`${isReversed ? "left-2 rounded-bl-[42px] border-b-4 border-l-4" : "right-2 rounded-br-[42px] border-b-4 border-r-4"} absolute bottom-[-52px] top-[52px] hidden border-[#D9E4F3] xl:block`}
                            />
                            {transitionEvent?.daysSincePrevious !==
                              undefined && (
                              <span
                                className={`pointer-events-none absolute top-[104px] z-20 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-[#D9E4F3] bg-white px-2 py-0.5 text-[9px] font-bold text-[#536784] shadow-sm xl:block ${isReversed ? "left-2 -translate-x-1/2" : "right-2 translate-x-1/2"}`}
                              >
                                {formatElapsedDays(
                                  transitionEvent.daysSincePrevious
                                )}
                              </span>
                            )}
                          </>
                        )}
                        <div className="relative grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 sm:gap-x-4 xl:grid-cols-5 xl:gap-5">
                          {displayRow.map((event, index) => {
                            const eventKey = `${event.day}-${event.title}-${rowIndex}-${index}`;
                            const isOpen = openEventKey === eventKey;
                            const detailsId = `friccao-details-${rowIndex}-${index}`;
                            return (
                              <div
                                key={eventKey}
                                className="relative flex min-w-0 flex-col items-center text-center"
                              >
                                <span className="mb-2 text-[11px] font-bold text-[#536784]">
                                  {event.day}
                                </span>
                                <div
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
                                  className={`relative z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-4 border-white ring-4 ${isOpen ? "ring-[#FDECC2]" : "ring-[#E8EEFF]"} outline-none transition hover:scale-105 focus:ring-4 focus:ring-[#AFC2FF]`}
                                  style={{
                                    backgroundColor: getTagColor(event.tag),
                                  }}
                                >
                                  <span className="sr-only">
                                    {isOpen ? "Fechar" : "Abrir"} detalhes:{" "}
                                    {event.title}
                                  </span>
                                </div>
                                {event.daysSincePrevious !== undefined &&
                                  ((!isReversed && index > 0) ||
                                    (isReversed &&
                                      index < displayRow.length - 1)) && (
                                    <span
                                      className={`pointer-events-none absolute top-[36px] z-20 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-[#D9E4F3] bg-white px-2 py-0.5 text-[9px] font-bold text-[#536784] shadow-sm xl:block ${isReversed ? "-right-[0.625rem] translate-x-1/2" : "-left-[0.625rem] -translate-x-1/2"}`}
                                    >
                                      {formatElapsedDays(
                                        event.daysSincePrevious
                                      )}
                                    </span>
                                  )}
                                <p className="mt-3 line-clamp-3 max-w-[150px] text-xs font-semibold leading-4 text-[#233B72]">
                                  {event.title}
                                </p>
                                <div
                                  id={detailsId}
                                  className={`${isOpen ? "block" : "hidden"} mt-3 w-full max-w-[220px] break-words rounded-xl border border-[#CBD5E1] bg-[#102A72] p-3 text-left text-[11px] leading-4 text-white shadow-xl`}
                                >
                                  <p className="mb-2 text-xs font-bold">
                                    Detalhes do acontecimento
                                  </p>
                                  <p>
                                    <strong className="text-[#B9D7F5]">
                                      Setor:
                                    </strong>{" "}
                                    {event.sector}
                                  </p>
                                  <p>
                                    <strong className="text-[#B9D7F5]">
                                      Tag:
                                    </strong>{" "}
                                    {event.tag}
                                  </p>
                                  <p>
                                    <strong className="text-[#B9D7F5]">
                                      Descrição:
                                    </strong>{" "}
                                    {event.description}
                                  </p>
                                  <p>
                                    <strong className="text-[#B9D7F5]">
                                      CSM:
                                    </strong>{" "}
                                    {event.csm}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}
      </section>
    </main>
  );
}
