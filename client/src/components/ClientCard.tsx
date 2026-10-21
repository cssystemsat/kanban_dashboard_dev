import { ClientData } from "@/hooks/useKanbanData";
import {
  Calendar,
  Truck,
  AlertCircle,
  DollarSign,
  Flag,
  User,
  Briefcase,
  Heart,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  X,
  Star,
  Phone,
} from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  useAgendaData,
  isAgendaOutdated,
  getDaysSinceUpdate,
} from "@/hooks/useAgendaData";
import { calculateClientCriticality } from "@/lib/criticality";
import { getContactButtonState } from "@/lib/contactStatus";
import { WootricClientHistoryModal } from "./WootricClientHistoryModal";
import { WootricMark } from "./WootricMark";

interface ClientCardProps {
  client: ClientData;
  onAtendimento?: (client: ClientData) => void;
  onFriccao?: (client: ClientData) => void;
}

function getTodayInputDate(): string {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo",
  });
}

function toInputDate(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

function addDaysToBrazilianDate(value: string, days: number): string {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match) return "Não calculado";
  const year = match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);
  const date = new Date(year, Number(match[2]) - 1, Number(match[1]));
  if (Number.isNaN(date.getTime())) return "Não calculado";
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Cor do ícone de bandeira para cada nível */
function getFlagColor(flag: string): string | null {
  switch (flag) {
    case "Red Flag":
      return "#DC2626";
    case "Yellow Flag":
      return "#D97706";
    case "Black Flag":
      return "#1F2937";
    default:
      return null;
  }
}

export default function ClientCard({
  client,
  onAtendimento,
  onFriccao,
}: ClientCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showScoreReasons, setShowScoreReasons] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);
  const [showWootricHistory, setShowWootricHistory] = useState(false);
  const [contactMarkedToday, setContactMarkedToday] = useState(false);
  const [showObjectivePicker, setShowObjectivePicker] = useState(false);
  const subobjectiveQueryInput = useMemo(
    () => ({ clientId: client.id }),
    [client.id]
  );
  const { data: availableObjectives = [] } =
    trpc.marcos.availableObjectives.useQuery(undefined, { staleTime: 60_000 });
  const { data: assignedObjectives = [] } =
    trpc.marcos.objectiveAssignments.useQuery(subobjectiveQueryInput, {
      staleTime: 30_000,
    });
  const utils = trpc.useUtils();
  const invalidateAssignedObjectives = () => {
    void utils.marcos.objectiveAssignments.invalidate(subobjectiveQueryInput);
    void utils.marcos.objectiveAssignmentMetrics.invalidate();
    void utils.marcos.assignedSubobjectiveCompletionMetrics.invalidate();
  };
  const assignObjective = trpc.marcos.assignObjective.useMutation({
    onSuccess: () => {
      invalidateAssignedObjectives();
      toast.success("Objetivo adicionado ao cliente.");
    },
    onError: error => toast.error(`Não foi possível adicionar o objetivo: ${error.message}`),
  });
  const removeObjective = trpc.marcos.removeObjective.useMutation({
    onSuccess: () => {
      invalidateAssignedObjectives();
      toast.success("Objetivo removido do cliente.");
    },
    onError: error => toast.error(`Não foi possível remover o objetivo: ${error.message}`),
  });
  const setAssignedSubobjectiveCompletion = trpc.marcos.setAssignedSubobjectiveCompletion.useMutation({
    onSuccess: () => invalidateAssignedObjectives(),
    onError: error => toast.error(`Não foi possível salvar o subobjetivo: ${error.message}`),
  });
  const markContact = trpc.contato.marcar.useMutation({
    onSuccess: () => {
      setContactMarkedToday(true);
      toast.success(`Contato de ${client.nome} marcado na planilha.`);
    },
    onError: error => toast.error(`Não foi possível marcar o contato: ${error.message}`),
  });
  const contactButton = getContactButtonState(
    contactMarkedToday ? 0 : client.diasUltimoContato
  );
  const objectiveIds = new Set(assignedObjectives.map(objective => objective.objectiveId));
  const objectiveOptions = availableObjectives.filter(
    objective => !objectiveIds.has(objective.id)
  );
  const isOverdue = client.marcoStatus === "atrasado";
  const { entry: agendaEntry, loading: agendaLoading } = useAgendaData(
    client.nome
  );
  const semAtualizacao = isAgendaOutdated(agendaEntry, agendaLoading);
  const diasSemAtualizar = getDaysSinceUpdate(agendaEntry);

  const flagColor = getFlagColor(client.flag);
  const hasFlag = !!flagColor;
  const { score: criticalityScore, signals: criticalitySignals } =
    calculateClientCriticality(client);

  // Verificar se cliente tem >60 dias e <30 placas
  const diasCorridos = parseInt(String(client.diasCorridos || 0));
  const urs = parseInt(String(client.urs || 0));
  const shouldHighlightRedBorder = diasCorridos > 60 && urs < 30;

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.whatsapp) {
      const phone = client.whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${phone}`, "_blank");
    }
  };

  return (
    <div className="relative">
      <div
        className="bg-white rounded-lg border p-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-0.5 shadow-sm cursor-pointer"
        style={{
          borderColor: shouldHighlightRedBorder ? "#DC2626" : "#E0E8F0",
          borderWidth: shouldHighlightRedBorder ? "2px" : "1px",
        }}
      >
        {/* Linha 1: nome (sem truncate, quebra linha) */}
        <div className="flex items-start gap-1 leading-tight">
          {/* Nome — quebra linha, não trunca, alinhado à esquerda */}
          <h3
            className="font-bold text-xs leading-tight flex-1 text-left"
            style={{ color: "#001F3F", wordBreak: "break-word" }}
          >
            {client.nome}
          </h3>

          {/* Pontuação e ganho/perda de URs — canto superior direito */}
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            <button
              type="button"
              className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-400"
              style={{
                backgroundColor:
                  criticalityScore < 40
                    ? "#FEE2E2"
                    : criticalityScore <= 80
                      ? "#FEF3C7"
                      : "#DCFCE7",
                color:
                  criticalityScore < 40
                    ? "#B91C1C"
                    : criticalityScore <= 80
                      ? "#92400E"
                      : "#166534",
              }}
              title="Ver motivos da pontuação"
              aria-label={`Ver motivos da pontuação ${criticalityScore}`}
              onClick={event => {
                event.stopPropagation();
                setShowScoreReasons(value => !value);
              }}
            >
              {criticalityScore}
            </button>
            {(client.ganhoUrs || client.perdaUrs) && (
              <div className="flex flex-col items-end gap-0.5">
                {client.ganhoUrs && (
                  <span
                    className="flex items-center gap-0.5 text-[10px] font-semibold leading-none"
                    style={{ color: "#10B981" }}
                  >
                    <TrendingUp className="w-3 h-3" />+{client.ganhoUrs}
                  </span>
                )}
                {client.perdaUrs && (
                  <span
                    className="flex items-center gap-0.5 text-[10px] font-semibold leading-none"
                    style={{ color: "#EF4444" }}
                  >
                    <TrendingDown className="w-3 h-3" />-{client.perdaUrs}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bandeira + nome da flag + No prazo/Atrasado */}
        <div className="flex items-center gap-0.5 flex-wrap leading-tight">
          {/* Estrela — só se houver flag */}
          {hasFlag && client.estrela && (
            <span title="Destaque">
              <Star
                className="w-3 h-3 fill-current"
                style={{ color: "#F59E0B" }}
              />
            </span>
          )}

          {/* Bandeira + nome da flag */}
          {hasFlag && (
            <span className="flex items-center gap-0.5">
              <Flag
                className="w-3 h-3 fill-current flex-shrink-0"
                style={{ color: flagColor! }}
              />
              <span
                className="text-[10px] font-semibold leading-none"
                style={{ color: flagColor! }}
              >
                {client.flag}
              </span>
            </span>
          )}

          {/* No prazo / Atrasado */}
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none"
            style={{
              backgroundColor: isOverdue ? "#FEE2E2" : "#D1FAE5",
              color: isOverdue ? "#DC2626" : "#059669",
            }}
          >
            {isOverdue ? "Atrasado" : "No prazo"}
          </span>
        </div>

        {/* Entrada com dias corridos */}
        <div className="flex items-center gap-2 text-xs leading-tight">
          <Calendar
            className="w-3 h-3 flex-shrink-0"
            style={{ color: "#00DD00" }}
          />
          <span style={{ color: "#4A5F7F" }}>
            <span className="font-600" style={{ color: "#001F3F" }}>
              {client.entrada}
            </span>
            <span className="ml-1" style={{ color: "#9CA3AF" }}>
              ({client.diasCorridos}d)
            </span>
          </span>
        </div>

        {/* Cidade/Estado */}
        {(client.cidade || client.estado) && (
          <div className="text-xs leading-tight" style={{ color: "#9CA3AF" }}>
            {client.cidade}
            {client.cidade && client.estado ? "/" : ""}
            {client.estado}
          </div>
        )}

        {/* Quantidade de placas + % Desatualizado na mesma linha */}
        <div className="flex items-center gap-2 text-xs leading-tight">
          <Truck
            className="w-3 h-3 flex-shrink-0"
            style={{ color: "#00DD00" }}
          />
          <span className="font-600" style={{ color: "#001F3F" }}>
            {client.urs}
          </span>
          <span style={{ color: "#9CA3AF" }}>|</span>
          <span
            className="font-600"
            style={{
              color:
                (client.percentualDesatualizado || 0) > 30
                  ? "#FF6B6B"
                  : "#4A5F7F",
            }}
          >
            {(client.percentualDesatualizado || 0).toFixed(1)}%
          </span>
          <span style={{ color: "#9CA3AF" }}>desatualizadas</span>
        </div>

        {/* Último contato em dias */}
        {client.diasUltimoContato !== undefined &&
          client.diasUltimoContato >= 0 && (
            <div className="flex items-center gap-2 text-xs leading-tight">
              <Calendar
                className="w-3 h-3 flex-shrink-0"
                style={{ color: "#4A5F7F" }}
              />
              <span style={{ color: "#4A5F7F" }}>
                <span className="font-600" style={{ color: "#001F3F" }}>
                  {client.diasUltimoContato}d
                </span>
                <span className="ml-1" style={{ color: "#9CA3AF" }}>
                  desde último contato
                </span>
              </span>
            </div>
          )}
        {/* Informações de Boleto */}
        {(client.ultimoBoleto || client.consumo || client.deltaConsumo) && (
          <div className="flex flex-col gap-0 text-xs leading-tight">
            {" "}
            {client.ultimoBoleto && (
              <div className="flex items-center gap-2 leading-tight">
                <DollarSign
                  className="w-3 h-3 flex-shrink-0"
                  style={{ color: "#00DD00" }}
                />
                <span style={{ color: "#4A5F7F" }}>
                  <span className="font-600" style={{ color: "#001F3F" }}>
                    Boleto:
                  </span>
                  <span className="ml-1">{client.ultimoBoleto}</span>
                </span>
              </div>
            )}
            {client.consumo && (
              <div className="flex items-center gap-2 leading-tight">
                <DollarSign
                  className="w-3 h-3 flex-shrink-0"
                  style={{ color: "#00DD00" }}
                />
                <span style={{ color: "#4A5F7F" }}>
                  <span className="font-600" style={{ color: "#001F3F" }}>
                    Consumo:
                  </span>
                  <span className="ml-1">{client.consumo}</span>
                </span>
              </div>
            )}
            {client.deltaConsumo && (
              <div className="flex items-center gap-2 leading-tight">
                <DollarSign
                  className="w-3 h-3 flex-shrink-0"
                  style={{
                    color: client.deltaConsumo.startsWith("-")
                      ? "#EF4444"
                      : "#10B981",
                  }}
                />
                <span
                  style={{
                    color: client.deltaConsumo.startsWith("-")
                      ? "#EF4444"
                      : "#10B981",
                    fontWeight: "600",
                  }}
                >
                  Diferenca: {client.deltaConsumo}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Botão Objetivos — substitui o grupo do WhatsApp e lê a coluna AA */}
          <button
              onClick={event => {
                event.stopPropagation();
                setShowObjectives(value => !value);
              }}
              className="flex-1 flex items-center justify-center p-1.5 rounded transition-all hover:opacity-90 hover:shadow-sm active:scale-95"
              style={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
              title="Ver objetivos do cliente"
              aria-label={`Ver objetivos do cliente ${client.nome}`}
            >
              <ArrowRight className="w-4 h-4" />
          </button>

          {/* Botão de contato — marca o checkbox K na aba Marcos */}
          <button
            onClick={e => {
              e.stopPropagation();
              markContact.mutate({ cliente: client.nome, aba: "marcos" });
            }}
            disabled={markContact.isPending || contactButton.disabled}
            className="flex-1 flex items-center justify-center p-1.5 rounded transition-all hover:opacity-90 hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundColor: contactButton.backgroundColor, color: "#FFFFFF" }}
            title={contactButton.label}
            aria-label={`Marcar contato realizado de ${client.nome}`}
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Botão Wootric — avaliações NPS pelo ID central */}
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              setShowWootricHistory(true);
            }}
            disabled={!client.centralId}
            className="flex-1 flex items-center justify-center rounded p-1.5 transition-all hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: "#EAF3FF" }}
            title={
              client.centralId
                ? "Ver avaliações Wootric"
                : "ID central não disponível para buscar avaliações"
            }
            aria-label={`Ver avaliações Wootric de ${client.nome}`}
          >
            <WootricMark className="h-4 w-4" />
          </button>

          {/* Botão Registrar acontecimento */}
          <button
            onClick={e => {
              e.stopPropagation();
              onFriccao?.(client);
            }}
            className="flex-1 flex items-center justify-center p-1.5 rounded transition-all hover:opacity-90 hover:shadow-sm active:scale-95"
            style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
            title="Registrar acontecimento"
            aria-label="Registrar acontecimento"
          >
            <Flag className="w-4 h-4 fill-current" />
          </button>
        </div>
        {showObjectives &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed left-1/2 top-1/2 z-[100] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border-2 border-emerald-300 bg-white p-5 text-left text-xs shadow-2xl"
              style={{ width: "min(42rem, calc(100vw - 2rem))" }}
              role="dialog"
              aria-label={`Objetivos globais de ${client.nome}`}
              onClick={event => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-emerald-100 pb-2">
                <div>
                  <span className="block text-sm font-bold text-slate-900">
                    Objetivos globais do cliente
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Os objetivos vêm da central Ferramentas. O global conclui quando todos os subobjetivos forem marcados.
                  </span>
                </div>
                <button
                  type="button"
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Fechar objetivos"
                  onClick={() => setShowObjectives(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mb-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/60 p-2.5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 text-left font-semibold text-emerald-800"
                  onClick={() => setShowObjectivePicker(value => !value)}
                  aria-expanded={showObjectivePicker}
                >
                  <span className="flex items-center gap-2"><span className="text-lg leading-none">+</span> Adicionar objetivo global</span>
                  <span className="text-[10px] font-normal">{objectiveOptions.length} disponível(is)</span>
                </button>
                {showObjectivePicker && (
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {objectiveOptions.map(objective => (
                      <button
                        key={objective.id}
                        type="button"
                        className="rounded-md border border-emerald-200 bg-white px-2.5 py-2 text-left text-[11px] font-medium text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-60"
                        disabled={assignObjective.isPending}
                        onClick={() => assignObjective.mutate({ clientId: client.id, objectiveId: objective.id })}
                      >
                        <span className="block font-semibold">{objective.name}</span>
                        <span className="text-[10px] text-slate-500">{objective.subobjectives.length} subobjetivo(s)</span>
                      </button>
                    ))}
                    {objectiveOptions.length === 0 && <span className="text-[10px] text-slate-500">Todos os objetivos disponíveis já foram adicionados.</span>}
                  </div>
                )}
              </div>
              {assignedObjectives.length > 0 ? (
                <div className="space-y-3 text-slate-700">
                  {assignedObjectives.map(assignment => {
                    const completedCount = assignment.subobjectives.filter(subobjective => subobjective.completed).length;
                    const globalCompleted = assignment.subobjectives.length > 0 && completedCount === assignment.subobjectives.length;
                    return (
                      <section
                        key={assignment.objectiveId}
                        className={`rounded-lg border p-3 transition-colors ${globalCompleted ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-slate-900">{assignment.objective.name}</h4>
                          <div className="flex items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${globalCompleted ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                              {globalCompleted ? "Concluído" : `${completedCount}/${assignment.subobjectives.length}`}
                            </span>
                            <button
                              type="button"
                              className="rounded px-1 text-[10px] text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Remover objetivo do cliente"
                              aria-label={`Remover objetivo ${assignment.objective.name}`}
                              onClick={() => removeObjective.mutate({ clientId: client.id, objectiveId: assignment.objectiveId })}
                            >
                              remover
                            </button>
                          </div>
                        </div>
                        <ul className="space-y-1.5">
                          {assignment.subobjectives.map(subobjective => {
                            const completed = Boolean(subobjective.completed);
                            const completedDate = toInputDate(subobjective.completedAt);
                            return (
                              <li key={subobjective.id} className={`rounded-md border px-2.5 py-2 ${completed ? "border-emerald-200 bg-emerald-100/70" : "border-slate-100 bg-slate-50"}`}>
                                <div className="flex items-start gap-2">
                                  <input
                                    type="checkbox"
                                    checked={completed}
                                    onChange={event => setAssignedSubobjectiveCompletion.mutate({
                                      clientId: client.id,
                                      objectiveId: assignment.objectiveId,
                                      subobjectiveId: subobjective.id,
                                      completed: event.target.checked,
                                      completedAt: event.target.checked ? completedDate || getTodayInputDate() : undefined,
                                    })}
                                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-600"
                                    aria-label={`Marcar subobjetivo como concluído: ${subobjective.name}`}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <span className={completed ? "font-medium line-through" : ""}>{subobjective.name}</span>
                                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">prazo: {addDaysToBrazilianDate(client.entrada, subobjective.deadlineDays)}</span>
                                    {completed && (
                                      <label className="mt-1.5 flex items-center gap-2 text-[10px] font-medium text-emerald-900">
                                        Data da conclusão
                                        <input
                                          type="date"
                                          value={completedDate}
                                          onChange={event => event.target.value && setAssignedSubobjectiveCompletion.mutate({ clientId: client.id, objectiveId: assignment.objectiveId, subobjectiveId: subobjective.id, completed: true, completedAt: event.target.value })}
                                          className="h-6 rounded border border-emerald-300 bg-white px-1.5 text-[10px] text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400"
                                          aria-label={`Data de conclusão: ${subobjective.name}`}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500">Nenhum objetivo atribuído a este cliente. Use o botão + para começar.</p>
              )}
            </div>,
            document.body
          )}
        {showScoreReasons && (
          <div
            className="absolute right-0 top-8 z-50 w-56 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs shadow-xl"
            role="dialog"
            aria-label={`Motivos da pontuação de ${client.nome}`}
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-800">
                Motivos da nota
              </span>
              <button
                type="button"
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar motivos da nota"
                onClick={() => setShowScoreReasons(false)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {criticalitySignals.length > 0 ? (
              <div className="space-y-1.5">
                {criticalitySignals.map(signal => (
                  <div
                    key={`${signal.label}-${signal.points}`}
                    className="flex items-start justify-between gap-2"
                  >
                    <span className="min-w-0 text-slate-600">
                      {signal.label}
                    </span>
                    <strong className="shrink-0 text-red-700">
                      -{signal.points}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Nenhum desconto identificado.</p>
            )}
          </div>
        )}
      </div>

      {showWootricHistory && (
        <WootricClientHistoryModal
          clientName={client.nome}
          centralId={client.centralId ?? ""}
          open
          onClose={() => setShowWootricHistory(false)}
        />
      )}

      {/* Tooltip desabilitado */}
      {false && showTooltip && (
        <div
          className="absolute left-0 right-0 top-0 z-50 rounded-lg p-3 text-xs shadow-lg border"
          style={{
            backgroundColor: "#001F3F",
            borderColor: "#00DD00",
            color: "#FFFFFF",
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 p-1 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
          {client.atendente && (
            <div className="flex items-start gap-2 mb-2">
              <User
                className="w-3 h-3 flex-shrink-0 mt-0.5"
                style={{ color: "#00DD00" }}
              />
              <div>
                <p className="font-600" style={{ color: "#E0E8F0" }}>
                  CSM
                </p>
                <p style={{ color: "#FFFFFF" }}>{client.atendente}</p>
              </div>
            </div>
          )}
          {hasFlag && (
            <div
              className="flex items-center gap-2 mb-2 px-2 py-1 rounded"
              style={{ backgroundColor: "rgba(255,107,107,0.2)" }}
            >
              <Flag
                className="w-3 h-3 flex-shrink-0 fill-current"
                style={{ color: flagColor! }}
              />
              <span className="font-600" style={{ color: flagColor! }}>
                {client.flag}
              </span>
            </div>
          )}
          {client.comercial && (
            <div className="flex items-start gap-2 mb-2">
              <Briefcase
                className="w-3 h-3 flex-shrink-0 mt-0.5"
                style={{ color: "#00DD00" }}
              />
              <div>
                <p className="font-600" style={{ color: "#E0E8F0" }}>
                  Comercial
                </p>
                <p style={{ color: "#FFFFFF" }}>{client.comercial}</p>
              </div>
            </div>
          )}
          {client.saude && (
            <div className="flex items-start gap-2 mb-2">
              <Heart
                className="w-3 h-3 flex-shrink-0 mt-0.5"
                style={{ color: "#00DD00" }}
              />
              <div>
                <p className="font-600" style={{ color: "#E0E8F0" }}>
                  Saúde
                </p>
                <p style={{ color: "#FFFFFF" }}>{client.saude}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
