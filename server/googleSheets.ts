import { importPKCS8, SignJWT } from "jose";
import { ENV } from "./_core/env";

export type SheetSource = "primary" | "secondary";

type SheetProperties = { sheetId?: number; title?: string };
type SheetsResponse = { sheets?: Array<{ properties?: SheetProperties }> };
type ValuesResponse = { values?: unknown[][] };

type TokenCache = { accessToken: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function getSpreadsheetId(source: SheetSource = "primary"): string {
  const spreadsheetId =
    source === "primary"
      ? ENV.googleSheetsPrimaryId
      : ENV.googleSheetsSecondaryId;
  if (!spreadsheetId)
    throw new Error(`ID da planilha ${source} não configurado.`);
  return spreadsheetId;
}

async function getAccessToken(forceRefresh = false): Promise<string> {
  if (
    !forceRefresh &&
    tokenCache &&
    tokenCache.expiresAt > Date.now() + 60_000
  ) {
    return tokenCache.accessToken;
  }

  if (!ENV.googleServiceAccountEmail || !ENV.googlePrivateKey) {
    throw new Error("Credenciais da conta de serviço Google não configuradas.");
  }

  const privateKey = ENV.googlePrivateKey.replace(/\\n/g, "\n");
  const signingKey = await importPKCS8(privateKey, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: SHEETS_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(ENV.googleServiceAccountEmail)
    .setAudience(TOKEN_ENDPOINT)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(signingKey);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!response.ok || !body.access_token) {
    throw new Error(
      `Falha ao autenticar na Google Sheets API: ${body.error_description ?? response.statusText}`
    );
  }

  tokenCache = {
    accessToken: body.access_token,
    expiresAt: Date.now() + Math.max(60, body.expires_in ?? 3600) * 1000,
  };
  return body.access_token;
}

async function sheetsRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true
): Promise<T> {
  const accessToken = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${accessToken}`);
  headers.set("accept", "application/json");
  if (init.body) headers.set("content-type", "application/json");

  const response = await fetch(`${SHEETS_API}${path}`, { ...init, headers });
  if (response.status === 401 && retry) {
    tokenCache = null;
    return sheetsRequest<T>(path, init, false);
  }

  const text = await response.text();
  let body: unknown = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? JSON.stringify((body as { error?: unknown }).error)
        : response.statusText;
    throw new Error(`Google Sheets API ${response.status}: ${message}`);
  }
  return body as T;
}

function valuesPath(spreadsheetId: string, range: string): string {
  return `/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
}

/** Obtém o nome de uma aba pelo gid (sheetId). */
export async function getSheetNameByGid(
  gid: number,
  source: SheetSource = "primary"
): Promise<string | null> {
  return getSheetNameBySpreadsheetId(getSpreadsheetId(source), gid);
}

async function getSheetNameBySpreadsheetId(
  spreadsheetId: string,
  gid: number
): Promise<string | null> {
  const spreadsheet = await sheetsRequest<SheetsResponse>(
    `/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties(sheetId,title)`
  );
  return (
    spreadsheet.sheets?.find(sheet => sheet.properties?.sheetId === gid)
      ?.properties?.title ?? null
  );
}

function csvCell(value: unknown): string {
  const cell = value == null ? "" : String(value);
  return /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

/** Lê uma célula por GID usando o valor formatado da planilha. */
export async function getSheetCellByGid(
  source: SheetSource,
  gid: number,
  cell: string
): Promise<string> {
  const spreadsheetId = getSpreadsheetId(source);
  const sheetName = await getSheetNameByGid(gid, source);
  if (!sheetName) {
    throw new Error(`Aba com gid=${gid} não encontrada na planilha ${source}.`);
  }
  const range = `'${sheetName.replace(/'/g, "''")}'!${cell}`;
  const result = await sheetsRequest<ValuesResponse>(
    `${valuesPath(spreadsheetId, range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`
  );
  return String(result.values?.[0]?.[0] ?? "");
}

/** Lê uma aba por GID e devolve CSV compatível com os hooks restaurados. */
export async function getSheetCsv(
  source: SheetSource,
  gid: number
): Promise<string> {
  return getSheetCsvBySpreadsheetId(getSpreadsheetId(source), gid);
}

/** Lê uma aba de uma planilha autorizada sem alterar os IDs configurados do projeto. */
export async function getSheetCsvBySpreadsheetId(
  spreadsheetId: string,
  gid: number
): Promise<string> {
  const sheetName = await getSheetNameBySpreadsheetId(spreadsheetId, gid);
  if (!sheetName)
    throw new Error(`Aba com gid=${gid} não encontrada na planilha informada.`);
  const range = `'${sheetName.replace(/'/g, "''")}'`;
  const result = await sheetsRequest<ValuesResponse>(
    `${valuesPath(spreadsheetId, range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`
  );
  return (result.values ?? [])
    .map(row => row.map(csvCell).join(","))
    .join("\n");
}

async function getSheetValues(
  spreadsheetId: string,
  range: string
): Promise<unknown[][]> {
  const result = await sheetsRequest<ValuesResponse>(
    `${valuesPath(spreadsheetId, range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`
  );
  return result.values ?? [];
}

/** Obtém o índice da próxima linha vazia em uma aba da planilha principal. */
export async function getNextEmptyRow(sheetName: string): Promise<number> {
  const values = await getSheetValues(
    getSpreadsheetId("primary"),
    `${sheetName}!A:A`
  );
  return values.length + 1;
}

async function updateValues(
  spreadsheetId: string,
  range: string,
  values: unknown[][]
): Promise<void> {
  await sheetsRequest(
    valuesPath(spreadsheetId, range) + "?valueInputOption=USER_ENTERED",
    {
      method: "PUT",
      body: JSON.stringify({ range, majorDimension: "ROWS", values }),
    }
  );
}

export type ChurnMotivoField =
  | "motivoCliente"
  | "motivoCsm"
  | "motivoFinanceiro"
  | "motivoComercial"
  | "ultimoBoleto";

/** Atualiza uma célula de motivo na linha exata da aba CHURNS. */
export async function updateChurnMotivo(data: {
  row: number;
  field: ChurnMotivoField;
  text: string;
}): Promise<{ success: boolean; row: number; column: string; sheetName: string }> {
  if (!Number.isInteger(data.row) || data.row < 2)
    throw new Error("Linha de CHURNS inválida.");
  const text = data.text.trim();
  if (!text) throw new Error("O motivo não pode ficar vazio.");
  const columnByField: Record<ChurnMotivoField, string> = {
    motivoCliente: "N",
    motivoCsm: "O",
    motivoFinanceiro: "P",
    motivoComercial: "Q",
    ultimoBoleto: "R",
  };
  const column = columnByField[data.field];
  if (!column) throw new Error("Coluna de motivo inválida.");
  const CHURNS_GID = 1060737054;
  const spreadsheetId = getSpreadsheetId("primary");
  const sheetName = await getSheetNameByGid(CHURNS_GID, "primary");
  if (!sheetName)
    throw new Error(`Aba com gid=${CHURNS_GID} não encontrada na planilha principal.`);
  await updateValues(spreadsheetId, `${sheetName}!${column}${data.row}`, [[text]]);
  return { success: true, row: data.row, column, sheetName };
}

/** Grava um atendimento na aba Agendas (gid=1655169262). */
export async function appendAtendimento(data: {
  data: string;
  cliente: string;
  tipo: string;
  situacao: string;
  razao: string;
  resumo: string;
  duracao: string;
  usuario?: string;
}): Promise<{ row: number; sheetName: string }> {
  const AGENDAS_GID = 1655169262;
  const spreadsheetId = getSpreadsheetId("primary");
  const sheetName = await getSheetNameByGid(AGENDAS_GID, "primary");
  if (!sheetName)
    throw new Error(
      `Aba com gid=${AGENDAS_GID} não encontrada na planilha principal.`
    );

  const nextRow = await getNextEmptyRow(sheetName);
  const range = `${sheetName}!A${nextRow}:I${nextRow}`;
  await updateValues(spreadsheetId, range, [
    [
      data.data,
      data.cliente,
      data.tipo,
      data.situacao,
      data.resumo,
      data.duracao,
      data.razao,
      "",
      data.usuario ?? "",
    ],
  ]);
  return { row: nextRow, sheetName };
}

/** Grava uma Fricção na aba indicada da planilha principal (gid=594161358). */
export async function appendFriccao(data: {
  central: string;
  data: string;
  titulo: string;
  setor: string;
  tag: string;
  descricao: string;
  usuario: string;
}): Promise<{ row: number; sheetName: string }> {
  const FRICCAO_GID = 594161358;
  const spreadsheetId = getSpreadsheetId("primary");
  const sheetName = await getSheetNameByGid(FRICCAO_GID, "primary");
  if (!sheetName)
    throw new Error(
      `Aba com gid=${FRICCAO_GID} não encontrada na planilha principal.`
    );

  const nextRow = await getNextEmptyRow(sheetName);
  const range = `${sheetName}!A${nextRow}:G${nextRow}`;
  await updateValues(spreadsheetId, range, [
    [
      data.central,
      data.data,
      data.titulo,
      data.setor,
      data.tag,
      data.descricao,
      data.usuario,
    ],
  ]);
  return { row: nextRow, sheetName };
}

/** Atualiza uma migração na aba Migração (gid=146618493). */
export async function updateMigracao(data: {
  empresa: string;
  dataInicio: string;
  levantamentoDados?: string;
  envioDados?: string;
  situacao?: string;
}): Promise<{ success: boolean; row?: number; sheetName: string }> {
  const MIGRACAO_GID = 146618493;
  const spreadsheetId = getSpreadsheetId("primary");
  const sheetName = await getSheetNameByGid(MIGRACAO_GID, "primary");
  if (!sheetName)
    throw new Error(
      `Aba com gid=${MIGRACAO_GID} não encontrada na planilha principal.`
    );

  const values = await getSheetValues(spreadsheetId, `${sheetName}!A:T`);
  let targetRow = -1;
  for (let i = 1; i < values.length; i++) {
    const row = values[i] ?? [];
    if (row[1] === data.empresa && row[3] === data.dataInicio) {
      targetRow = i + 1;
      break;
    }
  }
  if (targetRow === -1)
    throw new Error(
      `Migração não encontrada: ${data.empresa} (${data.dataInicio})`
    );

  const updates: Array<{ range: string; values: unknown[][] }> = [];
  if (data.levantamentoDados !== undefined)
    updates.push({
      range: `${sheetName}!L${targetRow}`,
      values: [[data.levantamentoDados]],
    });
  if (data.envioDados !== undefined)
    updates.push({
      range: `${sheetName}!P${targetRow}`,
      values: [[data.envioDados]],
    });
  if (data.situacao !== undefined)
    updates.push({
      range: `${sheetName}!T${targetRow}`,
      values: [[data.situacao]],
    });

  if (updates.length > 0) {
    await sheetsRequest(
      `/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({
          data: updates,
          valueInputOption: "USER_ENTERED",
        }),
      }
    );
  }
  return { success: true, row: targetRow, sheetName };
}
