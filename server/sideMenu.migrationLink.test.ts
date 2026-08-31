import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sideMenuSource = readFileSync(
  new URL("../client/src/components/SideMenu.tsx", import.meta.url),
  "utf8"
);

describe("menu lateral de migração", () => {
  it("substitui Red Flags pelo link externo seguro de Migração", () => {
    expect(sideMenuSource).toContain('label: "Migração"');
    expect(sideMenuSource).toContain(
      'href: "https://migracao-web.onrender.com/"'
    );
    expect(sideMenuSource).toContain('target="_blank"');
    expect(sideMenuSource).toContain('rel="noreferrer"');
    expect(sideMenuSource).not.toContain('label: "Red Flags"');
  });
});
