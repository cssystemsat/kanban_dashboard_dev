import { describe, expect, it } from "vitest";
import { parseMigrationKpiMetrics } from "./migrationMetrics";

function makeMigrationRow({
  name,
  startDate = "",
  duration,
  status,
}: {
  name: string;
  startDate?: string;
  duration: string | number;
  status: string;
}) {
  const row = Array.from({ length: 27 }, () => "");
  row[0] = `id-${name}`;
  row[2] = startDate;
  row[3] = String(duration);
  row[4] = name;
  row[19] = status;
  return row.join(",");
}

describe("Métricas reais de Migração", () => {
  it("conta o status Em andamento e devolve as empresas para o modal", () => {
    const csv = [
      [
        "F",
        "Inicio",
        "Fim",
        "Duração (Dias)",
        "Cliente com link da planilha",
        ...Array.from({ length: 14 }, () => ""),
        "Situação atual",
      ].join(","),
      makeMigrationRow({
        name: "Empresa A",
        duration: 90,
        status: "Em andamento",
      }),
      makeMigrationRow({
        name: "Empresa B",
        duration: 150,
        status: "Finalizada",
      }),
      makeMigrationRow({
        name: "Empresa C",
        duration: 30,
        status: "em andamento",
      }),
    ].join("\n");

    const metrics = parseMigrationKpiMetrics(csv);

    expect(metrics.emAndamento.value).toBe(2);
    expect(metrics.emAndamento.clients).toEqual(["Empresa A", "Empresa C"]);
  });

  it("conta Atrasadas somente quando D é maior que 365", () => {
    const csv = [
      makeMigrationRow({
        name: "Exatamente 365",
        duration: 365,
        status: "Em andamento",
      }),
      makeMigrationRow({
        name: "Acima de 365",
        duration: 366,
        status: "Finalizada",
      }),
      makeMigrationRow({
        name: "Com texto",
        duration: "sem número",
        status: "Paralisado",
      }),
    ].join("\n");

    const metrics = parseMigrationKpiMetrics(csv);

    expect(metrics.atrasadas.value).toBe(1);
    expect(metrics.atrasadas.clients).toEqual(["Acima de 365"]);
  });

  it("calcula a média de D apenas nas linhas com data em C e aceita datas de dois dígitos", () => {
    const csv = [
      makeMigrationRow({
        name: "Com data 1",
        startDate: "01/02/26",
        duration: 100,
        status: "Finalizada",
      }),
      makeMigrationRow({
        name: "Com data 2",
        startDate: "2026-03-10",
        duration: "200",
        status: "Finalizada",
      }),
      makeMigrationRow({
        name: "Sem data",
        duration: 999,
        status: "Em andamento",
      }),
    ].join("\n");

    const metrics = parseMigrationKpiMetrics(csv);

    expect(metrics.tempoMedio.value).toBe(150);
    expect(metrics.tempoMedio.details).toEqual([
      "Com data 1 — início em 01/02/2026 — 100.0 dias",
      "Com data 2 — início em 10/03/2026 — 200.0 dias",
    ]);
  });

  it("mantém Concluídas em zero temporariamente", () => {
    const metrics = parseMigrationKpiMetrics("");

    expect(metrics.concluidas.value).toBe(0);
  });
});
