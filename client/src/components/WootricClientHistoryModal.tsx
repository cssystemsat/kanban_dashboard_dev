import { X, Star, LoaderCircle, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";

type WootricClientHistoryModalProps = {
  clientName: string;
  centralId: string;
  open: boolean;
  onClose: () => void;
};

type WootricResponse = {
  id: number;
  score: number;
  text: string | null;
  email: string | null;
  createdAtWootric: Date | string | null;
};

function scoreStyle(score: number) {
  if (score <= 6) return "bg-rose-100 text-rose-700 ring-rose-200";
  if (score <= 8) return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-emerald-100 text-emerald-700 ring-emerald-200";
}

function formatDate(value: Date | string | null) {
  if (!value) return "Data não informada";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data não informada"
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function WootricClientHistoryModal({
  clientName,
  centralId,
  open,
  onClose,
}: WootricClientHistoryModalProps) {
  const historyQuery = trpc.wootric.historyByCentral.useQuery(
    { centralId },
    { enabled: open && Boolean(centralId), staleTime: 60_000 }
  );
  const responses = (historyQuery.data ?? []) as WootricResponse[];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Avaliações Wootric de ${clientName}`}
      onClick={onClose}
    >
      <section
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <header className="flex items-start gap-3 border-b border-slate-100 p-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Histórico Wootric
            </p>
            <h2 className="truncate text-lg font-bold text-slate-950">{clientName}</h2>
            <p className="mt-0.5 text-xs text-slate-500">ID central: {centralId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar histórico Wootric"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto p-5">
          {historyQuery.isLoading ? (
            <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" />
              Carregando avaliações salvas no painel...
            </div>
          ) : historyQuery.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              Não foi possível buscar as avaliações deste cliente. Tente novamente.
            </div>
          ) : responses.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-slate-500">
              <MessageSquare className="h-7 w-7 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">Nenhuma avaliação encontrada</p>
              <p className="max-w-sm text-xs">Não há avaliações NPS na Wootric para este ID central.</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {responses.map(response => (
                <li key={response.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">{formatDate(response.createdAtWootric)}</p>
                      {response.email && <p className="mt-0.5 truncate text-xs text-slate-400">{response.email}</p>}
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${scoreStyle(response.score)}`}>
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {response.score}/10
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {response.text?.trim() || "O cliente não deixou comentário."}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
