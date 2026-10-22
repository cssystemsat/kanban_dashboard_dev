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
const dbSource = readFileSync(
  new URL("./db.ts", import.meta.url),
  "utf8"
);
const schemaSource = readFileSync(
  new URL("../drizzle/schema.ts", import.meta.url),
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

  it("permite criação manual para admins reconhecidos pelo e-mail", () => {
    expect(routerSource).toContain("isEmailAdmin(userEmail)");
    expect(routerSource).toContain("Apenas administradores podem criar cards");
  });

  it("permite editar CSM, Comercial e data de início com CSM livre", () => {
    expect(source).toContain('placeholder="CSM"');
    expect(source).toContain("Editar informações");
    expect(source).toContain("Salvar alterações");
    expect(source).toContain("trpc.appKanban.updateInfo.useMutation");
    expect(routerSource).toContain("updateInfo: protectedProcedure");
    expect(routerSource).toContain("startDate: new Date(`${input.startDate}T00:00:00.000Z`)");
    expect(routerSource).toContain("Apenas administradores podem editar informações dos cards");
  });

  it("revalida o kanban para ocultar cards após Chave Virada", () => {
    expect(source).toContain("refetchInterval: 60_000");
    expect(dbSource).toContain('stage === "app_entregue" ? new Date() : null');
    expect(dbSource).toContain("isAppKanbanCardVisible(card)");
    expect(source).toContain("Chave Virada");
    expect(source).toContain("formatKeyTurnedCountdown");
    expect(routerSource).toContain("keyTurnedAt: input.keyTurned ? new Date() : null");
  });

  it("exibe somente os sete requisitos no modal Dados", () => {
    expect(source).toContain("Checklist de requisitos");
    for (const label of [
      "Logomarca",
      "Nome do app",
      "Descrição Curta",
      "Descrição Longa",
      "Loja propria",
      "Site da empresa",
      "Política de privacidade",
    ]) {
      expect(source).toContain(label);
    }
    expect(routerSource).toContain("nomeApp: z.boolean().optional()");
    expect(routerSource).toContain("lojaPropria: z.boolean().optional()");
    expect(routerSource).toContain("siteEmpresa: z.boolean().optional()");
  });

  it("persiste os checks de iOS/Android e os links no App entregue", () => {
    expect(source).toContain('stage.id === "teste_liberacao"');
    expect(source).toContain('stage.id === "app_entregue"');
    expect(source).toContain('"iosRejected", "iOS"');
    expect(source).toContain('"androidRejected", "Android"');
    expect(source).toContain("Link2");
    expect(source).toContain("iosStoreUrl");
    expect(source).toContain("androidStoreUrl");
    expect(routerSource).toContain("updateReleaseDetails");
    expect(schemaSource).toContain('iosRejected: boolean("iosRejected")');
    expect(schemaSource).toContain('androidRejected: boolean("androidRejected")');
    expect(schemaSource).toContain('iosStoreUrl: varchar("iosStoreUrl"');
    expect(schemaSource).toContain('androidStoreUrl: varchar("androidStoreUrl"');
  });
});
