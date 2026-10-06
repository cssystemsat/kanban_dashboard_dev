import type { ClientData } from "@/hooks/useKanbanData";
import { getGlobalObjectiveDefinition } from "@shared/globalObjectives";

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
  | "nome"
  | "marco"
  | "isComplete"
  | "marcoStatus"
  | "diasCorridos"
>;
type BIFlaggableClient = BICriticalClient &
  Pick<ClientData, "flag">;
type BITTVCandidate = Pick<ClientData, "id" | "nome" | "entrada"> & {
  tags?: string[];
};
type BICSMClient = Pick<
  ClientData,
  "atendente" | "ultimoBoleto" | "nome"
>;

function normalizeObjective(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function listObjectives<T extends { tags?: string[] }>(clients: T[]): string[] {
  const objectives = new Map<string, string>();
  for (const client of clients) {
    for (const tag of client.tags ?? []) {
      const display = tag.trim();
      const normalized = normalizeObjective(display);
      if (normalized && !objectives.has(normalized)) {
        objectives.set(normalized, display);
      }
    }
  }
  return [...objectives.values()].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  );
}

export function filterClientsByObjectives<T extends { tags?: string[] }>(
  clients: T[],
  selectedObjectives: string[]
): T[] {
  const selected = new Set(
    selectedObjectives.map(normalizeObjective).filter(Boolean)
  );
  if (selected.size === 0) return clients;
  return clients.filter(client =>
    (client.tags ?? []).some(tag => selected.has(normalizeObjective(tag)))
  );
}

export type SubobjectiveFilterOption = {
  key: string;
  objective: string;
  subobjective: string;
};

export function listSubobjectives<T extends { tags?: string[] }>(
  clients: T[],
  selectedObjectives: string[] = []
): SubobjectiveFilterOption[] {
  const options = new Map<string, SubobjectiveFilterOption>();
  const selected = new Set(
    selectedObjectives.map(normalizeObjective).filter(Boolean)
  );
  for (const client of clients) {
    for (const tag of client.tags ?? []) {
      const definition = getGlobalObjectiveDefinition(tag);
      if (!definition) continue;
      if (selected.size > 0 && !selected.has(normalizeObjective(definition.name))) {
        continue;
      }
      definition.subobjectives.forEach(subobjective => {
        const key = `${definition.name}::${subobjective}`;
        if (!options.has(key)) {
          options.set(key, { key, objective: definition.name, subobjective });
        }
      });
    }
  }
  return [...options.values()].sort(
    (a, b) =>
      a.objective.localeCompare(b.objective, "pt-BR") ||
      a.subobjective.localeCompare(b.subobjective, "pt-BR")
  );
}

export function filterClientsByObjectiveFilters<T extends { tags?: string[] }>(
  clients: T[],
  selectedObjectives: string[],
  selectedSubobjectiveKeys: string[]
): T[] {
  const selectedGlobal = new Set(
    selectedObjectives.map(normalizeObjective).filter(Boolean)
  );
  const selectedSubobjectives = new Set(
    selectedSubobjectiveKeys.map(value => normalizeObjective(value)).filter(Boolean)
  );
  if (selectedGlobal.size === 0 && selectedSubobjectives.size === 0) return clients;

  return clients.filter(client =>
    (client.tags ?? []).some(tag => {
      const definition = getGlobalObjectiveDefinition(tag);
      if (!definition) return false;
      if (selectedGlobal.has(normalizeObjective(definition.name))) return true;
      return definition.subobjectives.some(subobjective =>
        selectedSubobjectives.has(
          normalizeObjective(`${definition.name}::${subobjective}`)
        )
      );
    })
  );
}

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

function hasRiskFlag(flag: string | undefined): boolean {
  const normalized = (flag ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
  return ["red flag", "yellow flag", "black flag"].includes(normalized);
}

export function getUnflaggedOverdueGroups<T extends BIFlaggableClient>(
  clients: T[]
): Record<"implantacao" | "onboarding", T[]> {
  const unflagged = clients.filter(client => !hasRiskFlag(client.flag));
  return {
    implantacao: sortedByName(
      unflagged.filter(
        client =>
          client.marcoStatus === "atrasado" &&
          client.marco >= 1 &&
          client.marco <= 3
      )
    ),
    onboarding: sortedByName(
      unflagged.filter(
        client =>
          client.marcoStatus === "atrasado" &&
          client.marco >= 4 &&
          client.marco <= 5
      )
    ),
  };
}

export function getFlaggedOverdueGroups<T extends BIFlaggableClient>(
  clients: T[]
): Record<"implantacao" | "onboarding", T[]> {
  const flagged = clients.filter(client => hasRiskFlag(client.flag));
  return {
    implantacao: sortedByName(
      flagged.filter(
        client =>
          client.marcoStatus === "atrasado" &&
          client.marco >= 1 &&
          client.marco <= 3
      )
    ),
    onboarding: sortedByName(
      flagged.filter(
        client =>
          client.marcoStatus === "atrasado" &&
          client.marco >= 4 &&
          client.marco <= 5
      )
    ),
  };
}

export type ObjectiveCompletionMetric = {
  clientId: string;
  objectiveIndex: number;
  completedAt: Date | string | null;
};

export type SubobjectiveCompletionMetric = {
  clientId: string;
  objectiveName: string;
  subobjectiveIndex: number;
  completedAt: Date | string | null;
};

export function deriveObjectiveCompletionsFromSubobjectives<
  T extends { id: string; tags?: string[] }
>(
  clients: T[],
  completions: SubobjectiveCompletionMetric[]
): ObjectiveCompletionMetric[] {
  const completionByKey = new Map<string, SubobjectiveCompletionMetric>();
  for (const completion of completions) {
    completionByKey.set(
      `${completion.clientId}::${normalizeObjective(completion.objectiveName)}::${completion.subobjectiveIndex}`,
      completion
    );
  }

  return clients.flatMap(client =>
    (client.tags ?? []).flatMap((tag, objectiveIndex) => {
      const definition = getGlobalObjectiveDefinition(tag);
      if (!definition) return [];
      const objectiveKey = normalizeObjective(definition.name);
      const objectiveCompletions = definition.subobjectives.map((_, index) =>
        completionByKey.get(`${client.id}::${objectiveKey}::${index}`)
      );
      if (objectiveCompletions.some(completion => !completion)) return [];

      const dates = objectiveCompletions
        .map(completion => parseCompletedAt(completion?.completedAt ?? null))
        .filter((date): date is Date => date !== null);
      const completedAt =
        dates.length === definition.subobjectives.length
          ? new Date(Math.max(...dates.map(date => date.getTime())))
          : null;
      return [{ clientId: client.id, objectiveIndex, completedAt }];
    })
  );
}

export function mergeObjectiveCompletions(
  stored: ObjectiveCompletionMetric[],
  derived: ObjectiveCompletionMetric[]
): ObjectiveCompletionMetric[] {
  const merged = new Map(
    stored.map(completion => [
      `${completion.clientId}::${completion.objectiveIndex}`,
      completion,
    ])
  );
  for (const completion of derived) {
    const key = `${completion.clientId}::${completion.objectiveIndex}`;
    if (!merged.has(key)) merged.set(key, completion);
  }
  return [...merged.values()];
}

function parseBrazilianDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match) return null;
  const [, day, month, rawYear] = match;
  const year = rawYear.length === 2 ? Number(`20${rawYear}`) : Number(rawYear);
  const date = new Date(year, Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseCompletedAt(value: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateAverageTTV<T extends BITTVCandidate>(
  clients: T[],
  completions: ObjectiveCompletionMetric[],
  selectedObjectives: string[] = []
) {
  const clientsById = new Map(clients.map(client => [client.id, client]));
  const selected = new Set(
    selectedObjectives.map(normalizeObjective).filter(Boolean)
  );
  const entries = completions
    .map(completion => {
      const client = clientsById.get(completion.clientId);
      const objectiveName = client?.tags?.[completion.objectiveIndex];
      if (selected.size > 0 && !selected.has(normalizeObjective(objectiveName))) {
        return null;
      }
      const startDate = client ? parseBrazilianDate(client.entrada) : null;
      const completedAt = parseCompletedAt(completion.completedAt);
      if (!client || !startDate || !completedAt) return null;
      const days = Math.floor(
        (completedAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (days < 0) return null;
      return {
        clientId: client.id,
        clientName: client.nome,
        objectiveIndex: completion.objectiveIndex,
        completedAt,
        days,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const averageDays = entries.length
    ? entries.reduce((total, entry) => total + entry.days, 0) / entries.length
    : null;
  return { averageDays, entries };
}

export function calculateAverageSubobjectiveTTV<T extends BITTVCandidate>(
  clients: T[],
  completions: SubobjectiveCompletionMetric[],
  selectedObjectives: string[] = [],
  selectedSubobjectiveKeys: string[] = []
) {
  const clientsById = new Map(clients.map(client => [client.id, client]));
  const selected = new Set(
    selectedObjectives.map(normalizeObjective).filter(Boolean)
  );
  const selectedSubobjectives = new Set(
    selectedSubobjectiveKeys.map(normalizeObjective).filter(Boolean)
  );
  const entries = completions
    .map(completion => {
      const client = clientsById.get(completion.clientId);
      const definition = getGlobalObjectiveDefinition(completion.objectiveName);
      const objectiveName = definition?.name ?? completion.objectiveName;
      if (selected.size > 0 && !selected.has(normalizeObjective(objectiveName))) {
        return null;
      }
      const startDate = client ? parseBrazilianDate(client.entrada) : null;
      const completedAt = parseCompletedAt(completion.completedAt);
      const subobjectiveName =
        definition?.subobjectives[completion.subobjectiveIndex] ??
        `Subobjetivo ${completion.subobjectiveIndex + 1}`;
      if (
        selectedSubobjectives.size > 0 &&
        !selectedSubobjectives.has(
          normalizeObjective(`${objectiveName}::${subobjectiveName}`)
        )
      ) {
        return null;
      }
      if (!client || !startDate || !completedAt) return null;
      const days = Math.floor(
        (completedAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (days < 0) return null;
      return {
        clientId: client.id,
        clientName: client.nome,
        objectiveName,
        subobjectiveName,
        subobjectiveIndex: completion.subobjectiveIndex,
        completedAt,
        days,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const averageDays = entries.length
    ? entries.reduce((total, entry) => total + entry.days, 0) / entries.length
    : null;
  return { averageDays, entries };
}

export function groupAverageTTVByObjective<T extends BITTVCandidate & {
  tags?: string[];
}>(
  clients: T[],
  completions: ObjectiveCompletionMetric[],
  selectedObjectives: string[] = []
) {
  const clientsById = new Map(clients.map(client => [client.id, client]));
  const selected = new Set(
    selectedObjectives.map(normalizeObjective).filter(Boolean)
  );
  const allObjectiveNames = new Set<string>();
  for (const client of clients) {
    for (const objective of client.tags ?? []) {
      const name = objective.trim();
      if (name && (selected.size === 0 || selected.has(normalizeObjective(name)))) {
        allObjectiveNames.add(name);
      }
    }
  }

  const totals = new Map<string, { totalDays: number; completions: number }>();
  for (const completion of calculateAverageTTV(
    clients,
    completions,
    selectedObjectives
  ).entries) {
    const client = clientsById.get(completion.clientId);
    const objectiveName =
      client?.tags?.[completion.objectiveIndex]?.trim() ||
      `Objetivo ${completion.objectiveIndex + 1}`;
    if (selected.size > 0 && !selected.has(normalizeObjective(objectiveName))) {
      continue;
    }
    allObjectiveNames.add(objectiveName);
    const current = totals.get(objectiveName) ?? {
      totalDays: 0,
      completions: 0,
    };
    totals.set(objectiveName, {
      totalDays: current.totalDays + completion.days,
      completions: current.completions + 1,
    });
  }

  return Array.from(allObjectiveNames)
    .map(objective => {
      const metric = totals.get(objective);
      return {
        objective,
        dias: metric ? metric.totalDays / metric.completions : null,
        conclusoes: metric?.completions ?? 0,
      };
    })
    .sort((a, b) => a.objective.localeCompare(b.objective, "pt-BR"));
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
