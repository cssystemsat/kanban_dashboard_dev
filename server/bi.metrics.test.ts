import { describe, expect, it } from "vitest";
import {
  calculateAverageTTV,
  getBICriticalGroups,
  getBIClientGroups,
  getUnflaggedOverdueGroups,
  groupAverageTTVByObjective,
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

  it("mostra atrasados sem Flag apenas quando não há Red, Yellow ou Black Flag", () => {
    const groups = getUnflaggedOverdueGroups([
      {
        nome: "Implantação sem flag",
        marco: 2,
        marcoStatus: "atrasado",
        isComplete: false,
        diasCorridos: 20,
        flag: "",
      },
      {
        nome: "Onboarding sem flag",
        marco: 4,
        marcoStatus: "atrasado",
        isComplete: false,
        diasCorridos: 40,
        flag: "",
      },
      {
        nome: "Com red flag",
        marco: 2,
        marcoStatus: "atrasado",
        isComplete: false,
        diasCorridos: 20,
        flag: "Red Flag",
      },
      {
        nome: "Com yellow flag",
        marco: 4,
        marcoStatus: "atrasado",
        isComplete: false,
        diasCorridos: 40,
        flag: "Yellow Flag",
      },
    ]);

    expect(groups.implantacao.map(client => client.nome)).toEqual([
      "Implantação sem flag",
    ]);
    expect(groups.onboarding.map(client => client.nome)).toEqual([
      "Onboarding sem flag",
    ]);
  });

  it("calcula TTV pela diferença entre a entrada e a data do objetivo concluído", () => {
    const ttv = calculateAverageTTV(
      [
        { id: "cliente-a", nome: "Cliente A", entrada: "01/01/2026" },
        { id: "cliente-b", nome: "Cliente B", entrada: "10/01/2026" },
      ],
      [
        {
          clientId: "cliente-a",
          objectiveIndex: 0,
          completedAt: new Date(2026, 0, 11),
        },
        {
          clientId: "cliente-b",
          objectiveIndex: 1,
          completedAt: new Date(2026, 0, 30),
        },
      ]
    );

    expect(ttv.entries.map(entry => entry.days)).toEqual([10, 20]);
    expect(ttv.averageDays).toBe(15);
  });

  it("separa a média de implantação por cada objetivo existente", () => {
    const rows = groupAverageTTVByObjective(
      [
        {
          id: "cliente-a",
          nome: "Cliente A",
          entrada: "01/01/2026",
          tags: ["Diagnóstico", "Treinamento", "Expansão"],
        },
        {
          id: "cliente-b",
          nome: "Cliente B",
          entrada: "01/01/2026",
          tags: ["Diagnóstico", "Treinamento"],
        },
      ],
      [
        {
          clientId: "cliente-a",
          objectiveIndex: 0,
          completedAt: new Date(2026, 0, 11),
        },
        {
          clientId: "cliente-b",
          objectiveIndex: 0,
          completedAt: new Date(2026, 0, 21),
        },
      ]
    );

    expect(rows).toEqual([
      { objective: "Diagnóstico", dias: 15, conclusoes: 2 },
      { objective: "Expansão", dias: null, conclusoes: 0 },
      { objective: "Treinamento", dias: null, conclusoes: 0 },
    ]);
  });
});
