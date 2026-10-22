import { describe, expect, it } from "vitest";
import {
  KEY_TURNED_RETENTION_MS,
  isAppKanbanCardVisible,
} from "./appKanbanRetention";

const now = Date.parse("2026-10-20T12:00:00.000Z");

function card(
  keyTurnedAt: string | null,
  keyTurned = true,
  updatedAt = "2026-10-20T11:00:00.000Z"
) {
  return {
    stage: "app_entregue",
    keyTurned,
    keyTurnedAt: keyTurnedAt ? new Date(keyTurnedAt) : null,
    updatedAt: new Date(updatedAt),
  };
}

describe("retenção após Chave Virada", () => {
  it("mantém o App entregue visível enquanto Chave Virada não foi marcada", () => {
    expect(
      isAppKanbanCardVisible(card("2026-10-13T12:00:00.000Z", false), now)
    ).toBe(true);
  });

  it("mantém o card durante os dois dias após Chave Virada", () => {
    expect(
      isAppKanbanCardVisible(
        card(new Date(now - KEY_TURNED_RETENTION_MS + 1).toISOString()),
        now
      )
    ).toBe(true);

    expect(
      isAppKanbanCardVisible(
        card(new Date(now - KEY_TURNED_RETENTION_MS).toISOString()),
        now
      )
    ).toBe(false);
  });

  it("oculta o card após dois dias completos", () => {
    expect(
      isAppKanbanCardVisible(
        card(new Date(now - KEY_TURNED_RETENTION_MS - 1).toISOString()),
        now
      )
    ).toBe(false);
  });

  it("não aplica retenção aos demais estágios", () => {
    expect(
      isAppKanbanCardVisible({ ...card("2026-09-01T12:00:00.000Z"), stage: "desenvolvimento" }, now)
    ).toBe(true);
  });

  it("usa updatedAt como fallback para cards marcados sem data", () => {
    expect(
      isAppKanbanCardVisible(
        card(null, true, "2026-10-13T12:00:00.000Z"),
        now
      )
    ).toBe(false);
  });
});
