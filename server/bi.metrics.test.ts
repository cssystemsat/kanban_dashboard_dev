import { describe, expect, it } from "vitest";
import {
  getBICriticalGroups,
  getBIClientGroups,
  groupBoletoByCSM,
  groupClientCountByCSM,
  parseBoleto,
} from "../client/src/lib/biMetrics";

describe("KPIs do BI baseados nos marcos de Marcos", () => {
  it("conta implantação nos marcos 1, 2 e 3", () => {
    const groups = getBIClientGroups([
      { nome: "Cliente 1", marco: 1, isComplete: false },
      { nome: "Cliente 2", marco: 2, isComplete: false },
      { nome: "Cliente 3", marco: 3, isComplete: false },
      { nome: "Cliente 4", marco: 4, isComplete: false },
    ]);

    expect(groups.implantacao.map(client => client.nome)).toEqual([
      "Cliente 1",
      "Cliente 2",
      "Cliente 3",
    ]);
  });

  it("conta onboarding nos marcos 3, 4 e 5", () => {
    const groups = getBIClientGroups([
      { nome: "Cliente 3", marco: 3, isComplete: false },
      { nome: "Cliente 4", marco: 4, isComplete: false },
      { nome: "Cliente 5", marco: 5, isComplete: false },
      { nome: "Cliente 2", marco: 2, isComplete: false },
    ]);

    expect(groups.onboarding.map(client => client.nome)).toEqual([
      "Cliente 3",
      "Cliente 4",
      "Cliente 5",
    ]);
  });

  it("considera implantado somente quem concluiu os cinco marcos", () => {
    const groups = getBIClientGroups([
      { nome: "Concluído", marco: 5, isComplete: true },
      { nome: "Ainda no 5", marco: 5, isComplete: false },
      { nome: "No 4", marco: 4, isComplete: false },
    ]);

    expect(groups.implantados.map(client => client.nome)).toEqual(["Concluído"]);
  });

  it("permite que o marco 3 apareça nos dois KPIs de andamento", () => {
    const groups = getBIClientGroups([
      { nome: "Marco 3", marco: 3, isComplete: false },
    ]);

    expect(groups.implantacao).toHaveLength(1);
    expect(groups.onboarding).toHaveLength(1);
  });

  it("separa os três indicadores críticos pelas regras de atraso", () => {
    const groups = getBICriticalGroups([
      {
        nome: "Implantação atrasada",
        marco: 2,
        marcoStatus: "atrasado",
        isComplete: false,
        diasCorridos: 40,
      },
      {
        nome: "Onboarding atrasado",
        marco: 4,
        marcoStatus: "atrasado",
        isComplete: false,
        diasCorridos: 90,
      },
      {
        nome: "Ongoing atrasado",
        marco: 5,
        marcoStatus: "ok",
        isComplete: true,
        diasCorridos: 366,
      },
    ]);

    expect(groups.atrasoImplantacao.map(client => client.nome)).toEqual([
      "Implantação atrasada",
    ]);
    expect(groups.atrasoOnboarding.map(client => client.nome)).toEqual([
      "Onboarding atrasado",
    ]);
    expect(groups.atrasoOngoing.map(client => client.nome)).toEqual([
      "Ongoing atrasado",
    ]);
  });

  it("agrega clientes e boletos por CSM com moeda brasileira", () => {
    expect(parseBoleto("R$ 1.250,50")).toBe(1250.5);
    expect(groupClientCountByCSM([
      { nome: "A", atendente: "Ana", ultimoBoleto: "R$ 100,00" },
      { nome: "B", atendente: "Ana", ultimoBoleto: "R$ 250,00" },
      { nome: "C", atendente: "Bruno", ultimoBoleto: "R$ 300,00" },
    ])).toEqual([
      { csm: "Ana", clientes: 2 },
      { csm: "Bruno", clientes: 1 },
    ]);
    expect(groupBoletoByCSM([
      { nome: "A", atendente: "Ana", ultimoBoleto: "R$ 100,00" },
      { nome: "B", atendente: "Ana", ultimoBoleto: "R$ 250,00" },
      { nome: "C", atendente: "Bruno", ultimoBoleto: "R$ 300,00" },
    ])).toEqual([
      { csm: "Ana", valor: 350 },
      { csm: "Bruno", valor: 300 },
    ]);
  });
});
