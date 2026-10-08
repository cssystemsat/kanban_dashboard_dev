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
const biReportPdfSource = readFileSync(
  new URL("../client/src/lib/biReportPdf.ts", import.meta.url),
  "utf8"
);
const ongoingPageSource = readFileSync(
  new URL("../client/src/pages/Ongoing.tsx", import.meta.url),
  "utf8"
);
const ongoingCardSource = readFileSync(
  new URL("../client/src/components/OngoingCard.tsx", import.meta.url),
  "utf8"
);
const atendimentoModalSource = readFileSync(
  new URL("../client/src/components/AtendimentoModal.tsx", import.meta.url),
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
    expect(biPageSource).toContain("Migrações paralisadas");
    expect(biPageSource).toContain("Motivo: ${migration.motivo}");
    expect(biPageSource).toContain("filteredPausedMigrationData");
    expect(biMetricsSource).toContain("Implantação atrasada");
    expect(biMetricsSource).toContain("Onboarding atrasado");
    expect(biMetricsSource).toContain("Atrasados para Ongoing");
    expect(biMetricsSource).toContain("getUnflaggedOverdueGroups");
    expect(biMetricsSource).toContain("calculateAverageTTV");
    expect(biMetricsSource).toContain("calculateAverageSubobjectiveTTV");
    expect(biPageSource).toContain("Todos os CSMs");
    expect(biPageSource).toContain("Filtrar por objetivo");
    expect(biPageSource).toContain("selectedObjectives");
    expect(biPageSource).toContain("filterClientsByObjectiveFilters");
    expect(biPageSource).toContain("Filtrar por objetivo global");
    expect(biPageSource).toContain("Filtrar por subobjetivo");
    expect(biPageSource).toContain("Gerar relatório");
    expect(biPageSource).toContain("TTV médio");
    expect(biPageSource).toContain("TTV médio dos subobjetivos");
    expect(biPageSource).toContain("subobjectiveCompletionMetrics");
    expect(biPageSource).toContain("Atrasados sem Flag");
    expect(biPageSource).toContain("Quantidade de clientes por CSM");
    expect(biPageSource).toContain("Valor financeiro por CSM");
    expect(biPageSource).toContain("Tempo de implantação por objetivo");
    expect(biPageSource).toContain("Tempo de conclusão por subobjetivo");
    expect(biPageSource).toContain("groupAverageTTVBySubobjective");
    expect(biPageSource).toContain("Nomes iguais em objetivos globais diferentes");
    expect(biPageSource).toContain("groupAverageTTVByObjective");
    expect(biPageSource).toContain("generateBIManagementReport");
    expect(biPageSource).toContain("PDF gerencial gerado com sucesso.");
    expect(biPageSource).toContain("getFlaggedOverdueGroups");
    expect(biReportPdfSource).toContain("Clientes atrasados em implantação sem flag");
    expect(biReportPdfSource).toContain("Clientes atrasados em implantação com flag");
    expect(biReportPdfSource).toContain("TTV médio geral");
    expect(biReportPdfSource).toContain("TTV médio por objetivo");
    expect(biReportPdfSource).toContain("doc.save");
    expect(biPageSource).not.toContain("Inteligência financeira");
    expect(biPageSource).not.toContain("Área de BI preparada");
    expect(biPageSource).toContain("Clique para ver os clientes");
    expect(biPageSource).not.toContain("localStorage");
    expect(biPageSource).toContain("xl:grid-cols-7");
    expect(biPageSource).toContain("Subobjetivos");
    expect(biPageSource).toContain("overflow-x-hidden");
    expect(biPageSource).toContain('className="min-h-screen overflow-x-hidden');
    expect(biPageSource).toContain("xl:grid-cols-4");
    expect(biPageSource).toContain("xl:grid-cols-3");
    expect(biPageSource).toContain("Health Score médio por CSM");
    expect(sideMenuSource).toContain("adminOnly: true");
  });

  it("uses the blue action icon to mark contact in Marcos", () => {
    expect(cardSource).toContain("contactButton.label");
    expect(cardSource).toContain("<Phone className=\"w-4 h-4\" />");
    expect(cardSource).toContain('aba: "marcos"');
  });

  it("offers contact age filters in Ongoing and marks column K after attendance", () => {
    expect(ongoingPageSource).toContain("Sem contato há");
    expect(ongoingPageSource).toContain('value="mais60"');
    expect(ongoingPageSource).toContain("origem=\"ongoing\"");
    expect(ongoingCardSource).toContain('title="Registrar Atendimento"');
    expect(atendimentoModalSource).toContain("origem?: \"marcos\" | \"ongoing\"");
    expect(atendimentoModalSource).toContain("origem,");
  });
});
