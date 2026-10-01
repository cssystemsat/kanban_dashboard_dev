import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  normalizeWootricResponse,
  verifyWootricWebhookSignature,
} from "./wootric";

describe("Wootric", () => {
  it("normaliza respostas com os campos necessários para o alerta", () => {
    const normalized = normalizeWootricResponse({
      id: 42,
      email: "cliente@example.com",
      end_user_id: 7,
      survey_id: 9,
      score: 11,
      text: "Comentário",
      tags: ["produto"],
      created_at: "2026-10-01T12:00:00.000Z",
      updated_at: "2026-10-01T12:00:01.000Z",
    });
    expect(normalized.wootricId).toBe("42");
    expect(normalized.score).toBe(10);
    expect(normalized.email).toBe("cliente@example.com");
    expect(normalized.tags).toBe('["produto"]');
  });

  it("valida a assinatura HMAC-SHA1 do webhook", () => {
    const secret = "webhook-secret";
    const body = Buffer.from('{"event_name":"created"}');
    const signature = `sha1=${createHmac("sha1", secret).update(body).digest("hex")}`;
    expect(verifyWootricWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyWootricWebhookSignature(body, "sha1=invalid", secret)).toBe(false);
  });

  it("mantém o alerta e as credenciais no servidor", () => {
    const component = readFileSync(
      resolve(process.cwd(), "client/src/components/WootricAlert.tsx"),
      "utf8"
    );
    const server = readFileSync(resolve(process.cwd(), "server/wootric.ts"), "utf8");
    expect(component).toContain("trpc.wootric.pending");
    expect(component).toContain("Estou ciente das novas avaliações");
    expect(server).toContain("WOOTRIC");
    expect(component).not.toMatch(/CLIENT_SECRET|CLIENT_ID|API_KEY/);
  });
});
