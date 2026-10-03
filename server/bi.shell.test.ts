import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sideMenuSource = readFileSync(
  new URL("../client/src/components/SideMenu.tsx", import.meta.url),
  "utf8"
);
const appSource = readFileSync(
  new URL("../client/src/App.tsx", import.meta.url),
  "utf8"
);
const cardSource = readFileSync(
  new URL("../client/src/components/ClientCard.tsx", import.meta.url),
  "utf8"
);
const biPageSource = readFileSync(
  new URL("../client/src/pages/BI.tsx", import.meta.url),
  "utf8"
);
const biMetricsSource = readFileSync(
  new URL("../client/src/lib/biMetrics.ts", import.meta.url),
  "utf8"
);

describe("BI shell", () => {
  it("exposes BI between Ongoing and CHURNs", () => {
    expect(sideMenuSource).toContain('{ id: "bi", label: "BI"');
    expect(sideMenuSource.indexOf('id: "ongoing"')).toBeLessThan(
      sideMenuSource.indexOf('id: "bi"')
    );
    expect(sideMenuSource.indexOf('id: "bi"')).toBeLessThan(
      sideMenuSource.indexOf('id: "churns"')
    );
    expect(appSource).toContain('"bi"');
    expect(appSource).toContain('case "bi":');
  });

  it("exibe filtros, KPIs normais e críticos baseados na operação", () => {
    expect(biMetricsSource).toContain("Clientes em implantação");
    expect(biMetricsSource).toContain("Clientes em onboarding");
    expect(biMetricsSource).toContain('label: "Implantados"');
    expect(biMetricsSource).toContain("Clientes em migração");
    expect(biMetricsSource).toContain("Implantação atrasada");
    expect(biMetricsSource).toContain("Onboarding atrasado");
    expect(biMetricsSource).toContain("Atrasados para Ongoing");
    expect(biMetricsSource).toContain("getUnflaggedOverdueGroups");
    expect(biMetricsSource).toContain("calculateAverageTTV");
    expect(biPageSource).toContain("Todos os CSMs");
    expect(biPageSource).toContain("Filtrar por objetivo");
    expect(biPageSource).toContain("selectedObjectives");
    expect(biPageSource).toContain("filterClientsByObjectives");
    expect(biPageSource).toContain("pelo menos um deles");
    expect(biPageSource).toContain("Gerar relatório");
    expect(biPageSource).toContain("TTV médio");
    expect(biPageSource).toContain("Atrasados sem Flag");
    expect(biPageSource).toContain("Quantidade de clientes por CSM");
    expect(biPageSource).toContain("Valor financeiro por CSM");
    expect(biPageSource).toContain("Tempo de implantação por objetivo");
    expect(biPageSource).toContain("groupAverageTTVByObjective");
    expect(biPageSource).not.toContain("Inteligência financeira");
    expect(biPageSource).not.toContain("Área de BI preparada");
    expect(biPageSource).toContain("Clique para ver os clientes");
    expect(biPageSource).not.toContain("localStorage");
    expect(biPageSource).toContain("2xl:grid-cols-5");
    expect(biPageSource).toContain("overflow-x-hidden");
    expect(biPageSource).toContain('className="min-h-screen overflow-x-hidden');
    expect(biPageSource).toContain("xl:grid-cols-4");
    expect(biPageSource).toContain("xl:grid-cols-2");
    expect(sideMenuSource).toContain("adminOnly: true");
  });

  it("replaces the blue atendimento action icon without implementing BI rules yet", () => {
    expect(cardSource).toContain('title="BI do cliente"');
    expect(cardSource).toContain("<BarChart3 className=\"w-4 h-4\" />");
    expect(cardSource).not.toContain('title="Registrar atendimento"');
  });
});
