import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Performance page navigation", () => {
  const sideMenuSource = readFileSync(
    resolve(process.cwd(), "client/src/components/SideMenu.tsx"),
    "utf8"
  );
  const appSource = readFileSync(
    resolve(process.cwd(), "client/src/App.tsx"),
    "utf8"
  );
  const pageSource = readFileSync(
    resolve(process.cwd(), "client/src/pages/Performance.tsx"),
    "utf8"
  );

  it("has a Performance page and routes it from the application", () => {
    expect(pageSource).toContain("export default function Performance");
    expect(appSource).toContain(
      'import Performance from "./pages/Performance";'
    );
    expect(appSource).toContain('case "performance":');
    expect(appSource).toContain("permission.isAdmin");
    expect(appSource).toContain("AdminOnlyScreen");
  });

  it("places Performance after Painel only in the admin menu group", () => {
    const publicStart = sideMenuSource.indexOf("const PUBLIC_ITEMS");
    const publicEnd = sideMenuSource.indexOf("];", publicStart);
    const painelIndex = sideMenuSource.indexOf('id: "painel"', publicStart);
    const adminTopIndex = sideMenuSource.indexOf("const ADMIN_TOP_ITEMS");
    const performanceIndex = sideMenuSource.indexOf(
      'id: "performance"',
      adminTopIndex
    );

    expect(painelIndex).toBeGreaterThanOrEqual(publicStart);
    expect(painelIndex).toBeLessThan(publicEnd);
    expect(sideMenuSource.slice(publicStart, publicEnd)).not.toContain(
      'id: "performance"'
    );
    expect(adminTopIndex).toBeGreaterThan(publicEnd);
    expect(performanceIndex).toBeGreaterThan(adminTopIndex);
    expect(sideMenuSource).toContain(
      "isAdmin && ADMIN_TOP_ITEMS.map(renderItem)"
    );
  });

  it("renders the three ranking columns with scoring and penalty tooltips", () => {
    expect(pageSource).toContain('title="Ongoing"');
    expect(pageSource).toContain('title="Onboarding"');
    expect(pageSource).toContain('title="Geral"');
    expect(pageSource).toContain("analystScores");
    expect(pageSource).toContain("meta de contato");
  });

  it("shows the current week summary and keeps weekly and monthly simulations reversible", () => {
    expect(pageSource).toContain("Semana vigente:");
    expect(pageSource).toContain("Simular semana");
    expect(pageSource).toContain("Simular mês");
    expect(pageSource).toContain("Desfazer semana");
    expect(pageSource).toContain("Desfazer mês");
    expect(pageSource).toContain(
      "setWeeklySimulationActive(active => !active)"
    );
    expect(pageSource).toContain(
      "setMonthlySimulationActive(active => !active)"
    );
    expect(pageSource).toContain("meta de cobertura mensal (< 90%)");
    expect(pageSource).not.toContain("Todos começam com <strong");
  });

  it("keeps the week in the compact top header and brings ranking tables upward", () => {
    expect(pageSource).toContain("bg-white px-5 py-3");
    expect(pageSource).toContain('<section className="p-3 md:p-4">');
    expect(pageSource).toContain("grid grid-cols-1 gap-4 xl:grid-cols-3");
  });
});
