export type TimelineCsvEvent = {
  date: string;
  title: string;
  sector: string;
  tag: string;
  description: string;
  csm: string;
};

export type TimelineCsvRow = {
  client: string;
  event: TimelineCsvEvent;
};

export type TimelineClientEntry = {
  client: string;
  entryDate: string;
};

/**
 * Faz o parse de CSV respeitando aspas, vírgulas e quebras de linha dentro de
 * uma célula. A API do Google Sheets envolve a descrição multiline em aspas,
 * portanto ela deve permanecer na coluna F e no mesmo acontecimento.
 */
export function parseTimelineCsvRecords(csv: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let current = "";
  let insideQuotes = false;

  const pushCell = () => {
    record.push(current.trim());
    current = "";
  };

  const pushRecord = () => {
    if (record.length > 0 || current.length > 0) {
      pushCell();
      records.push(record);
    }
    record = [];
  };

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const nextCharacter = csv[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === "," && !insideQuotes) {
      pushCell();
    } else if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      pushRecord();
    } else {
      current += character;
    }
  }

  if (record.length > 0 || current.length > 0) pushRecord();
  return records;
}

export function parseTimelineCsvRows(csv: string): TimelineCsvRow[] {
  return parseTimelineCsvRecords(csv)
    .slice(1)
    .filter(row => Boolean(row[0]?.trim() && row[1]?.trim() && row[2]?.trim()))
    .map(row => ({
      client: row[0].trim(),
      event: {
        date: row[1].trim(),
        title: row[2].trim(),
        sector: row[3]?.trim() || "Não informado",
        tag: row[4]?.trim() || "Não informado",
        description: row[5]?.trim() || "Não informado",
        csm: row[6]?.trim() || "Não informado",
      },
    }));
}

/** Coluna B = cliente; coluna D = data de entrada na aba Marcos. */
export function parseTimelineClientEntries(csv: string): TimelineClientEntry[] {
  return parseTimelineCsvRecords(csv)
    .slice(1)
    .filter(row => Boolean(row[1]?.trim() && row[3]?.trim()))
    .map(row => ({ client: row[1].trim(), entryDate: row[3].trim() }));
}
