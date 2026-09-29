import { describe, it } from "vitest";

/**
 * A integração do App Kanban depende de um banco isolado.
 * O preview e a produção compartilham o banco real do usuário, portanto a
 * suíte não pode criar, mover ou excluir empresas fictícias durante publicação.
 * Os contratos do router e da interface permanecem cobertos pelos testes
 * appkanban.sheetSync.ui.test.ts, appkanban.comercialFilter.ui.test.ts e
 * appkanban.permissions.appKanban.ui.test.ts.
 */
describe("App Kanban - integração", () => {
  it.skip("executar somente em banco de teste isolado", () => {
    // Intencionalmente vazio: evita efeitos colaterais no banco compartilhado.
  });
});
