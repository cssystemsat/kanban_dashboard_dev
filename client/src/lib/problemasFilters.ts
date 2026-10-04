export type ProblemFilterCard = {
  csm: string;
  flag: string;
};

const normalizeFilterValue = (value: string) =>
  value.trim().toLocaleLowerCase("pt-BR");

export function filterProblemCards<T extends ProblemFilterCard>(
  cards: T[],
  csmFilter: string,
  flagFilter: string
) {
  const normalizedCSM = normalizeFilterValue(csmFilter);
  const normalizedFlag = normalizeFilterValue(flagFilter);

  return cards.filter(card => {
    const matchesCSM =
      !normalizedCSM || normalizeFilterValue(card.csm) === normalizedCSM;
    const matchesFlag =
      !normalizedFlag || normalizeFilterValue(card.flag) === normalizedFlag;
    return matchesCSM && matchesFlag;
  });
}
