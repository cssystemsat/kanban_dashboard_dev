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

  it("renderiza a logo SYSTEMSAT no menu expandido e recolhido", () => {
    expect(sideMenuSource).toContain(
      '"/manus-storage/systemsat-logo-transparent_6314d1c3.png"'
    );
    expect(sideMenuSource).toContain(
      '"https://files.manuscdn.com/user_upload_by_module/session_file/310519663388902916/sMtZFYeYnVwpyXZR.png"'
    );
    expect(sideMenuSource).toContain('alt="SYSTEMSAT"');
    expect(sideMenuSource).toContain("SYSTEMSAT_LOGO_FALLBACK");
  });
});
