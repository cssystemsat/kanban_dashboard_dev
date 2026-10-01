import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ENV } from "./_core/env";

describe("integração Wootric", () => {
  it("mantém as credenciais configuradas e não as expõe no cliente", async () => {
    expect(ENV.wootricClientId).toBeTruthy();
    expect(ENV.wootricClientSecret).toBeTruthy();

    const clientSource = readFileSync(
      resolve(process.cwd(), "client/index.html"),
      "utf8"
    );
    expect(clientSource).not.toMatch(/WOOTRIC_CLIENT_SECRET|WOOTRIC_CLIENT_ID|WOOTRIC_API_KEY/);
  });

  it.runIf(process.env.RUN_WOOTRIC_LIVE_TEST === "1")(
    "autentica com OAuth client_credentials na API Wootric",
    async () => {
      const form = new FormData();
      form.set("grant_type", "client_credentials");
      form.set("client_id", ENV.wootricClientId);
      form.set("client_secret", ENV.wootricClientSecret);
      const response = await fetch("https://api.wootric.com/oauth/token", {
        method: "POST",
        body: form,
      });
      expect(response.ok).toBe(true);
      const payload = (await response.json()) as { access_token?: string };
      expect(payload.access_token).toBeTruthy();
    },
    30_000
  );
});
