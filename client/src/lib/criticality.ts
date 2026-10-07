import type { ClientData } from "@/hooks/useKanbanData";
import type { OngoingClientData } from "@/hooks/useOngoingData";

export type CriticalSignal = {
  label: string;
  value: string;
  points: number;
};

export type CriticalityResult = {
  score: number;
  signals: CriticalSignal[];
};

export const parseCriticalityNumber = (
  value: string | number | undefined
): number => {
  if (value === undefined || value === null || value === "") return 0;
  const normalized = String(value)
    .replace(/R\$|%/gi, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  return Number.parseFloat(normalized.replace(/[^\d.-]/g, "")) || 0;
};

/**
 * Regras iniciais do Ongoing — descontos graduais, transparentes e limitados:
 * delta negativo até 25 pts, perdas do mês até 30 pts, desatualização acima
 * de 20% até 30 pts e mais de 30 dias sem contato até 20 pts.
 */
export function calculateOngoingHealthScore(
  client: OngoingClientData
): CriticalityResult {
  let penalty = 0;
  const signals: CriticalSignal[] = [];
  const addSignal = (label: string, value: string, points: number) => {
    if (points <= 0) return;
    penalty += points;
    signals.push({ label, value, points });
  };

  if (client.deltaConsumo < 0) {
    addSignal(
      "Delta consumo negativo",
      `R$ ${client.deltaConsumo.toFixed(2).replace(".", ",")}`,
      Math.min(25, Math.max(5, Math.abs(client.deltaConsumo) / 100))
    );
  }

  if (client.perdaPlacasMes > 0) {
    addSignal(
      "Perda de placas no mês",
      `${client.perdaPlacasMes} placa${client.perdaPlacasMes === 1 ? "" : "s"}`,
      Math.min(30, Math.max(5, client.perdaPlacasMes * 2))
    );
  }

  if (client.percentualDesatualizado >= 20) {
    addSignal(
      "Base desatualizada",
      `${client.percentualDesatualizado.toFixed(1).replace(".", ",")}%`,
      Math.min(30, 10 + (client.percentualDesatualizado - 20) * 0.5)
    );
  }

  if (client.diasUltimoContato > 30) {
    addSignal(
      "Mais de 1 mês sem contato",
      `${client.diasUltimoContato} dias`,
      Math.min(20, 10 + (client.diasUltimoContato - 30) / 15)
    );
  }

  return {
    score: Math.round((100 - penalty) * 10) / 10,
    signals,
  };
}

export function calculateClientCriticality(
  client: ClientData
): CriticalityResult {
  let penalty = 0;
  const signals: CriticalSignal[] = [];
  const addSignal = (label: string, value: string, points: number) => {
    if (points <= 0) return;
    penalty += points;
    signals.push({ label, value, points });
  };

  if (client.marcoStatus === "atrasado") {
    addSignal("Marco atrasado", client.marcoData || "Prazo vencido", 35);
  } else if (client.marcoStatus === "pendente") {
    addSignal("Marco pendente", client.marcoData || "Sem atualização", 10);
  }

  const delta = parseCriticalityNumber(client.deltaConsumo);
  if (delta < 0) {
    addSignal(
      "Diferença boleto x consumo negativa",
      `R$ ${delta.toFixed(2).replace(".", ",")}`,
      Math.min(30, Math.max(5, Math.abs(delta) / 100))
    );
  }

  const outdated = client.percentualDesatualizado ?? 0;
  if (outdated > 0) {
    addSignal(
      "Veículos desatualizados",
      `${outdated.toFixed(1).replace(".", ",")}%`,
      Math.min(20, outdated * 0.2)
    );
  }

  const daysWithoutContact = client.diasUltimoContato ?? 0;
  if (daysWithoutContact >= 30) {
    addSignal("Sem contato recente", `${daysWithoutContact} dias`, 15);
  } else if (daysWithoutContact >= 14) {
    addSignal("Contato desatualizado", `${daysWithoutContact} dias`, 8);
  }

  if (client.flag === "Red Flag") addSignal("Red Flag", "Alta prioridade", 20);
  if (client.flag === "Black Flag")
    addSignal("Black Flag", "Atenção máxima", 18);
  if (client.flag === "Yellow Flag") addSignal("Yellow Flag", "Atenção", 10);

  if ((client.diasCorridos ?? 0) > 180 && !client.isComplete) {
    addSignal("Implantação prolongada", `${client.diasCorridos} dias`, 10);
  }

  return {
    score: Math.round((100 - penalty) * 10) / 10,
    signals,
  };
}

export type HealthScoreByCSM = { csm: string; score: number; clientes: number };

export function groupHealthScoreByCSM(
  marcos: ClientData[],
  ongoing: OngoingClientData[]
): HealthScoreByCSM[] {
  const groups = new Map<string, { total: number; clientes: number }>();
  const add = (csm: string, score: number) => {
    const key = csm.trim() || "Não informado";
    const current = groups.get(key) ?? { total: 0, clientes: 0 };
    current.total += score;
    current.clientes += 1;
    groups.set(key, current);
  };

  for (const client of marcos) {
    add(client.atendente, calculateClientCriticality(client).score);
  }
  for (const client of ongoing) {
    add(client.csm, calculateOngoingHealthScore(client).score);
  }

  return [...groups.entries()]
    .map(([csm, value]) => ({
      csm,
      clientes: value.clientes,
      score: Math.round((value.total / value.clientes) * 10) / 10,
    }))
    .sort((a, b) => a.csm.localeCompare(b.csm, "pt-BR"));
}
