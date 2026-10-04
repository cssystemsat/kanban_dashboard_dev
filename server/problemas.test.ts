import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  normalizeProblemFlag,
  parseProblemasMarcosRows,
  PROBLEM_STAGES,
} from "./problemsSync";
import { filterProblemCards } from "@/lib/problemasFilters";

const root = resolve(__dirname, "..");
const pageSource = readFileSync(
  resolve(root, "client/src/pages/Problemas.tsx"),
  "utf8"
);
const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const dbSource = readFileSync(resolve(root, "server/db.ts"), "utf8");
const menuSource = readFileSync(
  resolve(root, "client/src/components/SideMenu.tsx"),
  "utf8"
);
const configSource = readFileSync(
  resolve(root, "client/src/pages/Configuracoes.tsx"),
  "utf8"
);
const appSource = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");

describe("aba Problemas", () => {
  it("aceita somente Yellow, Red e Black Flag", () => {
    expect(normalizeProblemFlag("Yellow Flag")).toBe("Yellow Flag");
    expect(normalizeProblemFlag("red flag")).toBe("Red Flag");
    expect(normalizeProblemFlag("FLAG PRETA")).toBe("Black Flag");
    expect(normalizeProblemFlag("Green Flag")).toBeNull();
    expect(normalizeProblemFlag("")).toBeNull();
  });

  it("mapeia os campos de Marcos e ignora clientes sem flag", () => {
    const header = Array.from({ length: 24 }, (_, index) => `C${index}`).join(
      ","
    );
    const flagged = Array.from({ length: 24 }, () => "");
    flagged[0] = "COD-100";
    flagged[1] = "Central Exemplo";
    flagged[2] = "CSM Ana";
    flagged[5] = '"R$ 1.250,00"';
    flagged[14] = "Red Flag";
    flagged[18] = "1024";
    flagged[23] = "Comercial João";
    const ignored = Array.from({ length: 24 }, () => "");
    ignored[1] = "Sem flag";

    const rows = parseProblemasMarcosRows(
      `${header}\n${flagged.join(",")}\n${ignored.join(",")}`
    );

    expect(rows).toEqual([
      expect.objectContaining({
        clientKey: "central:1024",
        clientName: "Central Exemplo",
        csm: "CSM Ana",
        comercial: "Comercial João",
        boleto: "R$ 1.250,00",
        flag: "Red Flag",
      }),
    ]);
  });

  it("mantém as seis colunas solicitadas e edição compartilhada", () => {
    expect(PROBLEM_STAGES).toEqual([
      "nova_flag",
      "plano_acao_feito",
      "em_tratativa",
      "precisa_escalonar",
      "fora_do_setor",
      "resolvida",
    ]);
    expect(pageSource).toContain('label: "Nova Flag"');
    expect(pageSource).toContain('label: "Plano de ação feito"');
    expect(pageSource).toContain('label: "Em tratativa"');
    expect(pageSource).toContain('label: "Precisa escalonar"');
    expect(pageSource).toContain('label: "Fora do setor"');
    expect(pageSource).toContain('label: "Resolvida"');
    expect(pageSource).toContain("Relato do problema");
    expect(pageSource).toContain("Plano de ação");
    expect(pageSource).toContain("Responsável");
    expect(pageSource).toContain("Atualizar flags");
    expect(pageSource).toContain("syncFromMarcos");
  });

  it("filtra cards por CSM e por tipo de flag", () => {
    const cards = [
      {
        id: 1,
        csm: "Ana",
        flag: "Red Flag",
      },
      {
        id: 2,
        csm: "Bruno",
        flag: "Yellow Flag",
      },
      {
        id: 3,
        csm: "Ana",
        flag: "Black Flag",
      },
    ] as Parameters<typeof filterProblemCards>[0];

    expect(filterProblemCards(cards, "ana", "").map(card => card.id)).toEqual([
      1,
      3,
    ]);
    expect(
      filterProblemCards(cards, "Ana", "Black Flag").map(card => card.id)
    ).toEqual([3]);
    expect(filterProblemCards(cards, "", "Yellow Flag").map(card => card.id)).toEqual([
      2,
    ]);
  });

  it("mantém filtros e colunas sem overflow em diferentes larguras", () => {
    expect(pageSource).toContain('aria-label="Filtrar problemas por CSM"');
    expect(pageSource).toContain('aria-label="Filtrar problemas por tipo de flag"');
    expect(pageSource).toContain("overflow-x-hidden");
    expect(pageSource).toContain("lg:h-[calc(100vh-185px)]");
    expect(pageSource).toContain("2xl:grid-cols-6");
  });

  it("preserva a tratativa e encerra cards apenas quando a flag é removida", () => {
    expect(dbSource).toContain("sem apagar relato, plano, prazo");
    expect(dbSource).toContain("!activeKeys.has(current.clientKey)");
    expect(dbSource).toContain("set({ isActive: 0 })");
    expect(routerSource).toContain("problemas: router({");
    expect(routerSource).toContain("syncFromMarcos");
    expect(routerSource).toContain("updateProblemasCard");
    expect(routerSource).toContain("moveProblemasCard");
  });

  it("inclui a aba entre as permissões, o menu e as rotas", () => {
    expect(menuSource).toContain('{ id: "problemas", label: "Problemas"');
    expect(configSource).toContain('{ id: "problemas", label: "Problemas" }');
    expect(appSource).toContain('case "problemas":');
    expect(appSource).toContain("return <Problemas />");
  });
});
