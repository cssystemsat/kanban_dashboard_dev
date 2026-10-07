import { describe, expect, it } from "vitest";
import {
  calculateClientCriticality,
  calculateOngoingHealthScore,
  groupHealthScoreByCSM,
} from "@/lib/criticality";
import type { ClientData } from "@/hooks/useKanbanData";
import type { OngoingClientData } from "@/hooks/useOngoingData";

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

const makeOngoingClient = (
  overrides: Partial<OngoingClientData> = {}
): OngoingClientData => ({
  id: "ongoing-1",
  codigoCliente: "001",
  centralId: "1001",
  nome: "Ongoing teste",
  csm: "CSM",
  placas: 100,
  ultimoBoleto: 1000,
  valorMedioPorPlaca: 10,
  percentualDesatualizado: 0,
  unidadesDesatualizadas: 0,
  ultimoContato: "01/01/2026",
  diasUltimoContato: 0,
  flag: "",
  estrela: false,
  situacao: "Ativo",
  comercial: "",
  decisor: "",
  contatoDecissor: "",
  deltaConsumo: 0,
  perdaPlacasMes: 0,
  entrada: "01/01/2026",
  cidade: "",
  estado: "",
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

  it("can become negative when penalties exceed the initial 100 points", () => {
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

    expect(result.score).toBe(-28);
  });

  it("uses the four initial Ongoing rules with graduated fair discounts", () => {
    const result = calculateOngoingHealthScore(
      makeOngoingClient({
        deltaConsumo: -1000,
        perdaPlacasMes: 5,
        percentualDesatualizado: 40,
        diasUltimoContato: 60,
      })
    );

    expect(result.score).toBe(48);
    expect(result.signals.map(signal => signal.label)).toEqual([
      "Delta consumo negativo",
      "Perda de placas no mês",
      "Base desatualizada",
      "Mais de 1 mês sem contato",
    ]);
  });

  it("combines Marcos and Ongoing clients in the CSM average", () => {
    const groups = groupHealthScoreByCSM(
      [makeClient({ atendente: "CSM" })],
      [
        makeOngoingClient({
          csm: "CSM",
          deltaConsumo: -1000,
          perdaPlacasMes: 5,
          percentualDesatualizado: 40,
          diasUltimoContato: 60,
        }),
      ]
    );

    expect(groups).toEqual([{ csm: "CSM", clientes: 2, score: 74 }]);
  });

  it("deducts points from a low persisted NPS average", () => {
    expect(calculateOngoingHealthScore(makeOngoingClient(), 5).score).toBe(80);
    expect(calculateOngoingHealthScore(makeOngoingClient(), 7).score).toBe(92);
    expect(calculateOngoingHealthScore(makeOngoingClient(), 9).score).toBe(100);
  });
});
