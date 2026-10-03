import type { ClientData } from "@/hooks/useKanbanData";

export type BIMetricKey = "implantacao" | "onboarding" | "implantados";

type BIClient = Pick<ClientData, "nome" | "marco" | "isComplete">;

export const BI_SEGMENT_DEFINITIONS: Record<
  BIMetricKey,
  { label: string; description: string }
> = {
  implantacao: {
    label: "Clientes em implantação",
    description: "Clientes cujo marco atual é 1, 2 ou 3.",
  },
  onboarding: {
    label: "Clientes em onboarding",
    description: "Clientes cujo marco atual é 3, 4 ou 5.",
  },
  implantados: {
    label: "Implantados",
    description: "Clientes com os cinco marcos concluídos.",
  },
};

const sortedByName = <T extends BIClient>(clients: T[]) =>
  [...clients].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );

/**
 * Segmenta os clientes da aba Marcos sem duplicar ou transformar os dados.
 * O mesmo cliente pode aparecer nos dois segmentos de andamento quando está
 * no marco 3, conforme a regra solicitada para os KPIs.
 */
export function getBIClientGroups<T extends BIClient>(
  clients: T[]
): Record<BIMetricKey, T[]> {
  return {
    implantacao: sortedByName(
      clients.filter(client => !client.isComplete && client.marco >= 1 && client.marco <= 3)
    ),
    onboarding: sortedByName(
      clients.filter(client => !client.isComplete && client.marco >= 3 && client.marco <= 5)
    ),
    implantados: sortedByName(clients.filter(client => client.isComplete === true)),
  };
}
