import { describe, expect, it } from "vitest";
import {
  GLOBAL_OBJECTIVES,
  getGlobalObjectiveDefinition,
} from "@shared/globalObjectives";

describe("catálogo de objetivos globais", () => {
  it("contém todos os objetivos globais solicitados", () => {
    expect(GLOBAL_OBJECTIVES.map(objective => objective.name)).toEqual([
      "Migração",
      "Videotelemetria",
      "Rede CAN",
      "Licitação",
      "Logistics",
      "Performance",
      "Performance Plus",
      "Manutenção",
      "Fretamento",
      "Jornada de Trabalho",
      "BI",
      "Gestão de Multa",
      "Integração",
      "Rastreamento básico",
      "Gestão de frota",
    ]);
  });

  it("resolve nomes com diferenças de caixa e acentuação", () => {
    expect(getGlobalObjectiveDefinition("videotelemetria")?.name).toBe(
      "Videotelemetria"
    );
    expect(getGlobalObjectiveDefinition("GESTÃO DE FROTA")?.subobjectives).toHaveLength(
      8
    );
  });

  it("mantém subobjetivos não vazios e sem duplicação dentro de cada global", () => {
    for (const objective of GLOBAL_OBJECTIVES) {
      expect(objective.subobjectives.length).toBeGreaterThan(0);
      expect(objective.subobjectives.every(value => value.trim().length > 0)).toBe(
        true
      );
      expect(new Set(objective.subobjectives).size).toBe(
        objective.subobjectives.length
      );
    }
  });
});
