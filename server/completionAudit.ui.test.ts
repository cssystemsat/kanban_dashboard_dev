import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sideMenu = readFileSync(new URL("../client/src/components/SideMenu.tsx", import.meta.url), "utf8");
const badge = readFileSync(new URL("../client/src/components/CompletionAuditBadge.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../client/src/hooks/useCompletionAudit.ts", import.meta.url), "utf8");

describe("completion audit UI", () => {
  it("exibe a auditoria no item lateral ativo de Marcos e Ongoing", () => {
    expect(sideMenu).toContain('item.id === "marcos" || item.id === "ongoing"');
    expect(sideMenu).toContain("CompletionAuditBadge");
    expect(sideMenu).toContain('enabled={isActive}');
  });

  it("mostra CSM, cliente e campos pendentes em modal clicável", () => {
    expect(badge).toContain("Pendências de");
    expect(badge).toContain("CSM");
    expect(badge).toContain("O que falta preencher");
    expect(badge).toContain("Ver pendências de preenchimento");
    expect(badge).toContain("audit.totalMissingClients > 0");
    expect(badge).toContain("Filtrar por CSM");
    expect(badge).toContain("Todos os CSMs");
    expect(badge).toContain("selectedCsm");
  });

  it("usa as abas corretas das planilhas principal", () => {
    expect(hook).toContain("gid=0");
    expect(hook).toContain("gid=1152476970");
    expect(hook).toContain("auditMarcos");
    expect(hook).toContain("auditOngoing");
  });
});
