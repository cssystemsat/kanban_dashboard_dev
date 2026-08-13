import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Performance page navigation', () => {
  const sideMenuSource = readFileSync(resolve(process.cwd(), 'client/src/components/SideMenu.tsx'), 'utf8');
  const appSource = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
  const pageSource = readFileSync(resolve(process.cwd(), 'client/src/pages/Performance.tsx'), 'utf8');

  it('has a Performance page and routes it from the application', () => {
    expect(pageSource).toContain("export default function Performance");
    expect(appSource).toContain("import Performance from './pages/Performance';");
    expect(appSource).toContain("case 'performance':");
    expect(appSource).toContain("currentPage !== 'performance' && <ChecklistPanel />");
  });

  it('places Performance immediately after Painel in the public menu', () => {
    const painelIndex = sideMenuSource.indexOf("{ id: 'painel'");
    const performanceIndex = sideMenuSource.indexOf("{ id: 'performance'");
    expect(painelIndex).toBeGreaterThanOrEqual(0);
    expect(performanceIndex).toBeGreaterThan(painelIndex);
    expect(performanceIndex).toBeLessThan(sideMenuSource.indexOf('];', painelIndex));
  });

  it('renders the three ranking columns with scoring and penalty tooltips', () => {
    expect(pageSource).toContain("title=\"Ongoing\"");
    expect(pageSource).toContain("title=\"Onboarding\"");
    expect(pageSource).toContain("title=\"Geral\"");
    expect(pageSource).toContain("analystScores");
    expect(pageSource).toContain("meta de contato");
  });

  it('shows only the current week summary and keeps the penalty simulation reversible', () => {
    expect(pageSource).toContain('Semana vigente:');
    expect(pageSource).toContain("'Simular semana'");
    expect(pageSource).toContain('Desfazer Simulação');
    expect(pageSource).toContain('setSimulationActive((active) => !active)');
    expect(pageSource).not.toContain('Todos começam com <strong');
  });

  it('keeps the week in the compact top header and brings ranking tables upward', () => {
    expect(pageSource).toContain('bg-white px-5 py-3');
    expect(pageSource).toContain('<section className="p-3 md:p-4">');
    expect(pageSource).toContain('grid grid-cols-1 gap-4 xl:grid-cols-3');
  });
});
