import { useState, useCallback } from 'react';
import { cachedFetch } from '@/lib/sheetsCache';

export interface ChurnByCsmData {
  csm: string;
  count: number;
  percentage: number;
  empresas: string[];
}

export const useChurnsByCsmData = () => {
  const [data, setData] = useState<ChurnByCsmData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.trim() === '') return null;
    
    // Tenta formato DD/MM/YYYY
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month - 1, day);
    }
    return null;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // URL da aba CHURNS com gid=1060737054
      const response = await cachedFetch(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC/pub?gid=1060737054&output=csv'
      );
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados da aba CHURNS');
      }

      const csv = await response.text();
      const lines = csv.split('\n');
      
      if (lines.length < 2) {
        throw new Error('Aba CHURNS vazia ou inválida');
      }

      // Mapeamento de colunas
      const nomeIdx = 0;      // Coluna A - Nome da empresa
      const atendenteIdx = 11; // Coluna L - Atendente (CSM)
      const dataSaidaIdx = 7;  // Coluna H - Data de saída

      const csmMap: { [key: string]: { count: number; empresas: string[] } } = {};
      let totalChurans = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = parseCSVLine(line);
        
        if (row.length <= nomeIdx) continue;

        const nome = row[nomeIdx]?.trim() || '';
        if (!nome) continue;

        const dataSaidaStr = row[dataSaidaIdx]?.trim() || '';
        const dataSaidaParsed = parseDate(dataSaidaStr);
        
        // Incluir apenas churns com data válida
        if (!dataSaidaParsed) continue;

        const atendente = row[atendenteIdx]?.trim() || 'Sem CSM';

        if (!csmMap[atendente]) {
          csmMap[atendente] = { count: 0, empresas: [] };
        }
        csmMap[atendente].count++;
        csmMap[atendente].empresas.push(nome);
        totalChurans++;
      }

      // Converter para array e calcular percentuais
      const result: ChurnByCsmData[] = Object.entries(csmMap)
        .map(([csm, data]) => ({
          csm,
          count: data.count,
          percentage: totalChurans > 0 ? Math.round((data.count / totalChurans) * 100) : 0,
          empresas: data.empresas.sort()
        }))
        .sort((a, b) => b.count - a.count);

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};

// Helper para fazer parse correto de CSV com campos entre aspas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
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
  return result;
}
