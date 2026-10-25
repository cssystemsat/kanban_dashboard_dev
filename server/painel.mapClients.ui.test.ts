import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(
  new URL("../client/src/components/BrazilMapPainel.tsx", import.meta.url),
  "utf8"
);
const hook = readFileSync(
  new URL("../client/src/hooks/useEstadosData.ts", import.meta.url),
  "utf8"
);

describe("mapa e lista detalhada do Painel", () => {
  it("mostra os indicadores estaduais conectados ao ponto do mapa", () => {
    expect(component).toContain("estado e contagem");
    expect(component).toContain("borderColor: borderColor");
    expect(component).toContain("clientsByState[state]?.length");
    expect(component).toContain("STATE_LABEL_OFFSETS");
    expect(component).toContain("{state}");
  });

  it("lista cliente, boleto, cidade, estado e comercial", () => {
    expect(component).toContain("Clientes por estado");
    expect(component).toContain("Boleto");
    expect(component).toContain("Cidade");
    expect(component).toContain("Estado");
    expect(component).toContain("Comercial");
    expect(component).toContain("client.cidade");
  });

  it("mantém exportação em XLSX", () => {
    expect(component).toContain('import * as XLSX from "xlsx"');
    expect(component).toContain("XLSX.writeFile");
    expect(component).toContain("Exportar XLSX");
  });

  it("permite exportar somente os clientes do estado aberto no modal", () => {
    expect(component).toContain("exportStateToXLSX");
    expect(component).toContain("selectedStateClients.map");
    expect(component).toContain("Exportar Excel");
    expect(component).toContain("clientes_${selectedState.toLowerCase()}");
  });

  it("lê cidade da coluna AI", () => {
    expect(hook).toContain("row[34]");
    expect(hook).toContain("cidade");
  });
});
