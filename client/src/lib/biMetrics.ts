import type { ClientData } from "@/hooks/useKanbanData";

export type BIMetricKey =
  | "implantacao"
  | "onboarding"
  | "migracao"
  | "implantados"
  | "atrasoImplantacao"
  | "atrasoOnboarding"
  | "atrasoOngoing";

type BIStageClient = Pick<ClientData, "nome" | "marco" | "isComplete">;
type BICriticalClient = Pick<
  ClientData,
  "nome" | "marco" | "isComplete" | "marcoStatus" | "diasCorridos"
>;
type BICSMClient = Pick<
  ClientData,
  "atendente" | "ultimoBoleto" | "nome"
>;

export const BI_SEGMENT_DEFINITIONS: Record<
  "implantacao" | "onboarding" | "implantados" | "migracao",
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
  migracao: {
    label: "Clientes em migração",
    description: "Clientes com situação Em andamento na aba Migração.",
  },
  implantados: {
    label: "Implantados",
    description: "Clientes com os cinco marcos concluídos.",
  },
};

export const BI_CRITICAL_DEFINITIONS: Record<
  "atrasoImplantacao" | "atrasoOnboarding" | "atrasoOngoing",
  { label: string; description: string }
> = {
  atrasoImplantacao: {
    label: "Implantação atrasada",
    description: "Clientes atrasados nos marcos 1, 2 ou 3.",
  },
  atrasoOnboarding: {
    label: "Onboarding atrasado",
    description: "Clientes atrasados nos marcos 4 ou 5.",
  },
  atrasoOngoing: {
    label: "Atrasados para Ongoing",
    description: "Implantados há mais de 1 ano.",
  },
};

const sortedByName = <T extends { nome: string }>(clients: T[]) =>
  [...clients].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );

/**
 * Segmenta os clientes da aba Marcos sem transformar os dados originais.
 * O mesmo cliente pode aparecer nos dois segmentos de andamento quando está
 * no marco 3, conforme a regra solicitada para os KPIs.
 */
export function getBIClientGroups<T extends BIStageClient>(
  clients: T[]
): Record<"implantacao" | "onboarding" | "implantados", T[]> {
  return {
    implantacao: sortedByName(
      clients.filter(
        client =>
          !client.isComplete && client.marco >= 1 && client.marco <= 3
      )
    ),
    onboarding: sortedByName(
      clients.filter(
        client =>
          !client.isComplete && client.marco >= 3 && client.marco <= 5
      )
    ),
    implantados: sortedByName(
      clients.filter(client => client.isComplete === true)
    ),
  };
}

export function getBICriticalGroups<T extends BICriticalClient>(
  clients: T[]
): Record<
  "atrasoImplantacao" | "atrasoOnboarding" | "atrasoOngoing",
  T[]
> {
  return {
    atrasoImplantacao: sortedByName(
      clients.filter(
        client =>
          client.marcoStatus === "atrasado" &&
          client.marco >= 1 &&
          client.marco <= 3
      )
    ),
    atrasoOnboarding: sortedByName(
      clients.filter(
        client =>
          client.marcoStatus === "atrasado" &&
          client.marco >= 4 &&
          client.marco <= 5
      )
    ),
    atrasoOngoing: sortedByName(
      clients.filter(
        client => client.isComplete === true && client.diasCorridos > 365
      )
    ),
  };
}

export function normalizeCSM(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

export function listCSMs(clients: BICSMClient[]): string[] {
  const names = new Map<string, string>();
  clients.forEach(client => {
    const displayName = client.atendente.trim();
    if (displayName) names.set(normalizeCSM(displayName), displayName);
  });
  return [...names.values()].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  );
}

export function parseBoleto(value: string | undefined): number {
  if (!value?.trim()) return 0;
  const normalized = value
    .trim()
    .replace(/R\$\s?/gi, "")
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");
  if (!normalized) return 0;

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  let numberText = normalized;
  if (lastComma > lastDot) {
    numberText = normalized.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma && normalized.includes(",")) {
    numberText = normalized.replace(/,/g, "");
  }

  const parsed = Number(numberText);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function groupClientCountByCSM(clients: BICSMClient[]) {
  const result = new Map<string, number>();
  clients.forEach(client => {
    const csm = client.atendente.trim() || "Sem CSM";
    result.set(csm, (result.get(csm) ?? 0) + 1);
  });
  return [...result.entries()]
    .map(([csm, clientes]) => ({ csm, clientes }))
    .sort((a, b) => b.clientes - a.clientes || a.csm.localeCompare(b.csm));
}

export function groupBoletoByCSM(clients: BICSMClient[]) {
  const result = new Map<string, number>();
  clients.forEach(client => {
    const csm = client.atendente.trim() || "Sem CSM";
    result.set(csm, (result.get(csm) ?? 0) + parseBoleto(client.ultimoBoleto));
  });
  return [...result.entries()]
    .map(([csm, valor]) => ({ csm, valor }))
    .sort((a, b) => b.valor - a.valor || a.csm.localeCompare(b.csm));
}
