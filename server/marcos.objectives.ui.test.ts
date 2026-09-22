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

  it("lê os objetivos da coluna AA", () => {
    expect(kanbanData).toContain("const tagsIdx = 26; // Coluna AA");
    expect(kanbanData).toContain("tagsRaw");
  });
});
