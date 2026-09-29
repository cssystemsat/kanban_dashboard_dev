import { describe, expect, it } from "vitest";
import {
  normalizeCompanyName,
  parseAppKanbanSheetRows,
} from "./appKanbanSheetSync";

describe("sincronização do App Kanban pela planilha", () => {
  it("lê data, cliente e comercial nas colunas A, B e C", () => {
    const rows = parseAppKanbanSheetRows(
      "Data,CLIENTE,Comercial\n27/02/2026,Elite Rastreio,Aline\n31/03/2026,JDF Rastreamento,Carlos"
    );
    expect(rows).toEqual([
      {
        startDate: "2026-02-27",
        companyName: "Elite Rastreio",
        comercial: "Aline",
      },
      {
        startDate: "2026-03-31",
        companyName: "JDF Rastreamento",
        comercial: "Carlos",
      },
    ]);
  });

  it("ignora linhas vazias e o cabeçalho CLIENTE", () => {
    const rows = parseAppKanbanSheetRows(
      "Data,CLIENTE,Comercial\n,,\n,CLIENTE,\n2026-09-28,Nova Empresa,Aline"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].companyName).toBe("Nova Empresa");
  });

  it("normaliza o nome para comparação sem duplicar por maiúsculas/minúsculas", () => {
    expect(normalizeCompanyName("  Nova Empresa ")).toBe("NOVA EMPRESA");
    expect(normalizeCompanyName("nova empresa")).toBe("NOVA EMPRESA");
  });
});
