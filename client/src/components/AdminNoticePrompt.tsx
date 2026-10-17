import { useState } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function AdminNoticePrompt() {
  const utils = trpc.useUtils();
  const { data: notices } = trpc.notices.pending.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const [isAware, setIsAware] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const notice = notices?.[0];

  const acknowledge = trpc.notices.acknowledge.useMutation({
    onSuccess: async () => {
      setIsAware(false);
      setIsSubmitting(false);
      await utils.notices.pending.invalidate();
    },
    onError: () => setIsSubmitting(false),
  });

  if (!notice) return null;

  const handleAcknowledge = () => {
    if (!isAware || isSubmitting) return;
    setIsSubmitting(true);
    acknowledge.mutate({
      noticeId: notice.id,
      occurrenceKey: notice.occurrenceKey,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001F3F]/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-notice-title"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border-2 border-amber-300 bg-white shadow-2xl">
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100">
              Aviso importante
            </p>
            <h2 id="admin-notice-title" className="text-xl font-bold">
              {notice.title}
            </h2>
          </div>
        </div>

        <div className="px-6 py-7">
          {notice.imageUrl ? (
            <img
              src={notice.imageUrl}
              alt="Imagem do aviso"
              className="mb-5 max-h-72 w-full rounded-xl border border-slate-200 object-contain"
            />
          ) : null}
          <p className="whitespace-pre-wrap text-base leading-7 text-slate-700">
            {notice.message}
          </p>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={isAware}
              onChange={event => setIsAware(event.target.checked)}
              className="h-5 w-5 rounded accent-amber-600"
            />
            Estou ciente deste aviso
          </label>
          <Button
            type="button"
            disabled={!isAware || isSubmitting}
            onClick={handleAcknowledge}
            className="gap-2 bg-[#001F3F] text-white hover:bg-[#0b3157] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? "Registrando..." : "Confirmar ciência"}
          </Button>
        </div>
      </div>
    </div>
  );
}
