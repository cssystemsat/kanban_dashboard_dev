import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  new URL("../client/src/pages/Ferramentas.tsx", import.meta.url),
  "utf8"
);
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const schemaSource = readFileSync(
  new URL("../drizzle/schema.ts", import.meta.url),
  "utf8"
);
const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

describe("central de Objetivos", () => {
  it("exibe o item administrativo de Objetivos em Ferramentas", () => {
    expect(pageSource).toContain('id: "objectives"');
    expect(pageSource).toContain("<ObjectivesPage />");
    expect(pageSource).toContain("Cadastrar objetivo");
  });

  it("permite múltiplos subobjetivos com prazo em dias", () => {
    expect(pageSource).toContain("Subobjetivos e prazos");
    expect(pageSource).toContain("deadlineDays");
    expect(pageSource).toContain("+ Adicionar subobjetivo");
    expect(pageSource).toContain("até {subobjective.deadlineDays}");
  });

  it("persiste objetivos e subobjetivos em tabelas separadas", () => {
    expect(schemaSource).toContain("objectiveTemplates");
    expect(schemaSource).toContain("objectiveTemplateSubobjectives");
    expect(schemaSource).toContain("deadlineDays");
    expect(dbSource).toContain("createObjectiveTemplate");
    expect(dbSource).toContain("getObjectiveTemplates");
  });

  it("protege a listagem e o cadastro para administradores", () => {
    expect(routerSource).toContain("objectives: router({");
    expect(routerSource).toContain("getObjectiveTemplates()");
    expect(routerSource).toContain("createObjectiveTemplate(");
    expect(routerSource).toContain("await assertAdmin(ctx)");
  });
});
