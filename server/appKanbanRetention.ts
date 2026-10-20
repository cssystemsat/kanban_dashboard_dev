export const APP_DELIVERED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export type AppKanbanRetentionCard = {
  stage: string;
  deliveredAt: Date | null;
  updatedAt: Date;
};

/**
 * Cards em App entregue permanecem visíveis por sete dias a partir da entrada.
 * Cards antigos sem deliveredAt usam updatedAt como fallback de compatibilidade.
 */
export function isAppKanbanCardVisible(
  card: AppKanbanRetentionCard,
  now = Date.now()
) {
  if (card.stage !== "app_entregue") return true;
  const enteredDeliveredAt = card.deliveredAt?.getTime() ?? card.updatedAt.getTime();
  return now - enteredDeliveredAt < APP_DELIVERED_RETENTION_MS;
}
