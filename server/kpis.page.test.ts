import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/KPIs.tsx"),
  "utf8"
);

const routerSource = readFileSync(
  resolve(process.cwd(), "server/routers.ts"),
  "utf8"
);

describe("Página de KPI’s de Onboarding", () => {
  it("consulta a fonte real para clientes ativos e concluídos", () => {
    expect(pageSource).toContain(
      "trpc.kpis.getOnboardingKpiMetrics.useQuery()"
    );
    expect(pageSource).toContain("onboardingMetrics?.tempoMedio.value ?? 0");
    expect(pageSource).toContain(
      "details: onboardingMetrics?.tempoMedio.details ?? []"
    );
    expect(pageSource).toContain("onboardingMetrics?.concluidos.value ?? 0");
    expect(pageSource).toContain(
      "onboardingMetrics?.dentroDoPrazo.percentage ?? 0"
    );
    expect(pageSource).toContain("onboardingMetrics?.tempoMedio.value ?? 0");
    expect(routerSource).toContain("getOnboardingKpiMetrics: publicProcedure");
  });

  it("mantém as listas reais nos dois modais de Onboarding", () => {
    expect(pageSource).toContain(
      "details: onboardingMetrics?.clientesAtivos.clients ?? []"
    );
    expect(pageSource).toContain(
      "details: onboardingMetrics?.concluidos.clients ?? []"
    );
    expect(pageSource).toContain("Clientes na aba Marcos");
    expect(pageSource).toContain("Implantados na semana passada");
    expect(pageSource).toContain("Clientes sem marco atrasado");
    expect(pageSource).toContain("Clientes com marco atrasado");
    expect(pageSource).toContain(
      "onboardingMetrics?.paradosAtrasados.value ?? 0"
    );
    expect(pageSource).toContain(
      "onboardingMetrics?.paradosAtrasados.clients ?? []"
    );
    expect(pageSource).toContain("Empresa — implantação — tempo de onboarding");
    expect(pageSource).toContain("selectedKPI.details.map");
  });

  it("consulta e exibe as métricas reais de Migração", () => {
    expect(pageSource).toContain("trpc.kpis.getMigrationKpiMetrics.useQuery()");
    expect(pageSource).toContain("migrationMetrics?.emAndamento.value ?? 0");
    expect(pageSource).toContain("migrationMetrics?.emAndamento.clients ?? []");
    expect(pageSource).toContain("Empresas com status Em andamento");
    expect(pageSource).toContain('label: "Concluídas"');
    expect(pageSource).toContain("migrationMetrics?.atrasadas.value ?? 0");
    expect(pageSource).toContain("migrationMetrics?.atrasadas.clients ?? []");
    expect(pageSource).toContain("Migrações com duração superior a 365 dias");
    expect(pageSource).toContain("migrationMetrics?.tempoMedio.value ?? 0");
    expect(pageSource).toContain("migrationMetrics?.tempoMedio.details ?? []");
    expect(routerSource).toContain("getMigrationKpiMetrics: publicProcedure");
  });

  it("não usa mais a procedure manual como origem dos dois valores reais", () => {
    expect(pageSource).not.toContain("trpc.kpis.getOnboardingKpis.useQuery");
  });
});
