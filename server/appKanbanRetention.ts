export const KEY_TURNED_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

export type AppKanbanRetentionCard = {
  stage: string;
  keyTurned: boolean;
  keyTurnedAt: Date | null;
  updatedAt: Date;
};

/**
 * Cards em App entregue continuam visíveis normalmente.
 * Apenas cards marcados como Chave Virada são ocultados dois dias depois da marcação.
 */
export function isAppKanbanCardVisible(
  card: AppKanbanRetentionCard,
  now = Date.now()
) {
  if (card.stage !== "app_entregue" || !card.keyTurned) return true;
  const turnedAt = card.keyTurnedAt?.getTime() ?? card.updatedAt.getTime();
  return now - turnedAt < KEY_TURNED_RETENTION_MS;
}

export function getKeyTurnedRemainingMs(
  card: AppKanbanRetentionCard,
  now = Date.now()
) {
  if (card.stage !== "app_entregue" || !card.keyTurned) return null;
  const turnedAt = card.keyTurnedAt?.getTime() ?? card.updatedAt.getTime();
  return Math.max(0, KEY_TURNED_RETENTION_MS - (now - turnedAt));
}
