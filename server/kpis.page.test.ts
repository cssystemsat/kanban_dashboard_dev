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
    expect(routerSource).toContain(
      "getOnboardingKpiMetrics: allowlistedProcedure"
    );
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
    expect(pageSource).toContain("Migrados na semana");
    expect(pageSource).toContain(
      "migrationMetrics?.migradosNaSemana.value ?? 0"
    );
    expect(pageSource).toContain("Valor da célula AB29 da aba KPI's");
    expect(pageSource).toContain(
      "migrationMetrics?.clientesBloqueados.value ?? 0"
    );
    expect(pageSource).toContain(
      "migrationMetrics?.clientesBloqueados.clients ?? []"
    );
    expect(pageSource).toContain("Empresas com status Paralisado");
    expect(pageSource).toContain("migrationMetrics?.tempoMedio.value ?? 0");
    expect(pageSource).toContain("migrationMetrics?.tempoMedio.details ?? []");
    expect(routerSource).toContain(
      "getMigrationKpiMetrics: allowlistedProcedure"
    );
  });

  it("não usa mais a procedure manual como origem dos dois valores reais", () => {
    expect(pageSource).not.toContain("trpc.kpis.getOnboardingKpis.useQuery");
  });

  it("usa cards ampliados, grade responsiva e painéis sem fundo colorido", () => {
    expect(pageSource).toContain("min-w-0 min-h-[72px]");
    expect(pageSource).toContain("p-3 rounded-lg border text-sm");
    expect(pageSource).toContain(
      "grid w-full grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)]"
    );
    expect(pageSource).toContain("overflow-x-hidden bg-white px-6 py-6");
    expect(pageSource).toContain("bg-transparent border-gray-300");
    expect(pageSource).not.toContain("bg-green-50");
    expect(pageSource).not.toContain("bg-yellow-50");
    expect(pageSource).not.toContain("bg-red-50");
  });

  it("separa visualmente as categorias no layout desktop", () => {
    expect(pageSource).toContain(
      "xl:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)]"
    );
    expect(pageSource).toContain(
      'className="hidden self-stretch bg-gray-200 xl:block"'
    );
    expect(pageSource).toContain('aria-hidden="true"');
    expect(pageSource).not.toContain('className="ml-20 min-h-screen');
  });
});
