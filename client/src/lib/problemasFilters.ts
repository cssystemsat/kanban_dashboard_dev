export type ProblemFilterCard = {
  csm: string;
  flag: string;
  persona?: string;
  status?: string;
};

const normalizeFilterValue = (value: string) =>
  value.trim().toLocaleLowerCase("pt-BR");

export function filterProblemCards<T extends ProblemFilterCard>(
  cards: T[],
  csmFilter: string,
  flagFilter: string,
  personaFilter = "",
  statusFilter = ""
) {
  const normalizedCSM = normalizeFilterValue(csmFilter);
  const normalizedFlag = normalizeFilterValue(flagFilter);
  const normalizedPersona = normalizeFilterValue(personaFilter);
  const normalizedStatus = normalizeFilterValue(statusFilter);

  return cards.filter(card => {
    const matchesCSM =
      !normalizedCSM || normalizeFilterValue(card.csm) === normalizedCSM;
    const matchesFlag =
      !normalizedFlag || normalizeFilterValue(card.flag) === normalizedFlag;
    const matchesPersona =
      !normalizedPersona || normalizeFilterValue(card.persona ?? "") === normalizedPersona;
    const matchesStatus =
      !normalizedStatus || normalizeFilterValue(card.status ?? "") === normalizedStatus;
    return matchesCSM && matchesFlag && matchesPersona && matchesStatus;
  });
}
