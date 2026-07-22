import { useState, useCallback } from 'react';
import { cachedFetch } from '@/lib/sheetsCache';

export interface MigracaoCard {
  id: string;
  empresa: string;
  dataInicio: string;
  dataFim: string | null;
  duracao: number | null;
  responsavel: string;
  status: string;
  levantamentoDados: string;
  envioDados: string;
  situacao: string;
  tipo: string; // "Ongoing" ou "Onboarding"
  migrados: number;
  total: number;
  percentual: number;
  plataforma: string;
}

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/export?format=csv&gid=146618493';

function parseNum(val: string | undefined): number {
  if (!val || val.trim() === '') return 0;
  const cleaned = val.trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);

  return result.map(v => {
    const trimmed = v.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  });
}

export const useMigracaoListData = () => {
  const [data, setData] = useState<MigracaoCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cachedFetch(SHEET_URL);
      if (!response.ok) throw new Error('Erro ao buscar dados de migração');

      const csv = await response.text();
      const lines = csv.split('\n').filter(line => line.trim());

      // Skip header (linha 0)
      const migrações: MigracaoCard[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i].replace(/\r$/, ''));
        if (row.length < 27) continue; // Verificar se tem colunas suficientes

        // Mapeamento de colunas (0-indexed):
        // B (1) = Data de início
        // C (2) = Data de fim
        // D (3) = Duração em dias
        // E (4) = Cliente
        // F (5) = Responsável
        // H (7) = Status
        // L (11) = Levantamento de dados
        // P (15) = Envio de comandos
        // T (19) = Situação atual
        // V (21) = Tipo (Ongoing/Onboarding)
        // W (22) = Migrados
        // X (23) = Total
        // Y (24) = % Concluído
        // Z (25) = Plataforma

        const empresa = row[4] || 'Sem nome';
        const dataInicio = row[1] || '';
        const dataFim = row[2] || null;
        const duracao = parseNum(row[3]);
        const responsavel = row[5] || '';
        const status = row[7] || '';
        const levantamentoDados = row[11] || '';
        const envioDados = row[15] || '';
        const situacao = row[19] || '';
        const tipo = row[21] || '';
        const migrados = parseNum(row[22]);
        const total = parseNum(row[23]);
        const percentualStr = row[24] || '0%';
        const percentual = parseNum(percentualStr.replace('%', ''));
        const plataforma = row[25] || '';

        migrações.push({
          id: `${empresa}-${dataInicio}`,
          empresa,
          dataInicio,
          dataFim: dataFim || null,
          duracao: duracao > 0 ? duracao : null,
          responsavel,
          status,
          levantamentoDados,
          envioDados,
          situacao,
          tipo,
          migrados,
          total,
          percentual,
          plataforma,
        });
      }

      setData(migrações);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};
