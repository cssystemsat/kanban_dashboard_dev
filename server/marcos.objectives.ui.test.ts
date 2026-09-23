import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Marcos — objetivos do cliente", () => {
  const clientCard = readFileSync(
    resolve(process.cwd(), "client/src/components/ClientCard.tsx"),
    "utf8"
  );
  const kanbanData = readFileSync(
    resolve(process.cwd(), "client/src/hooks/useKanbanData.ts"),
    "utf8"
  );

  it("substitui o botão de grupo por uma seta que abre os objetivos", () => {
    expect(clientCard).toContain("Ver objetivos do cliente");
    expect(clientCard).toContain("setShowObjectives(value => !value)");
    expect(clientCard).toContain("client.tags.map");
    expect(clientCard).not.toContain('title="Abrir grupo do WhatsApp"');
  });

  it("mostra um modal maior com checkbox contrastante e guarda a marcação", () => {
    expect(clientCard).toContain('width: "min(32rem, calc(100vw - 2rem))"');
    expect(clientCard).toContain("fixed left-1/2 top-1/2");
    expect(clientCard).toContain("max-h-[calc(100vh-2rem)]");
    expect(clientCard).toContain("createPortal");
    expect(clientCard).toContain('type="checkbox"');
    expect(clientCard).toContain("accent-emerald-600");
    expect(clientCard).toContain("line-through");
    expect(clientCard).toContain("localStorage");
  });

  it("lê os objetivos da coluna AA", () => {
    expect(kanbanData).toContain("const tagsIdx = 26; // Coluna AA");
    expect(kanbanData).toContain("tagsRaw");
  });
});
