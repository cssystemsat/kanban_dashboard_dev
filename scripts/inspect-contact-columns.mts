import { getSheetCsv, getSheetNameByGid } from "../server/googleSheets";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === '"') {
      if (quoted && next === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      result.push(value.trim());
      value = "";
    } else value += character;
  }
  result.push(value.trim());
  return result;
}

for (const [label, gid] of [
  ["Onboarding", 0],
  ["ongoing", 1152476970],
] as const) {
  const [sheetName, csv] = await Promise.all([
    getSheetNameByGid(gid, "primary"),
    getSheetCsv("primary", gid),
  ]);
  const rows = csv.split("\n").filter(Boolean).map(parseCsvLine);
  const headers = rows[0] ?? [];
  const contactColumns = headers
    .map((header, index) => ({ index, header }))
    .filter(({ header }) =>
      /contato|telefone|celular|whatsapp|email|decisor|respons[aá]vel/i.test(
        header
      )
    );
  const examples = rows.slice(1, 8).map(row => ({
    cliente: row[1] ?? "",
    contatos: Object.fromEntries(
      contactColumns.map(({ index, header }) => [
        header || `col_${index + 1}`,
        row[index] ?? "",
      ])
    ),
  }));
  console.log(
    JSON.stringify(
      {
        label,
        gid,
        sheetName,
        headers: headers.map((header, index) => ({ index, header })),
        contactColumns,
        examples,
      },
      null,
      2
    )
  );
}
