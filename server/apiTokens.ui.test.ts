import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const toolsSource = readFileSync(resolve(process.cwd(), "client/src/pages/Ferramentas.tsx"), "utf8");

describe("documentação inicial e tokens da API", () => {
  it("persiste apenas o hash do token e permite revogação", () => {
    expect(schemaSource).toContain('mysqlTable(\n  "api_tokens"');
    expect(schemaSource).toContain("tokenHash");
    expect(schemaSource).toContain("revokedAt");
    expect(routerSource).toContain("createHash(\"sha256\")");
    expect(routerSource).toContain("randomBytes(32)");
    expect(routerSource).toContain("revokeApiToken");
  });

  it("restringe gerenciamento de tokens a administradores e a usuários autorizados", () => {
    expect(routerSource).toContain("apiTokens: router({");
    expect(routerSource).toContain("await assertAdmin(ctx)");
    expect(routerSource).toContain("O usuário precisa estar na lista de permissões");
  });

  it("mostra a documentação dentro de Ferramentas e revela o token apenas após a criação", () => {
    expect(toolsSource).toContain('id: "api"');
    expect(toolsSource).toContain("Documentação da API");
    expect(toolsSource).toContain("Gerar token");
    expect(toolsSource.toLowerCase()).toContain("este é o único momento em que o valor completo aparece");
    expect(toolsSource).toContain("Authorization: Bearer SEU_TOKEN");
  });
});
