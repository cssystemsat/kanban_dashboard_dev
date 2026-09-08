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
  });

  it("usa os clientes reais de Marcos em uma lista suspensa", () => {
    expect(timelineSource).toContain("import { useKanbanData }");
    expect(timelineSource).toContain("const { data: clients");
    expect(timelineSource).toContain('id="timeline-client"');
    expect(timelineSource).toContain("sortedClients.map(client =>");
    expect(timelineSource).toContain("Selecione um cliente...");
    expect(timelineSource).toContain("FRICCOES_GID = 594161358");
    expect(timelineSource).toContain("trpc.sheets.csv.useQuery");
    expect(timelineSource).toContain("parseFriccaoEvents");
    expect(timelineSource).toContain("eventsByDay");
    expect(timelineSource).toContain("event.title");
  });
});
