export type ContactButtonState = {
  backgroundColor: string;
  disabled: boolean;
  label: string;
};

export function getContactButtonState(
  daysSinceContact: number | undefined,
  markedToday = false
): ContactButtonState {
  const days = markedToday
    ? 0
    : Number.isFinite(daysSinceContact)
      ? Math.max(0, daysSinceContact ?? 0)
      : -1;

  if (days === 0) {
    return { backgroundColor: "#9CA3AF", disabled: true, label: "Contato feito hoje" };
  }
  if (days > 30) {
    return { backgroundColor: "#991B1B", disabled: false, label: "Último contato há mais de 30 dias" };
  }
  if (days > 14) {
    return { backgroundColor: "#FCA5A5", disabled: false, label: "Último contato há mais de 14 dias" };
  }
  if (days > 7) {
    return { backgroundColor: "#FACC15", disabled: false, label: "Último contato na semana passada" };
  }
  if (days > 0) {
    return { backgroundColor: "#166534", disabled: false, label: "Último contato nesta semana" };
  }
  return { backgroundColor: "#1D4ED8", disabled: false, label: "Marcar contato realizado" };
}
