import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

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

  it("mantém a Timeline maximizada sem overflow lateral ao abrir detalhes", () => {
    expect(timelineSource).not.toContain("overflow-x-auto");
    expect(timelineSource).not.toContain("min-w-[760px]");
    expect(timelineSource).toContain("overflow-x-hidden");
    expect(timelineSource).toContain("min-w-0");
    expect(timelineSource).toContain('"md:w-[calc(100%-80px)]"');
    expect(timelineSource).toContain('"md:w-[calc(100%-200px)]"');
    expect(timelineSource).toContain("break-words");
  });

  it("usa os clientes reais de Marcos em uma lista suspensa", () => {
    expect(timelineSource).toContain("import { useKanbanData }");
    expect(timelineSource).toContain("const { data: clients");
    expect(timelineSource).toContain("fetchData");
    expect(timelineSource).toContain("void fetchData()");
    expect(timelineSource).toContain('id="timeline-client"');
    expect(timelineSource).toContain("sortedClients.map(client =>");
    expect(timelineSource).toContain("Selecione um cliente...");
    expect(timelineSource).toContain("FRICCOES_GID = 594161358");
    expect(timelineSource).toContain("trpc.sheets.csv.useQuery");
    expect(timelineSource).toContain("parseFriccaoEvents");
    expect(timelineSource).toContain("eventsByDay");
    expect(timelineSource).toContain("event.title");
    expect(timelineSource).toContain("event.sector");
    expect(timelineSource).toContain("event.tag");
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
