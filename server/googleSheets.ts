import { google } from "googleapis";
import { ENV } from "./_core/env";

/**
 * Cria um cliente autenticado para a Google Sheets API
 * usando a conta de serviço configurada nas variáveis de ambiente.
 */
function getSheetsClient() {
  const privateKey = ENV.googlePrivateKey.replace(/\\n/g, "\n");
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: ENV.googleServiceAccountEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

/**
 * Obtém o nome de uma aba da planilha pelo seu gid (sheetId).
 */
export async function getSheetNameByGid(gid: number): Promise<string | null> {
  const sheets = getSheetsClient();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: ENV.googleSheetsSpreadsheetId,
  });
  for (const sheet of spreadsheet.data.sheets ?? []) {
    if (sheet.properties?.sheetId === gid) {
      return sheet.properties.title ?? null;
    }
  }
  return null;
}

/**
 * Obtém o índice da próxima linha vazia em uma aba (baseado na coluna A).
 */
export async function getNextEmptyRow(sheetName: string): Promise<number> {
  const sheets = getSheetsClient();
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: ENV.googleSheetsSpreadsheetId,
    range: `${sheetName}!A:A`,
  });
  const values = result.data.values ?? [];
  return values.length + 1;
}

/**
 * Grava um atendimento na aba Agendas (gid=1655169262).
 * Colunas: A=data, B=cliente, C=tipo, D=situação, E=resumo, F=duração
 */
export async function appendAtendimento(data: {
  data: string;
  cliente: string;
  tipo: string;
  situacao: string;
  resumo: string;
  duracao: string;
}): Promise<{ row: number; sheetName: string }> {
  const AGENDAS_GID = 1655169262;

  const sheetName = await getSheetNameByGid(AGENDAS_GID);
  if (!sheetName) {
    throw new Error(`Aba com gid=${AGENDAS_GID} não encontrada na planilha.`);
  }

  const nextRow = await getNextEmptyRow(sheetName);
  const range = `${sheetName}!A${nextRow}:F${nextRow}`;

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: ENV.googleSheetsSpreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          data.data,
          data.cliente,
          data.tipo,
          data.situacao,
          data.resumo,
          data.duracao,
        ],
      ],
    },
  });

  return { row: nextRow, sheetName };
}
