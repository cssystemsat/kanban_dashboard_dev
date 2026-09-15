import { describe, expect, it } from "vitest";
import { calculateClientCriticality } from "@/lib/criticality";
import type { ClientData } from "@/hooks/useKanbanData";

const makeClient = (overrides: Partial<ClientData> = {}): ClientData => ({
  id: "client-1",
  nome: "Cliente teste",
  codigoCliente: "001",
  entrada: "01/01/2026",
  diasCorridos: 30,
  urs: "100",
  rastreadores: "100",
  ultimoBoleto: "R$ 100,00",
  atendente: "CSM",
  flag: "",
  estrela: false,
  comercial: "",
  saude: "",
  marco: 1,
  marcoStatus: "ok",
  marcoData: "",
  ...overrides,
});

describe("client criticality score", () => {
  it("starts every client at 100 when no critical signal exists", () => {
    const result = calculateClientCriticality(makeClient());

    expect(result.score).toBe(100);
    expect(result.signals).toEqual([]);
  });

  it("subtracts the configured penalties and exposes their reasons", () => {
    const result = calculateClientCriticality(
      makeClient({
        marcoStatus: "atrasado",
        flag: "Red Flag",
        percentualDesatualizado: 50,
        diasUltimoContato: 30,
        deltaConsumo: "-R$ 1.000,00",
      })
    );

    expect(result.score).toBe(10);
    expect(result.signals.map(signal => signal.points)).toEqual([
      35, 10, 10, 15, 20,
    ]);
  });

  it("never goes below zero", () => {
    const result = calculateClientCriticality(
      makeClient({
        marcoStatus: "atrasado",
        flag: "Black Flag",
        percentualDesatualizado: 100,
        diasUltimoContato: 60,
        diasCorridos: 200,
        isComplete: false,
        deltaConsumo: "-R$ 10.000,00",
      })
    );

    expect(result.score).toBe(0);
  });
});
