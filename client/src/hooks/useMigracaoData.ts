import { useState, useCallback } from 'react';

export interface MigracaoData {
  migradoHoje: number | null;   // G4 = Placas migradas no dia
  migradoMes: number | null;    // I4 = Placas migradas no mês
  migradosAno: number | null;   // G5 = Migrados no ano
  // Campos futuros (a definir):
  emMigracao: number | null;   // G6 = Migrações em andamento
  finalizadas: number | null;   // I3 = Migrações concluídas no mês
}

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC/pub?gid=1590626518&output=csv';

function parseNum(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const cleaned = val.trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export const useMigracaoData = () => {
  const [data, setData] = useState<MigracaoData>({
    migradoHoje: null,
    migradoMes: null,
    migradosAno: null,
    emMigracao: null,
    finalizadas: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(SHEET_URL);
      if (!response.ok) throw new Error('Erro ao buscar dados de migração');

      const csv = await response.text();
      const lines = csv.split('\n');

      // Parsear CSV respeitando campos entre aspas
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let insideQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (insideQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            result.push(current); current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        // Remove aspas dos valores
        return result.map(v => v.replace(/^"|"$/g, ''));
      };

      // Linhas 0-based: linha 3=idx3, linha 4=idx4, linha 5=idx5, linha 2=idx2
      const row3 = lines[2] ? parseCSVLine(lines[2].replace(/\r$/, '')) : [];
      const row4 = lines[3] ? parseCSVLine(lines[3].replace(/\r$/, '')) : [];
      const row5 = lines[4] ? parseCSVLine(lines[4].replace(/\r$/, '')) : [];
      const row6 = lines[5] ? parseCSVLine(lines[5].replace(/\r$/, '')) : [];

      // Mapeamento de colunas (0-indexed):
      // Linha 4 (Placas migradas): Col 7 (idx 6) = 327, Col 9 (idx 8) = 2000
      // Linha 5 (Migrados no ano): Col 7 (idx 6) = 7029
      // Linha 6 (Migrações em andamento): Col 7 (idx 6) = 43
      // Linha 3 (Migrações concluidas): Col 10 (idx 9) = 3
      const migradoHoje = parseNum(row4[6]);   // G4 = Placas migradas no dia (327)
      const migradoMes  = parseNum(row4[8]);   // I4 = Placas migradas no mês (2000)
      const migradosAno = parseNum(row5[6]);   // G5 = Migrados no ano (7029)
      const emMigracao  = parseNum(row6[6]);   // G6 = Migrações em andamento (43)
      const finalizadas = parseNum(row3[9]);   // I3 = Migrações concluídas no mês (3)

      setData({
        migradoHoje,
        migradoMes,
        migradosAno,
        emMigracao,
        finalizadas,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};
