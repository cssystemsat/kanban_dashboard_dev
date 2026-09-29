import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../client/src/pages/AppPersonalizado.tsx", import.meta.url),
  "utf8"
);
const routerSource = readFileSync(
  new URL("./routers.ts", import.meta.url),
  "utf8"
);

describe("atualização do App Kanban pela planilha", () => {
  it("exibe o botão e recarrega os cards após sincronizar", () => {
    expect(source).toContain("Atualizar planilha");
    expect(source).toContain("trpc.appKanban.syncFromSheet.useMutation");
    expect(source).toContain("await listCards.refetch()");
  });

  it("sincroniza automaticamente uma vez ao entrar na aba", () => {
    expect(source).toContain("automaticSyncStarted");
    expect(source).toContain("if (!isAdmin || automaticSyncStarted.current)");
    expect(source).toContain("syncFromSheet.mutateAsync()");
  });

  it("usa a planilha informada, ignora duplicidades e grava na primeira etapa", () => {
    expect(routerSource).toContain("1mXbOUE2cGh95UOKUj33H9jHApE0i28my-_XnPI2YjWY");
    expect(routerSource).toContain("parseAppKanbanSheetRows");
    expect(routerSource).toContain("syncAppKanbanCards(rows");
  });
});
