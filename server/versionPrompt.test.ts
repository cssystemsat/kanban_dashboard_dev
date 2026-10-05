import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareSemanticVersions,
  shouldShowVersionPrompt,
} from "@/lib/versionCheck";
import { APP_VERSION } from "@/lib/appVersion";

const promptSource = readFileSync(
  resolve(process.cwd(), "client/src/components/VersionUpdatePrompt.tsx"),
  "utf8"
);

describe("version update prompt", () => {
  it("publica a versão funcional 11.1 nesta publicação", () => {
    expect(APP_VERSION).toBe("11.1");
  });

  it("exibe somente a última alteração publicada", () => {
    expect(promptSource).toContain(".slice(-1)");
  });

  it("consulta o manifesto com cache-busting e sem cache HTTP", () => {
    expect(promptSource).toContain('searchParams.set("current", APP_VERSION)');
    expect(promptSource).toContain('searchParams.set("t", String(Date.now()))');
    expect(promptSource).toContain('cache: "no-store"');
    expect(promptSource).toContain('credentials: "same-origin"');
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

  it("só trata uma publicação semanticamente maior como atualização", () => {
    expect(compareSemanticVersions("8.6", "8.5")).toBe(1);
    expect(compareSemanticVersions("v8.5", "8.5.0")).toBe(0);
    expect(compareSemanticVersions("8.4", "8.5")).toBe(-1);
    expect(
      shouldShowVersionPrompt({
        currentVersion: "8.5",
        availableVersion: "8.4",
        dismissedVersion: null,
        dismissedUntil: 0,
        now: 100,
      })
    ).toBe(false);
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
