import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  KPI_MANUAL_WEEK_VALUES,
  KPI_ZERO_WEEK_VALUES,
} from "../shared/kpiDefinitions";

const {
  saveKpiWeeklySnapshot,
  getLatestKpiWeeklySnapshot,
  getOnboardingKpiMetrics,
} = vi.hoisted(() => ({
  saveKpiWeeklySnapshot: vi.fn(),
  getLatestKpiWeeklySnapshot: vi.fn(),
  getOnboardingKpiMetrics: vi.fn(),
}));

vi.mock("./db", () => ({
  saveKpiWeeklySnapshot,
  getLatestKpiWeeklySnapshot,
}));

vi.mock("./kpiMetrics", () => ({
  getOnboardingKpiMetrics,
}));

import {
  closeKpiWeeklySnapshot,
  getCurrentKpiValues,
  getKpiClosingPeriodKey,
  getPreviousKpiWeeklyValues,
} from "./kpiSnapshots";

describe("Fechamento semanal dos KPI’s de Gestão CS", () => {
  const definitionsSource = readFileSync(
    resolve(process.cwd(), "shared/kpiDefinitions.ts"),
    "utf8"
  );
  const pageSource = readFileSync(
    resolve(process.cwd(), "client/src/pages/KPIs.tsx"),
    "utf8"
  );
  const routerSource = readFileSync(
    resolve(process.cwd(), "server/routers.ts"),
    "utf8"
  );
  const schedulerSource = readFileSync(
    resolve(process.cwd(), "server/_core/index.ts"),
    "utf8"
  );

  beforeEach(() => {
    saveKpiWeeklySnapshot.mockReset();
    getLatestKpiWeeklySnapshot.mockReset();
    getOnboardingKpiMetrics.mockReset();
  });

  it("inicia todos os indicadores da semana retrasada em zero", () => {
    for (const cards of Object.values(KPI_ZERO_WEEK_VALUES)) {
      expect(cards).toHaveLength(8);
      for (const card of cards) {
        expect(card.value).toBe(0);
        expect(card.status).toBe("neutral");
        expect(card.trendValue).toBe("0");
      }
    }
  });

  it("mantém uma fonte manual única para a semana passada", () => {
    expect(Object.keys(KPI_MANUAL_WEEK_VALUES)).toEqual([
      "onboarding",
      "ongoing",
      "migracao",
    ]);
    expect(definitionsSource).toContain("KPI_MANUAL_WEEK_VALUES");
    expect(pageSource).toContain("KPI_MANUAL_WEEK_VALUES.onboarding");
    expect(pageSource).toContain("KPI_ZERO_WEEK_VALUES.onboarding");
    expect(pageSource).toContain("getPreviousWeeklySnapshot");
  });

  it("calcula a sexta-feira de fechamento em Brasília, inclusive após a meia-noite UTC", () => {
    expect(getKpiClosingPeriodKey(new Date("2026-08-29T02:59:00.000Z"))).toBe(
      "2026-08-28"
    );
    expect(getKpiClosingPeriodKey(new Date("2026-08-30T02:59:00.000Z"))).toBe(
      "2026-08-28"
    );
  });

  it("grava os valores manuais e não cria outro snapshot em retry do mesmo período", async () => {
    const closedAt = new Date("2026-08-29T02:59:00.000Z");
    const stored = {
      id: 1,
      periodKey: "2026-08-28",
      valuesJson: JSON.stringify(KPI_MANUAL_WEEK_VALUES),
      closedAt,
      createdAt: closedAt,
    };
    getOnboardingKpiMetrics.mockResolvedValue({
      clientesAtivos: {
        value: 156,
        clients: ["ALPHA TECNOLOGIA", "ALTOTRAK"],
        source: "primary:Marcos",
      },
      dentroDoPrazo: {
        value: 62,
        percentage: 39.74,
        clients: ["ALPHA TECNOLOGIA", "ALTOTRAK"],
        source: "primary:Marcos!AK:AO",
      },
      concluidos: {
        value: 2,
        clients: ["BVTRACKER", "Fênix Sat"],
        source: "primary:KPI's!AK/AM",
        periodStart: "2026-08-24",
        periodEnd: "2026-08-30",
      },
      tempoMedio: {
        value: 521.65,
        source: "primary:KPI's!AL",
      },
    });
    saveKpiWeeklySnapshot
      .mockResolvedValueOnce({ snapshot: stored, created: true })
      .mockResolvedValueOnce({ snapshot: stored, created: false });

    const expectedValues = await getCurrentKpiValues(closedAt);
    const first = await closeKpiWeeklySnapshot(closedAt);
    const retry = await closeKpiWeeklySnapshot(closedAt);

    expect(first).toMatchObject({ periodKey: "2026-08-28", created: true });
    expect(retry).toMatchObject({ periodKey: "2026-08-28", created: false });
    expect(saveKpiWeeklySnapshot).toHaveBeenCalledTimes(2);
    expect(saveKpiWeeklySnapshot.mock.calls[0][0]).toMatchObject({
      periodKey: "2026-08-28",
      valuesJson: JSON.stringify(expectedValues),
    });
  });

  it("retorna o último snapshot válido e trata JSON inválido como ausência de histórico", async () => {
    getLatestKpiWeeklySnapshot.mockResolvedValueOnce({
      periodKey: "2026-08-28",
      valuesJson: JSON.stringify(KPI_MANUAL_WEEK_VALUES),
      closedAt: new Date("2026-08-29T02:59:00.000Z"),
    });
    const result = await getPreviousKpiWeeklyValues();
    expect(result?.periodKey).toBe("2026-08-28");
    expect(result?.values).toEqual(KPI_MANUAL_WEEK_VALUES);

    getLatestKpiWeeklySnapshot.mockResolvedValueOnce({
      periodKey: "2026-08-28",
      valuesJson: "{invalid",
    });
    await expect(getPreviousKpiWeeklyValues()).resolves.toBeNull();
  });

  it("configura o fechamento para sexta-feira às 23:59 BRT", () => {
    expect(routerSource).toContain('cron: "0 59 2 * * 6"');
    expect(routerSource).toContain("/api/scheduled/kpis/weekly-snapshot");
    expect(schedulerSource).toContain("/api/scheduled/kpis/weekly-snapshot");
  });

  it("protege o callback para chamadas de cron e mantém o fechamento idempotente", () => {
    expect(schedulerSource).toContain("user.isCron");
    expect(schedulerSource).toContain("isRegisteredKpiSchedule(user.taskUid)");
    expect(
      readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8")
    ).toContain("where(eq(kpiWeeklySnapshots.periodKey, input.periodKey))");
    expect(
      readFileSync(resolve(process.cwd(), "server/kpiSnapshots.ts"), "utf8")
    ).toContain("saveKpiWeeklySnapshot");
  });

  it("preserva o modal de detalhes dos KPI’s", () => {
    expect(pageSource).toContain("setSelectedKPI(kpiRetrasada)");
    expect(pageSource).toContain("setSelectedKPI(kpiPassada)");
    expect(pageSource).toContain(
      "Informações do KPI serão adicionadas aqui..."
    );
  });
});
