import { useState, useCallback } from 'react';

export interface ChurnData {
  id: string;
  nome: string;
  tipo: string;
  dataEntrada: string;
  dataSaida: string;
  dataSaidaParsed: Date | null; // Data de cancelamento parseada
  mesesCasa: number;
  persona: string;
  atendente: string;
  vendedor: string;
  farm: string;
  motivoCancelamento: string;
  motivoDeclarado: string;   // Coluna P - Motivo declarado pelo cliente
  analiseInterna: string;    // Coluna Q - Análise interna do caso
}

export const useChurnsData = () => {
  const [data, setData] = useState<ChurnData[]>([]);
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
      const response = await fetch(
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

      const header = lines[0].split(',');
      
      // Mapeamento de colunas conforme informado
      const nomeIdx = 0; // Coluna A
      const tipoIdx = 1; // Coluna B
      const dataEntradaIdx = 6; // Coluna G
      const dataSaidaIdx = 7; // Coluna H
      const mesesCasaIdx = 8; // Coluna I
      const personaIdx = 10; // Coluna K
      const atendenteIdx = 11; // Coluna L
      const vendedorIdx = 12; // Coluna M
      const farmIdx = 13; // Coluna N
      const motivoIdx = 14;          // Coluna O
      const motivoDeclaradoIdx = 15;  // Coluna P - Motivo declarado pelo cliente
      const analiseInternaIdx = 16;   // Coluna Q - Análise interna

      const churns: ChurnData[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = parseCSVLine(line);
        
        if (row.length <= nomeIdx) continue;

        const nome = row[nomeIdx]?.trim() || '';
        if (!nome) continue;

        const mesesCasaStr = row[mesesCasaIdx]?.trim() || '0';
        const mesesCasa = parseInt(mesesCasaStr, 10) || 0;

        const dataSaidaStr = row[dataSaidaIdx]?.trim() || '';
        const dataSaidaParsed = parseDate(dataSaidaStr);

        churns.push({
          id: `${nome}-${i}`,
          nome,
          tipo: row[tipoIdx]?.trim() || '',
          dataEntrada: row[dataEntradaIdx]?.trim() || '',
          dataSaida: dataSaidaStr,
          dataSaidaParsed,
          mesesCasa,
          persona: row[personaIdx]?.trim() || '',
          atendente: row[atendenteIdx]?.trim() || '',
          vendedor: row[vendedorIdx]?.trim() || '',
          farm: row[farmIdx]?.trim() || '',
          motivoCancelamento: row[motivoIdx]?.trim() || '',
          motivoDeclarado: row[motivoDeclaradoIdx]?.trim() || '',
          analiseInterna: row[analiseInternaIdx]?.trim() || ''
        });
      }

      setData(churns);
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
