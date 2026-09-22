import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { shouldShowVersionPrompt } from "@/lib/versionCheck";
import { APP_VERSION } from "@/lib/appVersion";

describe("version update prompt", () => {
  it("incrementa a versão funcional para 6.6 nesta publicação", () => {
    expect(APP_VERSION).toBe("6.6");
  });

  it("mantém a versão publicada sincronizada com a versão do bundle", () => {
    const published = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "client/public/app-version.json"),
        "utf8"
      )
    ) as { appVersion?: string; changes?: string[] };
    expect(published.appVersion).toBe(APP_VERSION);
    expect(published.changes?.length).toBeGreaterThan(0);
    expect(published.changes?.every(change => change.trim().length > 0)).toBe(
      true
    );
  });
  it("não mostra o aviso na primeira leitura da versão atual", () => {
    expect(
      shouldShowVersionPrompt({
        currentVersion: "v1",
        availableVersion: "v1",
        dismissedVersion: null,
        dismissedUntil: 0,
        now: 100,
      })
    ).toBe(false);
  });

  it("mostra o aviso quando uma publicação diferente está disponível", () => {
    expect(
      shouldShowVersionPrompt({
        currentVersion: "v1",
        availableVersion: "v2",
        dismissedVersion: null,
        dismissedUntil: 0,
        now: 100,
      })
    ).toBe(true);
  });

  it("respeita o lembrar depois e mostra novamente após o prazo", () => {
    const state = {
      currentVersion: "v1",
      availableVersion: "v2",
      dismissedVersion: "v2",
      dismissedUntil: 1_000,
    };

    expect(shouldShowVersionPrompt({ ...state, now: 999 })).toBe(false);
    expect(shouldShowVersionPrompt({ ...state, now: 1_000 })).toBe(true);
  });
});
