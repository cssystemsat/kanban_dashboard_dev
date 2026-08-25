export const PANEL_AUTO_REFRESH_MS = 10 * 60 * 1000;

export function schedulePanelAutoRefresh(refresh: () => void): () => void {
  const timer = globalThis.setInterval(refresh, PANEL_AUTO_REFRESH_MS);
  return () => globalThis.clearInterval(timer);
}
