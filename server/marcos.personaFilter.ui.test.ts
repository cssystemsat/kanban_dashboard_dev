import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  new URL("../client/src/pages/Home.tsx", import.meta.url),
  "utf8"
);
const kanbanDataSource = readFileSync(
  new URL("../client/src/hooks/useKanbanData.ts", import.meta.url),
  "utf8"
);

describe("Filtro de Persona em Marcos", () => {
  it("lê Persona da coluna Y e oferece o filtro no cabeçalho", () => {
    expect(kanbanDataSource).toContain("const personaIdx = 24");
    expect(kanbanDataSource).toContain("persona = row[personaIdx]");
    expect(homeSource).toContain("selectedPersona");
    expect(homeSource).toContain('aria-label="Filtrar por Persona"');
    expect(homeSource).toContain('Persona: Todas');
  });

  it("combina Persona com os demais filtros e atualiza as contagens", () => {
    expect(homeSource).toContain(
      "filteredData = filteredData.filter(client => client.persona === selectedPersona)"
    );
    expect(homeSource).toContain(
      "baseDataForCounts = baseDataForCounts.filter("
    );
    expect(homeSource).toContain("Persona: {selectedPersona}");
  });
});
