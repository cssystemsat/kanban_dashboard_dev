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
 * Colunas: A=data, B=cliente, C=tipo, D=situação, E=resumo, F=duração, G=razão
 */
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

  const sheetName = await getSheetNameByGid(AGENDAS_GID);
  if (!sheetName) {
    throw new Error(`Aba com gid=${AGENDAS_GID} não encontrada na planilha.`);
  }

  const nextRow = await getNextEmptyRow(sheetName);
  const range = `${sheetName}!A${nextRow}:I${nextRow}`;

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: ENV.googleSheetsSpreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          data.data,     // A
          data.cliente,  // B
          data.tipo,     // C
          data.situacao, // D
          data.resumo,   // E
          data.duracao,  // F
          data.razao,    // G
          '',            // H (vazio)
          data.usuario ?? '', // I - usuário logado
        ],
      ],
    },
  });

  return { row: nextRow, sheetName };
}

/**
 * Atualiza uma migração na aba Migração (gid=146618493).
 * Busca a linha pela empresa e dataInicio, depois atualiza as colunas L, P, T.
 * Colunas: L=levantamentoDados, P=envioDados, T=situacao
 */
export async function updateMigracao(data: {
  empresa: string;
  dataInicio: string;
  levantamentoDados?: string;
  envioDados?: string;
  situacao?: string;
}): Promise<{ success: boolean; row?: number; sheetName: string }> {
  const MIGRACAO_GID = 146618493;

  const sheetName = await getSheetNameByGid(MIGRACAO_GID);
  if (!sheetName) {
    throw new Error(`Aba com gid=${MIGRACAO_GID} não encontrada na planilha.`);
  }

  // Buscar todas as linhas para encontrar a migração
  const sheets = getSheetsClient();
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: ENV.googleSheetsSpreadsheetId,
    range: `${sheetName}!A:T`, // Colunas até T
  });

  const values = result.data.values ?? [];
  let targetRow = -1;

  // Procurar pela empresa (coluna B, índice 1) e dataInicio (coluna D, índice 3)
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row[1] === data.empresa && row[3] === data.dataInicio) {
      targetRow = i + 1; // Sheets usa 1-indexed
      break;
    }
  }

  if (targetRow === -1) {
    throw new Error(`Migração não encontrada: ${data.empresa} (${data.dataInicio})`);
  }

  // Preparar updates para as colunas L, P, T
  const updates = [];

  if (data.levantamentoDados !== undefined) {
    updates.push({
      range: `${sheetName}!L${targetRow}`,
      values: [[data.levantamentoDados]],
    });
  }

  if (data.envioDados !== undefined) {
    updates.push({
      range: `${sheetName}!P${targetRow}`,
      values: [[data.envioDados]],
    });
  }

  if (data.situacao !== undefined) {
    updates.push({
      range: `${sheetName}!T${targetRow}`,
      values: [[data.situacao]],
    });
  }

  if (updates.length === 0) {
    return { success: true, row: targetRow, sheetName };
  }

  // Executar batch update
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: ENV.googleSheetsSpreadsheetId,
    requestBody: {
      data: updates,
      valueInputOption: "USER_ENTERED",
    },
  });

  return { success: true, row: targetRow, sheetName };
}
