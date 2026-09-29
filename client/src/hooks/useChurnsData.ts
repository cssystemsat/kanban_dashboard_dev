import { useState, useCallback } from "react";
import { cachedFetch } from "@/lib/sheetsCache";

export interface ChurnData {
  id: string;
  nome: string;
  tipo: string;
  persona: string;
  situacao: string;
  decisor: string;
  numero: string;
  dataEntrada: string;
  dataSaida: string;
  dataSaidaParsed: Date | null;
  mesesCasa: number;
  objetivo: string;
  atendente: string;
  vendedor: string;
  motivoCancelamento: string;
  motivoCliente: string;
  motivoCsm: string;
  motivoFinanceiro: string;
  motivoComercial: string;
  ultimoBoleto: string;
  boletoValor: number | null;
  idCentral: string;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr?.trim()) return null;
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1
    ? date
    : null;
}

/** Aceita R$ 1.250,00, 1250,00 e 1250.00; valores inválidos retornam null. */
export function parseBrazilianCurrency(value: string): number | null {
  const normalized = value.trim().replace(/R\$\s?/gi, "");
  if (!normalized) return null;
  const compact = normalized.replace(/\s/g, "");
  let numeric = compact;
  if (compact.includes(",")) {
    numeric = compact.replace(/\./g, "").replace(",", ".");
  } else if ((compact.match(/\./g) ?? []).length > 1) {
    numeric = compact.replace(/\./g, "");
  }
  const parsed = Number(numeric.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export const useChurnsData = () => {
  const [data, setData] = useState<ChurnData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cachedFetch(
        "https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/export?format=csv&gid=1060737054"
      );
      if (!response.ok) throw new Error("Erro ao buscar dados da aba CHURNS");
      const rows = parseCSVRecords(await response.text());
      if (rows.length < 2) throw new Error("Aba CHURNS vazia ou inválida");

      const churns: ChurnData[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const nome = row[0]?.trim() ?? "";
        if (!nome) continue;
        const dataSaida = row[7]?.trim() ?? "";
        churns.push({
          id: `${row[18]?.trim() || nome}-${i}`,
          nome,
          tipo: row[1]?.trim() ?? "",
          persona: row[2]?.trim() ?? "",
          situacao: row[3]?.trim() ?? "",
          decisor: row[4]?.trim() ?? "",
          numero: row[5]?.trim() ?? "",
          dataEntrada: row[6]?.trim() ?? "",
          dataSaida,
          dataSaidaParsed: parseDate(dataSaida),
          mesesCasa: Number.parseInt(row[8]?.trim() ?? "0", 10) || 0,
          objetivo: row[9]?.trim() ?? "",
          atendente: row[10]?.trim() ?? "",
          vendedor: row[11]?.trim() ?? "",
          motivoCancelamento: row[12]?.trim() ?? "",
          motivoCliente: row[13]?.trim() ?? "",
          motivoCsm: row[14]?.trim() ?? "",
          motivoFinanceiro: row[15]?.trim() ?? "",
          motivoComercial: row[16]?.trim() ?? "",
          ultimoBoleto: row[17]?.trim() ?? "",
          boletoValor: parseBrazilianCurrency(row[17]?.trim() ?? ""),
          idCentral: row[18]?.trim() ?? "",
        });
      }
      setData(churns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};

/** CSV parser que preserva vírgulas e quebras de linha dentro de aspas. */
export function parseCSVRecords(csv: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some(value => value.trim())) records.push(row);
      row = [];
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some(value => value.trim())) records.push(row);
  }
  return records;
}
