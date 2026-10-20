import { describe, expect, it } from "vitest";
import {
  APP_DELIVERED_RETENTION_MS,
  isAppKanbanCardVisible,
} from "./appKanbanRetention";

const now = Date.parse("2026-10-20T12:00:00.000Z");

function card(deliveredAt: string | null, updatedAt = "2026-10-20T11:00:00.000Z") {
  return {
    stage: "app_entregue",
    deliveredAt: deliveredAt ? new Date(deliveredAt) : null,
    updatedAt: new Date(updatedAt),
  };
}

describe("retenção do App entregue", () => {
  it("mantém o card durante os sete dias", () => {
    expect(
      isAppKanbanCardVisible(
        card("2026-10-13T12:00:00.001Z"),
        now
      )
    ).toBe(true);

    expect(
      isAppKanbanCardVisible(
        card("2026-10-13T12:00:00.000Z"),
        now
      )
    ).toBe(false);
  });

  it("oculta o card após sete dias completos", () => {
    expect(
      isAppKanbanCardVisible(
        card(new Date(now - APP_DELIVERED_RETENTION_MS - 1).toISOString()),
        now
      )
    ).toBe(false);
  });

  it("não aplica retenção aos demais estágios", () => {
    expect(
      isAppKanbanCardVisible(
        { ...card("2026-09-01T12:00:00.000Z"), stage: "desenvolvimento" },
        now
      )
    ).toBe(true);
  });

  it("usa updatedAt para cards antigos sem deliveredAt", () => {
    expect(
      isAppKanbanCardVisible(
        card(null, "2026-10-13T12:00:00.000Z"),
        now
      )
    ).toBe(false);
  });
});
