import { describe, expect, it } from "vitest";
import { shouldShowVersionPrompt } from "@/lib/versionCheck";

describe("version update prompt", () => {
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
