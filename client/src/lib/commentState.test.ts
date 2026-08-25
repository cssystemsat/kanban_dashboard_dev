import { describe, expect, it } from "vitest";
import { sameCommentMap } from "./commentState";

describe("sameCommentMap", () => {
  const original = {
    ClienteA: {
      current: { text: "Acompanhar consumo", user: "Ana", date: "2026-08-25T10:00:00.000Z" },
      history: [{ text: "Primeiro contato", user: "Carlos", date: "2026-08-24T10:00:00.000Z" }],
    },
  };

  it("reconhece dados equivalentes e evita setState redundante", () => {
    const rebuilt = JSON.parse(JSON.stringify(original));
    expect(sameCommentMap(original, rebuilt)).toBe(true);
  });

  it("detecta uma edição real para atualizar a interface", () => {
    const edited = JSON.parse(JSON.stringify(original));
    edited.ClienteA.current.text = "Acompanhar consumo e retorno";
    expect(sameCommentMap(original, edited)).toBe(false);
  });
});
