import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Automação do ranking de analistas", () => {
  const scoringSource = readFileSync(resolve(process.cwd(), "server/analystScoring.ts"), "utf8");
  const serverSource = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");

  it("aplica penalização idempotente de 8 pontos para cobertura abaixo de 25%", () => {
    expect(scoringSource).toContain("const COVERAGE_TARGET = 0.25");
    expect(scoringSource).toContain("const WEEKLY_PENALTY = 8");
    expect(scoringSource).toContain("penalty.periodKey === periodKey");
    expect(scoringSource).toContain("runWeeklyCoveragePenalty");
  });

  it("fecha o mês anterior com histórico antes de iniciar a nova competência", () => {
    expect(scoringSource).toContain("closePreviousMonthAndResetScores");
    expect(scoringSource).toContain("analystScoreHistory");
    expect(scoringSource).toContain("finalScore: score?.score ?? 100");
  });

  it("registra callbacks protegidos para os dois jobs automáticos", () => {
    expect(serverSource).toContain('/api/scheduled/performance/weekly-penalty');
    expect(serverSource).toContain('/api/scheduled/performance/monthly-reset');
    expect(serverSource).toContain("user.isCron");
  });

  it("mantém os descontos restritos ao job semanal idempotente", () => {
    const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(routerSource).not.toContain("applyPenalty:");
    expect(scoringSource).toContain("const periodKey = `weekly-${weekWindowForBrt().key}`");
  });
});
