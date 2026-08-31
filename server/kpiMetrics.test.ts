import { describe, expect, it } from "vitest";
import {
  getPreviousOnboardingWeek,
  parseOnboardingKpiMetrics,
} from "./kpiMetrics";

const marcosCsv = [
  "Código,Cliente,CS,Entrada",
  "SSX_1,ALPHA TECNOLOGIA,Ana Modesto,01/08/2026",
  "SSX_2,ALTOTRAK,Ana Modesto,02/08/2026",
  "SSX_3,CONTROL ON,Ana Modesto,03/08/2026",
].join("\n");

const kpisCsv = [
  "A,B,C,AK,AL,AM",
  "linha 1,,,BVTRACKER,415,24/08/2026",
  "linha 2,,,Fênix Sat,427,30/08/2026",
  "linha 3,,,FORT SERVIÇOS,506,31/08/2026",
  "linha 4,,,,,30/08/2026",
].join("\n");

// A posição real de AK/AM é 36/38; o helper abaixo mantém o fixture legível.
function placeKpiColumns(rows: string[][]): string {
  return rows
    .map(row => {
      const padded = [...row];
      const name = padded[3] ?? "";
      const date = padded[5] ?? "";
      padded.length = 39;
      padded[36] = name;
      padded[38] = date;
      return padded.map(value => value ?? "").join(",");
    })
    .join("\n");
}

describe("Métricas reais de Onboarding", () => {
  it("calcula a semana anterior de segunda a domingo em BRT", () => {
    expect(
      getPreviousOnboardingWeek(new Date("2026-08-31T12:00:00.000Z"))
    ).toEqual({
      start: "2026-08-24",
      end: "2026-08-30",
    });
  });

  it("conta todos os clientes nomeados em Marcos", () => {
    const result = parseOnboardingKpiMetrics(
      marcosCsv,
      placeKpiColumns([kpisCsv.split("\n")[0].split(",")]),
      new Date("2026-08-31T12:00:00.000Z")
    );
    expect(result.clientesAtivos.value).toBe(3);
    expect(result.clientesAtivos.clients).toEqual([
      "ALPHA TECNOLOGIA",
      "ALTOTRAK",
      "CONTROL ON",
    ]);
  });

  it("conta AK somente quando AM está na semana passada e retorna os nomes", () => {
    const result = parseOnboardingKpiMetrics(
      marcosCsv,
      placeKpiColumns(kpisCsv.split("\n").map(line => line.split(","))),
      new Date("2026-08-31T12:00:00.000Z")
    );
    expect(result.concluidos.value).toBe(2);
    expect(result.concluidos.clients).toEqual(["BVTRACKER", "Fênix Sat"]);
    expect(result.concluidos.periodStart).toBe("2026-08-24");
    expect(result.concluidos.periodEnd).toBe("2026-08-30");
  });

  it("ignora registros sem cliente em AK e datas inválidas em AM", () => {
    const rows = [
      ["A", "B", "C", "", "", "30/08/2026"],
      ["A", "B", "C", "SEM DATA", "", "não é uma data"],
    ];
    const result = parseOnboardingKpiMetrics(
      marcosCsv,
      placeKpiColumns([kpisCsv.split("\n")[0].split(","), ...rows]),
      new Date("2026-08-31T12:00:00.000Z")
    );
    expect(result.concluidos.value).toBe(0);
    expect(result.concluidos.clients).toEqual([]);
  });

  it("ignora cabeçalhos extras e aceita datas ISO, com hífen, ponto e horário", () => {
    const rows = [
      ["A", "B", "C", "KPI", "", "AM"],
      ["A", "B", "C", "Quantidade", "", "Data de implantação"],
      ["", "", "", "", "", ""],
      ["A", "B", "C", "CLIENTE ISO", "", "2026-08-24T00:00:00"],
      ["A", "B", "C", "CLIENTE HIFEN", "", "24-08-2026"],
      ["A", "B", "C", "CLIENTE PONTO", "", "24.08.2026 12:00:00"],
    ];
    const result = parseOnboardingKpiMetrics(
      marcosCsv,
      placeKpiColumns(rows),
      new Date("2026-08-31T12:00:00.000Z")
    );
    expect(result.concluidos.value).toBe(3);
    expect(result.concluidos.clients).toEqual([
      "CLIENTE ISO",
      "CLIENTE HIFEN",
      "CLIENTE PONTO",
    ]);
  });
});
