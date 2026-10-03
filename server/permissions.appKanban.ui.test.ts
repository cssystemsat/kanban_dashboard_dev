import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const configSource = readFileSync(
  new URL("../client/src/pages/Configuracoes.tsx", import.meta.url),
  "utf8"
);
const menuSource = readFileSync(
  new URL("../client/src/components/SideMenu.tsx", import.meta.url),
  "utf8"
);
const appSource = readFileSync(
  new URL("../client/src/App.tsx", import.meta.url),
  "utf8"
);

describe("permissões do App Personalizado", () => {
  it("mantém BI exclusivo para administradores", () => {
    expect(configSource).not.toContain('{ id: "bi", label: "BI" }');
    expect(menuSource).toContain('{ id: "bi", label: "BI", icon: BarChart3, adminOnly: true }');
    expect(appSource).toContain('case "bi":');
    expect(appSource).toContain('permission.isAdmin ? <BI /> : <AdminOnlyScreen area="A aba BI" />');
  });

  it("trata App Personalizado como uma aba normal configurável", () => {
    expect(configSource).toContain(
      '{ id: "apppersonalizado", label: "App Personalizado" }'
    );
    expect(configSource).not.toContain("Ver apenas a aba App Personalizado");
    expect(configSource).not.toContain("newOnlyAppKanban");
    expect(configSource).not.toContain("editOnlyAppKanban");
    expect(menuSource).not.toContain("onlyAppKanban");
    expect(appSource).not.toContain("Redirecionar usuários com onlyAppKanban");
  });

  it("preserva a permissão separada para mover cards", () => {
    expect(configSource).toContain("Pode mover cards no App Personalizado");
    expect(configSource).toContain("canMoveAppKanban: newCanMoveAppKanban");
    expect(configSource).toContain(
      "canMoveAppKanban: editCanMoveAppKanban"
    );
  });
});
