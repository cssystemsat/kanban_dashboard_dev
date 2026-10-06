export const PROBLEM_STAGES = [
  "nova_flag",
  "plano_acao_feito",
  "em_tratativa",
  "precisa_escalonar",
  "fora_do_setor",
  "resolvida",
] as const;

export type ProblemStage = (typeof PROBLEM_STAGES)[number];

export type ProblemasSyncRow = {
  clientKey: string;
  clientName: string;
  boleto: string;
  comercial: string;
  csm: string;
  persona: string;
  status: string;
  flag: "Yellow Flag" | "Red Flag" | "Black Flag";
};

/**
 * Lê CSV do Google Sheets respeitando campos entre aspas, vírgulas e quebras
 * de linha em uma célula. A aba Marcos é a única fonte de entrada desta área.
 */
export function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some(cell => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some(cell => cell.trim() !== "")) rows.push(row);
  return rows;
}

function normalizeText(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function normalizeProblemFlag(
  value: string | undefined
): ProblemasSyncRow["flag"] | null {
  const normalized = normalizeText(value).replace(/\s+/g, " ");
  if (normalized.includes("yellow") || normalized.includes("amarela")) {
    return "Yellow Flag";
  }
  if (normalized.includes("red") || normalized.includes("vermelha")) {
    return "Red Flag";
  }
  if (normalized.includes("black") || normalized.includes("preta")) {
    return "Black Flag";
  }
  return null;
}

export function normalizeProblemClientKey(value: string): string {
  return normalizeText(value).replace(/\s+/g, " ");
}

/**
 * Colunas da aba Marcos (gid=0): A Código, B Cliente, C CSM, F Boleto,
 * N Status, O Flag, S ID Central, X Comercial e Y Persona. Linhas sem cliente são ignoradas.
 */
export function parseProblemasMarcosRows(csv: string): ProblemasSyncRow[] {
  const rows = parseCsvRows(csv);
  const seen = new Set<string>();
  const problems: ProblemasSyncRow[] = [];

  for (const row of rows.slice(1)) {
    const clientName = (row[1] ?? "").trim();
    const flag = normalizeProblemFlag(row[14]);
    if (!clientName || !flag) continue;

    const codigo = (row[0] ?? "").trim();
    const centralId = (row[18] ?? "").trim();
    const clientKey = normalizeProblemClientKey(
      centralId ? `central:${centralId}` : codigo ? `codigo:${codigo}` : `nome:${clientName}`
    );
    if (seen.has(clientKey)) continue;
    seen.add(clientKey);

    problems.push({
      clientKey,
      clientName,
      boleto: (row[5] ?? "").trim(),
      comercial: (row[23] ?? "").trim(),
      csm: (row[2] ?? "").trim(),
      persona: (row[24] ?? "").trim(),
      status: (row[13] ?? "").trim(),
      flag,
    });
  }

  return problems;
}
