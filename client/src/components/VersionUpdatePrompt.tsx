import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  compareSemanticVersions,
  shouldShowVersionPrompt,
} from "@/lib/versionCheck";
import { APP_VERSION } from "@/lib/appVersion";

const VERSION_ENDPOINT = "/app-version.json";
const POLL_INTERVAL_MS = 60_000;
const DISMISS_DURATION_MS = 10 * 60_000;

type VersionPayload = {
  appVersion?: string;
  changes?: string[];
};

type PublishedRelease = {
  version: string;
  changes: string[];
};

async function fetchPublishedVersion(): Promise<PublishedRelease | null> {
  const requestUrl = new URL(VERSION_ENDPOINT, window.location.origin);
  requestUrl.searchParams.set("current", APP_VERSION);
  requestUrl.searchParams.set("t", String(Date.now()));
  const response = await fetch(requestUrl.toString(), {
    cache: "reload",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as VersionPayload;
  if (typeof payload.appVersion !== "string" || !payload.appVersion) {
    return null;
  }

  return {
    version: payload.appVersion,
    changes: Array.isArray(payload.changes)
      ? payload.changes
          .filter(
            (change): change is string =>
              typeof change === "string" && change.trim().length > 0
          )
          .slice(-1)
      : [],
  };
}

export default function VersionUpdatePrompt() {
  const [currentVersion] = useState<string>(APP_VERSION);
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [availableChanges, setAvailableChanges] = useState<string[]>([]);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const [dismissedUntil, setDismissedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    const checkForVersion = async () => {
      try {
        const publishedVersion = await fetchPublishedVersion();
        if (!active || !publishedVersion) return;
        // Um proxy/CDN pode devolver temporariamente um manifesto antigo.
        // Nunca deixe essa resposta apagar uma atualização já detectada.
        if (compareSemanticVersions(publishedVersion.version, currentVersion) <= 0) {
          return;
        }

        setAvailableVersion(existing =>
          existing === publishedVersion.version
            ? existing
            : publishedVersion.version
        );
        setAvailableChanges(publishedVersion.changes);
      } catch (error) {
        console.warn(
          "[Version] Não foi possível verificar a publicação:",
          error
        );
      }
    };

    const checkWhenActive = () => {
      if (document.visibilityState === "visible") {
        void checkForVersion();
      }
    };

    void checkForVersion();
    const intervalId = window.setInterval(checkForVersion, POLL_INTERVAL_MS);
    window.addEventListener("focus", checkWhenActive);
    document.addEventListener("visibilitychange", checkWhenActive);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", checkWhenActive);
      document.removeEventListener("visibilitychange", checkWhenActive);
    };
  }, []);

  useEffect(() => {
    if (!dismissedUntil) return;
    const timeoutId = window.setTimeout(
      () => {
        setDismissedUntil(0);
        setNow(Date.now());
      },
      Math.max(0, dismissedUntil - Date.now())
    );
    return () => window.clearTimeout(timeoutId);
  }, [dismissedUntil]);

  const isVisible = shouldShowVersionPrompt({
    currentVersion,
    availableVersion,
    dismissedVersion,
    dismissedUntil,
    now,
  });

  if (!isVisible) return null;

  const dismiss = () => {
    if (!availableVersion) return;
    setDismissedVersion(availableVersion);
    setDismissedUntil(Date.now() + DISMISS_DURATION_MS);
    setNow(Date.now());
  };

  return (
    <div
      className="fixed inset-x-0 top-3 z-[100] flex justify-center px-3 sm:top-5 sm:px-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-xl items-start gap-3 rounded-xl border border-blue-200 bg-white p-4 text-slate-900 shadow-2xl ring-1 ring-blue-100">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            Nova atualização disponível
            {availableVersion ? ` — versão ${availableVersion}` : ""}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Uma nova versão do painel foi publicada. Atualize a página para ver
            as correções e funcionalidades mais recentes.
          </p>
          {availableChanges.length > 0 && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700">
                O que foi alterado
              </p>
              <ul className="mt-1.5 space-y-1 text-xs leading-5 text-slate-600">
                {availableChanges.map(change => (
                  <li key={change} className="flex gap-2">
                    <span aria-hidden="true">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Atualizar agora
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Lembrar depois
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar aviso de atualização"
          className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
