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
      const averageDays = padded[4] ?? "";
      const date = padded[5] ?? "";
      padded.length = 39;
      padded[36] = name;
      padded[37] = averageDays;
      padded[38] = date;
      return padded.map(value => value ?? "").join(",");
    })
    .join("\n");
}

function makeMarcosCsv(
  records: Array<{ name: string; marcos: string[] }>
): string {
  const header = Array.from({ length: 41 }, (_, index) => {
    if (index === 1) return "2 - Cliente";
    if (index >= 36 && index <= 40) return `Marco ${index - 35}`;
    return "";
  });
  const rows = records.map(record => {
    const row = Array.from({ length: 41 }, () => "");
    row[1] = record.name;
    record.marcos.forEach((value, index) => {
      row[36 + index] = value;
    });
    return row;
  });
  return [header, ...rows].map(row => row.join(",")).join("\n");
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
    expect(result.tempoMedio.value).toBeCloseTo(449.3333, 3);
    expect(result.tempoMedio.details).toEqual([
      "BVTRACKER — implantação em 24/08/2026 — 415.0 dias",
      "Fênix Sat — implantação em 30/08/2026 — 427.0 dias",
      "FORT SERVIÇOS — implantação em 31/08/2026 — 506.0 dias",
    ]);
  });

  it("calcula Dentro do prazo sem marco atrasado e entrega a lista do modal", () => {
    const result = parseOnboardingKpiMetrics(
      makeMarcosCsv([
        { name: "ATRASADO", marcos: ["30/08/2026", "", "", "", ""] },
        { name: "PRAZO", marcos: ["31/08/2026", "", "", "", ""] },
        { name: "PENDENTE", marcos: ["", "", "", "", ""] },
        { name: "COMPLETO", marcos: ["OK", "OK", "OK", "OK", "OK"] },
      ]),
      placeKpiColumns([kpisCsv.split("\n")[0].split(",")]),
      new Date("2026-08-31T12:00:00.000Z")
    );
    expect(result.dentroDoPrazo.value).toBe(3);
    expect(result.dentroDoPrazo.percentage).toBe(75);
    expect(result.dentroDoPrazo.clients).toEqual([
      "PRAZO",
      "PENDENTE",
      "COMPLETO",
    ]);
    expect(result.paradosAtrasados.value).toBe(1);
    expect(result.paradosAtrasados.clients).toEqual(["ATRASADO"]);
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
