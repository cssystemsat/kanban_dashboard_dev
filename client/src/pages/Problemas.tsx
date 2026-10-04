import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Filter,
  LoaderCircle,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { filterProblemCards } from "@/lib/problemasFilters";

const STAGES = [
  { id: "nova_flag", label: "Nova Flag", accent: "border-l-amber-400" },
  { id: "plano_acao_feito", label: "Plano de ação feito", accent: "border-l-sky-500" },
  { id: "em_tratativa", label: "Em tratativa", accent: "border-l-violet-500" },
  { id: "precisa_escalonar", label: "Precisa escalonar", accent: "border-l-rose-500" },
  { id: "fora_do_setor", label: "Fora do setor", accent: "border-l-slate-500" },
  { id: "resolvida", label: "Resolvida", accent: "border-l-emerald-500" },
] as const;

type ProblemStage = (typeof STAGES)[number]["id"];

export const PROBLEM_FLAG_OPTIONS = [
  { value: "", label: "Todas as flags" },
  { value: "Yellow Flag", label: "Yellow" },
  { value: "Red Flag", label: "Red" },
  { value: "Black Flag", label: "Black" },
] as const;

type ProblemFlagFilter = (typeof PROBLEM_FLAG_OPTIONS)[number]["value"];

type ProblemasCard = {
  id: number;
  clientKey: string;
  clientName: string;
  boleto: string;
  comercial: string;
  csm: string;
  flag: string;
  stage: ProblemStage;
  problem: string | null;
  actionPlan: string | null;
  dueDate: string | null;
  responsible: string | null;
  updatedAt: string | Date;
};

type Draft = {
  problem: string;
  actionPlan: string;
  dueDate: string;
  responsible: string;
};

const EMPTY_DRAFT: Draft = {
  problem: "",
  actionPlan: "",
  dueDate: "",
  responsible: "",
};

function flagClass(flag: string) {
  const normalized = flag.toLowerCase();
  if (normalized.includes("black")) return "bg-slate-900 text-white";
  if (normalized.includes("red")) return "bg-red-600 text-white";
  return "bg-amber-100 text-amber-800 ring-1 ring-amber-300";
}

function formatUpdated(value: string | Date) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function Problemas() {
  const utils = trpc.useUtils();
  const [draggedCard, setDraggedCard] = useState<ProblemasCard | null>(null);
  const [selectedCard, setSelectedCard] = useState<ProblemasCard | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [selectedCSM, setSelectedCSM] = useState("");
  const [selectedFlag, setSelectedFlag] = useState<ProblemFlagFilter>("");
  const initialSyncDone = useRef(false);

  const cardsQuery = trpc.problemas.list.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  const syncMutation = trpc.problemas.syncFromMarcos.useMutation();
  const moveMutation = trpc.problemas.move.useMutation();
  const updateMutation = trpc.problemas.update.useMutation();

  const cards = (cardsQuery.data ?? []) as ProblemasCard[];
  const csmOptions = useMemo(
    () =>
      Array.from(
        new Set(cards.map(card => card.csm.trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [cards]
  );
  const visibleCards = useMemo(
    () => filterProblemCards(cards, selectedCSM, selectedFlag),
    [cards, selectedCSM, selectedFlag]
  );

  const refreshFromMarcos = async (notify = true) => {
    try {
      const result = await syncMutation.mutateAsync();
      await utils.problemas.list.invalidate();
      if (notify) {
        toast(
          result.created > 0
            ? `${result.created} novo(s) problema(s) identificado(s).`
            : "Flags sincronizadas com a aba Marcos."
        );
      }
    } catch (error) {
      console.error("Erro ao sincronizar Problemas:", error);
      if (notify) toast.error("Não foi possível atualizar as flags de Marcos.");
    }
  };

  // Cada entrada na aba verifica a planilha. O ref evita chamadas duplicadas
  // durante uma mesma montagem em modo de desenvolvimento.
  useEffect(() => {
    if (initialSyncDone.current) return;
    initialSyncDone.current = true;
    void refreshFromMarcos(false);
    // A sincronização é intencionalmente executada apenas na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCard = (card: ProblemasCard) => {
    setSelectedCard(card);
    setDraft({
      problem: card.problem ?? "",
      actionPlan: card.actionPlan ?? "",
      dueDate: card.dueDate ?? "",
      responsible: card.responsible ?? "",
    });
  };

  const saveCard = async () => {
    if (!selectedCard) return;
    try {
      await updateMutation.mutateAsync({
        cardId: selectedCard.id,
        problem: draft.problem.trim(),
        actionPlan: draft.actionPlan.trim(),
        dueDate: draft.dueDate || null,
        responsible: draft.responsible.trim(),
      });
      await utils.problemas.list.invalidate();
      toast.success("Dados do problema atualizados.");
      setSelectedCard(null);
    } catch (error) {
      console.error("Erro ao salvar problema:", error);
      toast.error("Não foi possível salvar os dados do problema.");
    }
  };

  const moveCard = async (card: ProblemasCard, stage: ProblemStage) => {
    if (card.stage === stage) return;
    try {
      await moveMutation.mutateAsync({ cardId: card.id, stage });
      await utils.problemas.list.invalidate();
      toast.success("Card movido no Kanban.");
    } catch (error) {
      console.error("Erro ao mover problema:", error);
      toast.error("Não foi possível mover o card.");
    } finally {
      setDraggedCard(null);
    }
  };

  return (
    <main className="min-h-screen min-w-0 overflow-x-hidden bg-[#F5F7FA] px-3 py-3 text-[#001F3F] sm:px-4 lg:px-5 md:ml-20">
      <section className="mx-auto flex w-full max-w-[1920px] min-w-0 flex-col gap-3">
        <header className="sticky top-0 z-10 min-w-0 rounded-2xl border border-slate-200 bg-[#F5F7FA]/95 p-2.5 shadow-sm backdrop-blur sm:p-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter className="h-4 w-4 text-red-600" aria-hidden="true" />
              Filtros
            </div>
            <div className="flex min-w-[220px] flex-1 basis-[240px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold tracking-tight text-slate-900">
                  Problemas
                </h1>
                <p className="truncate text-[11px] text-slate-500">
                  Flags da aba Marcos
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">
                CSM
              </span>
              <select
                value={selectedCSM}
                onChange={event => setSelectedCSM(event.target.value)}
                className="min-w-[150px] max-w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                aria-label="Filtrar problemas por CSM"
              >
                <option value="">Todos os CSMs</option>
                {csmOptions.map(csm => (
                  <option key={csm} value={csm}>
                    {csm}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">
                Flag
              </span>
              <select
                value={selectedFlag}
                onChange={event =>
                  setSelectedFlag(event.target.value as ProblemFlagFilter)
                }
                className="min-w-[145px] max-w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                aria-label="Filtrar problemas por tipo de flag"
              >
                {PROBLEM_FLAG_OPTIONS.map(option => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500 xl:ml-auto">
              <span className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2">
                {visibleCards.length} de {cards.length} cards
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void refreshFromMarcos()}
                disabled={syncMutation.isPending}
                className="h-9 gap-1.5 border-slate-300 text-xs"
              >
                {syncMutation.isPending ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Atualizar flags
              </Button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
            <span>Kanban compartilhado · Yellow, Red e Black</span>
            <span>
              {selectedCSM || selectedFlag
                ? "Filtros aplicados"
                : "Todos os problemas ativos"}
            </span>
          </div>
        </header>

        {cardsQuery.isLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Carregando problemas...
          </div>
        ) : cardsQuery.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Não foi possível carregar os problemas. Atualize a página e tente novamente.
          </div>
        ) : (
          <div className="grid min-h-[calc(100vh-185px)] auto-rows-fr grid-cols-1 gap-2 sm:grid-cols-2 lg:h-[calc(100vh-185px)] lg:min-h-0 lg:grid-cols-3 2xl:grid-cols-6">
            {STAGES.map(stage => {
              const stageCards = visibleCards.filter(card => card.stage === stage.id);
              return (
                <section
                  key={stage.id}
                  className={`flex min-h-[280px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 border-l-4 bg-white shadow-sm ${stage.accent} lg:min-h-0 ${
                    draggedCard && draggedCard.stage !== stage.id
                      ? "ring-2 ring-blue-200"
                      : ""
                  }`}
                  onDragOver={event => event.preventDefault()}
                  onDrop={() => {
                    if (draggedCard) void moveCard(draggedCard, stage.id);
                  }}
                >
                  <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="truncate text-xs font-semibold text-slate-700">
                        {stage.label}
                      </h2>
                      <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
                        {stageCards.length}
                      </span>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50/40 p-2">
                    {stageCards.map(card => (
                      <article
                        key={card.id}
                        draggable
                        onDragStart={event => {
                          setDraggedCard(card);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDraggedCard(null)}
                        onClick={() => openCard(card)}
                        className={`cursor-pointer rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${
                          draggedCard?.id === card.id ? "opacity-45" : ""
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-xs font-semibold leading-4 text-slate-900">
                            {card.clientName}
                          </h3>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${flagClass(card.flag)}`}
                          >
                            {card.flag.replace(" Flag", "")}
                          </span>
                        </div>

                        <p className="mb-2 line-clamp-2 min-h-8 text-[11px] leading-4 text-slate-600">
                          {card.problem?.trim() || "Clique para registrar o problema."}
                        </p>

                        <dl className="space-y-1 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                          <div className="flex items-center gap-1.5 truncate">
                            <CircleDollarSign className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{card.boleto || "Boleto não informado"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <UserRound className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">CSM: {card.csm || "Não informado"}</span>
                          </div>
                          <div className="truncate pl-[18px]">Comercial: {card.comercial || "Não informado"}</div>
                        </dl>

                        {card.dueDate && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-violet-700">
                            <CalendarDays className="h-3 w-3" />
                            Prazo: {new Date(`${card.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </article>
                    ))}
                    {stageCards.length === 0 && (
                      <p className="px-1 py-5 text-center text-[11px] text-slate-400">
                        Nenhum card nesta etapa.
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <Dialog
        open={selectedCard !== null}
        onOpenChange={open => {
          if (!open) setSelectedCard(null);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          {selectedCard && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3 pr-6">
                  <span className={`mt-0.5 rounded-full px-2 py-1 text-[10px] font-bold ${flagClass(selectedCard.flag)}`}>
                    {selectedCard.flag}
                  </span>
                  <div>
                    <DialogTitle>{selectedCard.clientName}</DialogTitle>
                    <DialogDescription className="mt-1">
                      CSM: {selectedCard.csm || "Não informado"} · Comercial: {selectedCard.comercial || "Não informado"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Boleto</span>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">{selectedCard.boleto || "Não informado"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Última atualização</span>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">{formatUpdated(selectedCard.updatedAt)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-800">Relato do problema</span>
                  <Textarea
                    value={draft.problem}
                    onChange={event => setDraft(current => ({ ...current, problem: event.target.value }))}
                    placeholder="Descreva o problema identificado nesta central..."
                    className="min-h-24 resize-y bg-white"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-800">Plano de ação</span>
                  <Textarea
                    value={draft.actionPlan}
                    onChange={event => setDraft(current => ({ ...current, actionPlan: event.target.value }))}
                    placeholder="Registre as ações combinadas para tratar o problema..."
                    className="min-h-24 resize-y bg-white"
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-800">Prazo</span>
                    <Input
                      type="date"
                      value={draft.dueDate}
                      onChange={event => setDraft(current => ({ ...current, dueDate: event.target.value }))}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-800">Responsável</span>
                    <Input
                      value={draft.responsible}
                      onChange={event => setDraft(current => ({ ...current, responsible: event.target.value }))}
                      placeholder="Nome do responsável"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                Ao mover para <strong>Resolvida</strong>, o card continua visível como lembrete. Remova a flag diretamente da planilha Marcos para encerrá-lo definitivamente.
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.filter(stage => stage.id !== selectedCard.stage).map(stage => (
                    <Button
                      key={stage.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-[11px]"
                      disabled={moveMutation.isPending}
                      onClick={() => void moveCard(selectedCard, stage.id)}
                    >
                      {stage.label}
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void saveCard()}
                  disabled={updateMutation.isPending}
                  className="h-8 gap-1.5"
                >
                  {updateMutation.isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Salvar dados
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
