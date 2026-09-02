import { describe, expect, it } from "vitest";
import {
  getEmailValidationMessage,
  normalizeEmailInput,
} from "../shared/emailValidation";

describe("email validation helpers", () => {
  it("trims and lowercases a valid email before saving", () => {
    expect(normalizeEmailInput("  Usuario.Teste@GMAIL.COM  ")).toBe(
      "usuario.teste@gmail.com"
    );
  });

  it("translates the raw email format error", () => {
    expect(
      getEmailValidationMessage(
        new Error('[{"code":"invalid_format","format":"email"}]')
      )
    ).toBe("Informe um e-mail válido, como usuario@gmail.com.");
  });

  it("keeps a useful message for other failures", () => {
    expect(getEmailValidationMessage(new Error("Acesso negado."))).toBe(
      "Erro ao salvar e-mail: Acesso negado."
    );
  });
});
