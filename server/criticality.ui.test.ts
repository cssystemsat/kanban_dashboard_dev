import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(
    new URL(path, import.meta.url).pathname.replace("/server/", "/"),
    "utf8"
  );

describe("criticality score UI contract", () => {
  it("renders the score badge in ClientCard and ranks the lowest scores first", () => {
    const clientCard = read("../client/src/components/ClientCard.tsx");
    const home = read("../client/src/pages/Home.tsx");

    expect(clientCard).toContain("{criticalityScore}/100");
    expect(home).toContain(".sort((a, b) => a.score - b.score)");
    expect(home).toContain(".slice(0, 30)");
    expect(home).toContain("pontuação restante");
  });
});
