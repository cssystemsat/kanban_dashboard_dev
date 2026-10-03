import { useCallback, useEffect, useState } from "react";
import { cachedFetch } from "@/lib/sheetsCache";
import {
  auditMarcos,
  auditOngoing,
  type CompletionArea,
  type CompletionAudit,
} from "@/lib/completionAudit";

const SHEET_URLS: Record<CompletionArea, string> = {
  marcos:
    "https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/export?format=csv&gid=0",
  ongoing:
    "https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/export?format=csv&gid=1152476970",
};

const EMPTY_AUDIT: CompletionAudit = {
  issues: [],
  totalMissingClients: 0,
};

export function useCompletionAudit(area: CompletionArea, enabled: boolean) {
  const [audit, setAudit] = useState<CompletionAudit>(EMPTY_AUDIT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const response = await cachedFetch(SHEET_URLS[area]);
      if (!response.ok) throw new Error("Não foi possível ler a planilha.");
      const csv = await response.text();
      setAudit(area === "marcos" ? auditMarcos(csv) : auditOngoing(csv));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao auditar a planilha.");
    } finally {
      setLoading(false);
    }
  }, [area, enabled]);

  useEffect(() => {
    setAudit(EMPTY_AUDIT);
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { audit, loading, error, refresh };
}
