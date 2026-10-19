import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Estatisticas.tsx"),
  "utf8"
);
const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");

describe("aba Estatísticas de Uso", () => {
  it("não exibe mais o gráfico de Churn por CSM", () => {
    expect(pageSource).not.toContain("Churns por CSM");
    expect(pageSource).not.toContain("useChurnsByCsmData");
    expect(pageSource).not.toContain("selectedCsm");
  });

  it("exibe indicadores de atividade em janelas de 24 horas e 7 dias", () => {
    expect(pageSource).toContain("Ativos nas últimas 24h");
    expect(pageSource).toContain("Ativos nos últimos 7 dias");
    expect(pageSource).toContain("Sessões nos últimos 7 dias");
    expect(pageSource).toContain("Duração média da sessão");
    expect(dbSource).toContain("activeUsersLast24Hours");
    expect(dbSource).toContain("activeUsersLast7Days");
    expect(dbSource).toContain("sessionsLast7Days");
    expect(dbSource).toContain("averageSessionDurationSeconds");
  });
});
