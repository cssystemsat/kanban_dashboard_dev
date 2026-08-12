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
  });

  it('places Performance immediately after Painel in the public menu', () => {
    const painelIndex = sideMenuSource.indexOf("{ id: 'painel'");
    const performanceIndex = sideMenuSource.indexOf("{ id: 'performance'");
    expect(painelIndex).toBeGreaterThanOrEqual(0);
    expect(performanceIndex).toBeGreaterThan(painelIndex);
    expect(performanceIndex).toBeLessThan(sideMenuSource.indexOf('];', painelIndex));
  });
});
