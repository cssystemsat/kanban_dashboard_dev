import { useState, useCallback } from 'react';

export interface MigracaoData {
  migradoHoje: number | null;   // G4 = Placas migradas no dia
  migradoMes: number | null;    // I4 = Placas migradas no mês
  migradosAno: number | null;   // G5 = Migrados no ano
  // Campos futuros (a definir):
  emMigracao: number | null;
  finalizadas: number | null;
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
        return result;
      };

      // Linha 4 = índice 3, Linha 5 = índice 4 (0-based)
      const row4 = lines[3] ? parseCSVLine(lines[3].replace(/\r$/, '')) : [];
      const row5 = lines[4] ? parseCSVLine(lines[4].replace(/\r$/, '')) : [];

      // G4 = índice 6, I4 = índice 8, G5 = índice 6 da linha 5
      const migradoHoje = parseNum(row4[6]);
      const migradoMes = parseNum(row4[8]);
      const migradosAno = parseNum(row5[6]);

      setData({
        migradoHoje,
        migradoMes,
        migradosAno,
        emMigracao: null,   // a definir
        finalizadas: null,  // a definir
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};
