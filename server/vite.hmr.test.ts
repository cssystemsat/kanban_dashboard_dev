import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const viteSource = readFileSync(resolve(process.cwd(), "vite.config.ts"), "utf8");

describe("Vite preview HMR", () => {
  it("does not attempt an internal websocket through the managed preview proxy", () => {
    expect(viteSource).toContain("hmr: false");
    expect(viteSource).toContain('host: true');
  });
});
