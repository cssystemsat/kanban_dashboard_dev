import { describe, expect, it } from "vitest";
import {
  formatPanelRefreshCountdown,
  nextPanelRefreshSecond,
  PANEL_AUTO_REFRESH_MS,
  PANEL_AUTO_REFRESH_SECONDS,
} from "./panelRefresh";

describe("PANEL_AUTO_REFRESH_MS", () => {
  it("configura a atualização automática a cada dez minutos", () => {
    expect(PANEL_AUTO_REFRESH_MS).toBe(600_000);
    expect(PANEL_AUTO_REFRESH_SECONDS).toBe(600);
  });

  it("reinicia o contador ao chegar em zero", () => {
    expect(nextPanelRefreshSecond(600)).toBe(599);
    expect(nextPanelRefreshSecond(1)).toBe(600);
  });

  it("formata o relógio em minutos e segundos", () => {
    expect(formatPanelRefreshCountdown(600)).toBe("10:00");
    expect(formatPanelRefreshCountdown(9)).toBe("00:09");
  });
});
