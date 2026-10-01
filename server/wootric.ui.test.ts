import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  mapCentralIds,
  normalizeWootricResponse,
  verifyWootricWebhookSignature,
} from "./wootric";

describe("Wootric", () => {
  it("normaliza respostas com os campos necessários para o alerta", () => {
    const normalized = normalizeWootricResponse({
      id: 42,
      email: "cliente@example.com - 1089",
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
    expect(normalized.email).toBe("cliente@example.com - 1089");
    expect(normalized.externalId).toBe("1089");
    expect(normalized.showInAlert).toBe(1);
    expect(normalized.tags).toBe('["produto"]');
  });

  it("relaciona o ID central ao nome da central pela coluna indicada", () => {
    const onboarding = mapCentralIds(
      'Código,Cliente,Outros,Id central\nSSX_1,Central Marcos,,1089\n'
    );
    const ongoing = mapCentralIds(
      'Código,Cliente,Outros,ID central\nSSX_2,Central Ongoing,,636\n'
    );
    expect(onboarding.get("1089")).toBe("Central Marcos");
    expect(ongoing.get("636")).toBe("Central Ongoing");
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
    expect(component).toContain("Cliente não encontrado");
    expect(component).toContain("ID central:");
    expect(server).toContain("WOOTRIC");
    expect(component).not.toMatch(/CLIENT_SECRET|CLIENT_ID|API_KEY/);
    expect(component).toContain("min-h-0 flex-1");
    expect(component).not.toContain("MessageSquareHeart");
  });

  it("oferece histórico Wootric por ID central nos cards Marcos e Ongoing", () => {
    const marcosCard = readFileSync(
      resolve(process.cwd(), "client/src/components/ClientCard.tsx"),
      "utf8"
    );
    const ongoingCard = readFileSync(
      resolve(process.cwd(), "client/src/components/OngoingCard.tsx"),
      "utf8"
    );
    const home = readFileSync(
      resolve(process.cwd(), "client/src/pages/Home.tsx"),
      "utf8"
    );
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(marcosCard).toContain("WootricClientHistoryModal");
    expect(ongoingCard).toContain("WootricClientHistoryModal");
    expect(marcosCard).toContain("WootricMark");
    expect(ongoingCard).toContain("WootricMark");
    expect(marcosCard).toContain("EMPTY_OBJECTIVE_INDEXES");
    expect(marcosCard).toContain("objectiveQueryInput");
    expect(marcosCard).toContain("return current");
    expect(home).toContain("useMemo");
    expect(router).toContain("historyByCentral");
    expect(router).toContain("getWootricHistoryByCentralId");
    expect(router).not.toContain("WOOTRIC_CLIENT_SECRET");
    expect(readFileSync(resolve(process.cwd(), "server/wootric.ts"), "utf8")).toContain(
      "page <= 30"
    );
    expect(readFileSync(resolve(process.cwd(), "server/wootric.ts"), "utf8")).toContain(
      "findWootricEndUsersByCentralId"
    );
    expect(readFileSync(resolve(process.cwd(), "server/wootric.ts"), "utf8")).toContain(
      "showInAlert"
    );
  });
});
