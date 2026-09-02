export function normalizeEmailInput(value: string): string {
  return value.trim().toLowerCase();
}

export function getEmailValidationMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (
    message.includes("Invalid email address") ||
    message.includes('"invalid_format"') ||
    message.includes('"format":"email"')
  ) {
    return "Informe um e-mail válido, como usuario@gmail.com.";
  }

  if (
    message.toLowerCase().includes("unique") ||
    message.toLowerCase().includes("duplicate")
  ) {
    return "Este e-mail já está cadastrado na lista de permissões.";
  }

  return `Erro ao salvar e-mail: ${message}`;
}
