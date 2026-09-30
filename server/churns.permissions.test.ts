import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const settings = readFileSync(new URL("../client/src/pages/Configuracoes.tsx", import.meta.url), "utf8");
const churns = readFileSync(new URL("../client/src/pages/Churns.tsx", import.meta.url), "utf8");

describe("permissão de cadastro de motivos em Churn", () => {
  it("persiste e configura a permissão separada de mover cards", () => {
    expect(schema).toContain('canAddChurnMotivo: int("canAddChurnMotivo")');
    expect(router).toContain("canAddChurnMotivo: z.boolean()");
    expect(router).toContain("entry?.canAddChurnMotivo === 1");
    expect(settings).toContain("Pode adicionar motivos na aba Churn");
    expect(settings).toContain("setEditCanAddChurnMotivo");
    expect(churns).toContain("canAddChurnMotivo");
    expect(churns).toContain("ultimoBoleto");
  });

  it("inicia o filtro de meses em Todos e permite selecionar meses individualmente", () => {
    expect(churns).toContain("const allMonthsSelected = selectedMonths.size === MONTHS.length");
    expect(churns).toContain("filter(value => value !== month)");
    expect(churns).toContain("const next = new Set(MONTHS.map");
    expect(churns).toContain("activeTimeRange");
    expect(churns).not.toContain("disabled={showAllMonths}");
  });
});
