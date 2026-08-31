export const PANEL_AUTO_REFRESH_MS = 10 * 60 * 1000;
export const PANEL_AUTO_REFRESH_SECONDS = PANEL_AUTO_REFRESH_MS / 1000;

export function nextPanelRefreshSecond(secondsRemaining: number): number {
  return secondsRemaining <= 1
    ? PANEL_AUTO_REFRESH_SECONDS
    : secondsRemaining - 1;
}

export function formatPanelRefreshCountdown(secondsRemaining: number): string {
  const normalized = Math.max(0, secondsRemaining);
  const minutes = Math.floor(normalized / 60);
  const seconds = normalized % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function refreshPanelWhenVisible(refresh: () => void): () => void {
  const refreshOnVisibility = () => {
    if (document.visibilityState === "visible") refresh();
  };
  document.addEventListener("visibilitychange", refreshOnVisibility);
  window.addEventListener("focus", refresh);
  return () => {
    document.removeEventListener("visibilitychange", refreshOnVisibility);
    window.removeEventListener("focus", refresh);
  };
}
