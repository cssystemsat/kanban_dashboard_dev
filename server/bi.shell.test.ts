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

  it("exibe os três KPIs dinâmicos baseados na aba Marcos", () => {
    expect(biMetricsSource).toContain("Clientes em implantação");
    expect(biMetricsSource).toContain("Clientes em onboarding");
    expect(biMetricsSource).toContain('label: "Implantados"');
    expect(biPageSource).toContain("Clique para ver os clientes");
    expect(biPageSource).not.toContain("localStorage");
  });

  it("replaces the blue atendimento action icon without implementing BI rules yet", () => {
    expect(cardSource).toContain('title="BI do cliente"');
    expect(cardSource).toContain("<BarChart3 className=\"w-4 h-4\" />");
    expect(cardSource).not.toContain('title="Registrar atendimento"');
  });
});
