import { describe, expect, it } from "vitest";
import { getContactFields } from "./contactFields";

describe("getContactFields", () => {
  it("lê decisor e telefone das colunas AE e AF usadas em Onboarding e ongoing", () => {
    const row = Array<string>(32).fill("");
    row[30] = "Rafael";
    row[31] = "85 8600-0624";
    expect(getContactFields(row)).toEqual({ decisor: "Rafael", telefone: "85 8600-0624" });
  });

  it("mantém compatibilidade com o campo de contato legado quando AF está vazia", () => {
    const row = Array<string>(32).fill("");
    row[10] = "11 99999-0000";
    expect(getContactFields(row)).toEqual({ decisor: "", telefone: "11 99999-0000" });
  });
});
