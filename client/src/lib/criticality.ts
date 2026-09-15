import type { ClientData } from "@/hooks/useKanbanData";

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
