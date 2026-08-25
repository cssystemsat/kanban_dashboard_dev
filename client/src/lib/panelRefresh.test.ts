import { afterEach, describe, expect, it, vi } from "vitest";
import { PANEL_AUTO_REFRESH_MS, schedulePanelAutoRefresh } from "./panelRefresh";

describe("PANEL_AUTO_REFRESH_MS", () => {
  it("configura a atualização automática a cada dez minutos", () => {
    expect(PANEL_AUTO_REFRESH_MS).toBe(600_000);
  });

  it("dispara a atualização recorrente e a interrompe ao desmontar a página", () => {
    vi.useFakeTimers();
    const refresh = vi.fn();
    const stop = schedulePanelAutoRefresh(refresh);
    vi.advanceTimersByTime(PANEL_AUTO_REFRESH_MS);
    expect(refresh).toHaveBeenCalledTimes(1);
    stop();
    vi.advanceTimersByTime(PANEL_AUTO_REFRESH_MS);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  afterEach(() => vi.useRealTimers());
});
