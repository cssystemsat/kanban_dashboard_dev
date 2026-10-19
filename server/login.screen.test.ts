import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const mainSource = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");
const loginSource = readFileSync(
  resolve(process.cwd(), "client/src/components/LoginScreen.tsx"),
  "utf8"
);

describe("nova tela de login do painel CS", () => {
  it("é exibida antes de qualquer página quando não existe sessão", () => {
    expect(appSource).toContain("if (!authLoading && !user)");
    expect(appSource).toContain("<LoginScreen />");
    expect(loginSource).toContain("Entrar com Google");
  });

  it("preserva a identidade CS, a logo Systemsat e a opção Manter conectado", () => {
    expect(loginSource).toContain("Customer Success");
    expect(loginSource).toContain("systemsat-logo-transparent");
    expect(loginSource).toContain("Manter conectado");
    expect(loginSource).toContain("localStorage.setItem(\"cs-keep-connected\"");
    expect(loginSource).toContain("getLoginUrl()");
  });

  it("não força o redirecionamento automático para OAuth antes da tela", () => {
    expect(mainSource).not.toContain("window.location.href = getLoginUrl()");
  });
});
