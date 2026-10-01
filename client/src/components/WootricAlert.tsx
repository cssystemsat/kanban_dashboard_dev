import { MessageSquareHeart, Star } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type WootricAlertResponse = {
  id: number;
  email: string | null;
  score: number;
  text: string | null;
  tags: string | null;
  createdAtWootric: Date | string | null;
};

function formatDate(value: Date | string | null) {
  if (!value) return "Data não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function scoreTone(score: number) {
  if (score <= 6) return "text-rose-700 bg-rose-100 border-rose-200";
  if (score <= 8) return "text-amber-700 bg-amber-100 border-amber-200";
  return "text-emerald-700 bg-emerald-100 border-emerald-200";
}

export function WootricAlert() {
  const { user } = useAuth();
  const [show, setShow] = useState(true);
  const [isCiente, setIsCiente] = useState(false);
  const pendingQuery = trpc.wootric.pending.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const acknowledge = trpc.wootric.acknowledge.useMutation({
    onSuccess: () => {
      setShow(false);
      setIsCiente(false);
      void pendingQuery.refetch();
    },
  });

  const responses = (pendingQuery.data ?? []) as WootricAlertResponse[];
  const handleConfirm = async () => {
    if (!isCiente || responses.length === 0) return;
    await acknowledge.mutateAsync({ responseIds: responses.map(response => response.id) });
  };

  if (!user || !show || pendingQuery.isLoading || responses.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/20 p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[88vh] w-[min(95vw,720px)] flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-indigo-100 bg-indigo-50 px-6 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
            <MessageSquareHeart className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Nova avaliação NPS</h2>
            <p className="text-sm text-slate-600">
              {responses.length} avaliação{responses.length !== 1 ? "ões" : ""} aguardando sua ciência.
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-auto px-6 py-5">
          {responses.map(response => (
            <article key={response.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">
                    {response.email || "Cliente sem e-mail"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Recebida em {formatDate(response.createdAtWootric)}
                  </p>
                </div>
                <div className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-bold ${scoreTone(response.score)}`}>
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  {response.score}/10
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {response.text?.trim() || "O cliente não deixou comentário."}
              </p>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isCiente}
              onChange={event => setIsCiente(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Estou ciente das novas avaliações
            </span>
          </label>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isCiente || acknowledge.isPending}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
              isCiente && !acknowledge.isPending
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            {acknowledge.isPending ? "Confirmando..." : "Confirmar ciência"}
          </button>
        </div>
      </div>
    </div>
  );
}
