export type ContactFields = {
  decisor: string;
  telefone: string;
};

/** A planilha principal armazena o decisor em AE (30) e telefone em AF (31). */
export function getContactFields(row: string[]): ContactFields {
  return {
    decisor: row[30]?.trim() || "",
    telefone: row[31]?.trim() || row[10]?.trim() || "",
  };
}
