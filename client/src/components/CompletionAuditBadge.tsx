import { AlertTriangle, CheckCircle2, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { useCompletionAudit } from "@/hooks/useCompletionAudit";
import type { CompletionArea } from "@/lib/completionAudit";

const AREA_LABELS: Record<CompletionArea, string> = {
  marcos: "Marcos",
  ongoing: "Ongoing",
};

type CompletionAuditBadgeProps = {
  area: CompletionArea;
  enabled: boolean;
};

export default function CompletionAuditBadge({
  area,
  enabled,
}: CompletionAuditBadgeProps) {
  const [open, setOpen] = useState(false);
  const [selectedCsm, setSelectedCsm] = useState("todos");
  const { audit, loading, error, refresh } = useCompletionAudit(area, enabled);

  if (!enabled) return null;

  const csms = Array.from(new Set(audit.issues.map(issue => issue.csm))).sort(
    (a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  );
  const visibleIssues =
    selectedCsm === "todos"
      ? audit.issues
      : audit.issues.filter(issue => issue.csm === selectedCsm);
  const groupedIssues = visibleIssues.reduce<Map<string, typeof audit.issues>>(
    (groups, issue) => {
      const current = groups.get(issue.csm) ?? [];
      current.push(issue);
      groups.set(issue.csm, current);
      return groups;
    },
    new Map()
  );

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 text-white shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-300"
        style={{ backgroundColor: audit.totalMissingClients > 0 ? "#DC2626" : "#16A34A" }}
        title={
          audit.totalMissingClients > 0
            ? `${audit.totalMissingClients} clientes com preenchimento pendente`
            : "Dados obrigatórios preenchidos"
        }
        aria-label={`Ver pendências de preenchimento de ${AREA_LABELS[area]}`}
      >
        {audit.totalMissingClients > 0 ? (
          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4"
          onMouseDown={() => setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`completion-audit-${area}-title`}
            className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white text-slate-800 shadow-2xl"
            onMouseDown={event => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-600">
                  Auditoria de preenchimento
                </p>
                <h2
                  id={`completion-audit-${area}-title`}
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Pendências de {AREA_LABELS[area]}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {visibleIssues.length > 0
                    ? `${visibleIssues.length} cliente${visibleIssues.length === 1 ? "" : "s"} com campos obrigatórios vazios${selectedCsm === "todos" ? "." : ` para ${selectedCsm}.`}`
                    : "Nenhum campo obrigatório vazio foi encontrado."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void refresh()}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-60"
                >
                  <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                  Atualizar
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                  aria-label="Fechar pendências"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Não foi possível atualizar a auditoria: {error}
                </div>
              )}

              {loading && audit.issues.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Conferindo a planilha...
                </div>
              ) : audit.issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Tudo preenchido nesta aba.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <label
                      htmlFor={`completion-audit-${area}-csm`}
                      className="text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      Filtrar por CSM
                    </label>
                    <select
                      id={`completion-audit-${area}-csm`}
                      value={selectedCsm}
                      onChange={event => setSelectedCsm(event.target.value)}
                      className="min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="todos">Todos os CSMs</option>
                      {csms.map(csm => (
                        <option key={csm} value={csm}>
                          {csm}
                        </option>
                      ))}
                    </select>
                  </div>
                  {visibleIssues.length === 0 ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center text-sm font-medium text-green-800">
                      Nenhuma pendência encontrada para este CSM.
                    </div>
                  ) : null}
                  {Array.from(groupedIssues.entries()).map(([csm, issues]) => (
                    <div key={csm}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          CSM
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{csm}</h3>
                        <span className="text-xs text-slate-400">
                          {issues.length} cliente{issues.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(260px,1.2fr)] bg-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          <span>Cliente</span>
                          <span>O que falta preencher</span>
                        </div>
                        {issues.map(issue => (
                          <div
                            key={`${issue.csm}-${issue.client}`}
                            className="grid grid-cols-[minmax(0,1fr)_minmax(260px,1.2fr)] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                          >
                            <span className="min-w-0 truncate font-semibold text-slate-800" title={issue.client}>
                              {issue.client}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {issue.missingFields.map(field => (
                                <span
                                  key={field}
                                  className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                                >
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
