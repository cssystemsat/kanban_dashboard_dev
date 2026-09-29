import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../client/src/pages/AppPersonalizado.tsx", import.meta.url),
  "utf8"
);

describe("filtro comercial do App Personalizado", () => {
  it("renderiza o seletor e monta as opções a partir dos cards", () => {
    expect(source).toContain('aria-label="Filtrar por Comercial"');
    expect(source).toContain('value="all">Todos os Comerciais');
    expect(source).toContain("commercialOptions.map");
    expect(source).toContain("new Set(cards.map(card => card.comercial");
  });

  it("aplica o Comercial junto com a busca e a etapa do Kanban", () => {
    expect(source).toContain(
      'commercialFilter === "all" || card.comercial === commercialFilter'
    );
    expect(source).toContain(
      "return matchesStage && matchesSearch && matchesCommercial;"
    );
  });
});
