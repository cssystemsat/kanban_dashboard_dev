import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseTimelineCsvRows } from "../client/src/lib/timelineCsv";

const sideMenuSource = readFileSync(
  resolve(process.cwd(), "client/src/components/SideMenu.tsx"),
  "utf8"
);
const appSource = readFileSync(
  resolve(process.cwd(), "client/src/App.tsx"),
  "utf8"
);
const timelineSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Timeline.tsx"),
  "utf8"
);

describe("aba Timeline", () => {
  it("aparece no menu com ícone de pessoa", () => {
    expect(sideMenuSource).toContain('id: "timeline"');
    expect(sideMenuSource).toContain('label: "Timeline"');
    expect(sideMenuSource).toContain("UserRound");
  });

  it("está registrada na lista de páginas e no switch do App", () => {
    expect(appSource).toContain('"timeline"');
    expect(appSource).toContain('case "timeline":');
    expect(appSource).toContain(
      "<Timeline sidebarExpanded={isSideMenuExpanded} />"
    );
    expect(appSource).toContain(
      '!user && (currentPage === "marcos" || currentPage === "timeline")'
    );
  });

  it("preserva descrições com quebras de linha como um único acontecimento", () => {
    const description = [
      "Cliente entrou em contato informando que os veículos entraram numa região da roça, onde pararam de comunicar, e queria saber se era conectividade, porque apesar de ser roça, tem conexão no celular dele.",
      "Perguntei a operadora do celular e do rastreador, e informou que são iguais, ambas vivo.",
      "Falou que sempre que entra nessa área é a mesma coisa, antes de entrar e quando sai, funciona normalmente, mas nessa região não.",
    ].join("\n");
    const csv = `Cliente,Data,Título,Setor,Tag,Descrição,CSM\nOrionsat,16/09/2026,Contato,CSM,Problema,"${description}",Ana`;
    const rows = parseTimelineCsvRows(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.client).toBe("Orionsat");
    expect(rows[0]?.event.description).toBe(description);
    expect(rows[0]?.event.csm).toBe("Ana");
  });

  it("mantém a Timeline maximizada sem overflow lateral ao abrir detalhes", () => {
    expect(timelineSource).not.toContain("overflow-x-auto");
    expect(timelineSource).not.toContain("min-w-[760px]");
    expect(timelineSource).toContain("overflow-x-hidden");
    expect(timelineSource).toContain("min-w-0");
    expect(timelineSource).toContain('"md:w-[calc(100%-80px)]"');
    expect(timelineSource).toContain('"md:w-[calc(100%-200px)]"');
    expect(timelineSource).toContain("break-words");
  });

  it("expõe refresh manual sem perder cliente ou filtro", () => {
    expect(timelineSource).toContain('title="Atualizar dados da planilha"');
    expect(timelineSource).toContain('"Atualizando..."');
    expect(timelineSource).toContain("clearSheetsCache");
    expect(timelineSource).not.toContain("await fetchData()");
    expect(timelineSource).toContain("setRefreshNonce(Date.now())");
    expect(timelineSource).toContain("selectedClientId");
    expect(timelineSource).toContain("selectedTag");
  });

  it("usa a aba de acontecimentos como fonte dinâmica de clientes e eventos", () => {
    expect(timelineSource).not.toContain("useKanbanData");
    expect(timelineSource).toContain("const timelineClients");
    expect(timelineSource).toContain("parseTimelineCsvRows");
    expect(timelineSource).toContain('refetchOnMount: "always"');
    expect(timelineSource).toContain("staleTime: 0");
    expect(timelineSource).toContain('id="timeline-client"');
    expect(timelineSource).toContain("selectedClientId");
    expect(timelineSource).toContain("selectedTag");
    expect(timelineSource).toContain('id="timeline-tag"');
    expect(timelineSource).toContain("Todas as Tags");
    expect(timelineSource).toContain("normalizeTag(event.tag)");
    expect(timelineSource).toContain("timelineClients.map(client =>");
    expect(timelineSource).toContain("Selecione um cliente...");
    expect(timelineSource).toContain("FRICCOES_GID = 594161358");
    expect(timelineSource).toContain("trpc.sheets.csv.useQuery");
    expect(timelineSource).toContain("parseFriccaoEvents");
    expect(timelineSource).toContain("normalizeClientName");
    expect(timelineSource).toContain('replace(/\\s+/g, " ")');
    expect(timelineSource).toContain("eventsByDay");
    expect(timelineSource).toContain("daysSincePrevious");
    expect(timelineSource).toContain("formatElapsedDays");
    expect(timelineSource).toContain('"No mesmo dia"');
    expect(timelineSource).toContain("event.title");
    expect(timelineSource).toContain("event.sector");
    expect(timelineSource).toContain("event.tag");
    expect(timelineSource).toContain("getTagColor");
    expect(timelineSource).toContain("TAG_LEGEND");
    expect(timelineSource).toContain('aria-hidden="true"');
    expect(timelineSource).toContain('case "migracao"');
    expect(timelineSource).toContain('case "friccao"');
    expect(timelineSource).toContain('case "travamento"');
    expect(timelineSource).toContain("transitionEvent");
    expect(timelineSource).toContain("top-[104px]");
    expect(timelineSource).toContain("event.description");
    expect(timelineSource).toContain("event.csm");
    expect(timelineSource).toContain("tabIndex={0}");
    expect(timelineSource).toContain("openEventKey");
    expect(timelineSource).toContain("aria-expanded={isOpen}");
    expect(timelineSource).toContain("onClick={() =>");
    expect(timelineSource).toContain(
      'className={`${isOpen ? "block" : "hidden"}'
    );
    expect(timelineSource).not.toContain("group-hover:block group-focus:block");
  });
});
