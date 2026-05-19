import { useEffect, useState } from 'react';
import { useURsEvolution, URsEvolutionData } from './useURsEvolution';

export interface URsTrendData {
  clientName: string;
  codigoCliente: string;
  startQuantity: number;
  endQuantity: number;
  trend: number; // positivo = ascendente, negativo = descendente
  percentChange: number; // percentual de mudança
  isAscending: boolean;
  isDeclining: boolean;
  isStable: boolean;
}

export function useURsTrend(
  codigoCliente: string,
  startDate: Date | null,
  endDate: Date | null
) {
  const { data: allData } = useURsEvolution(codigoCliente);
  const [trend, setTrend] = useState<URsTrendData | null>(null);

  useEffect(() => {
    if (!allData || allData.length === 0 || !startDate || !endDate) {
      setTrend(null);
      return;
    }

    // Filtrar dados dentro do período
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const periodData = allData.filter(
      item => item.timestamp >= startTime && item.timestamp <= endTime
    );

    if (periodData.length < 2) {
      setTrend(null);
      return;
    }

    // Ordenar por data
    const sorted = [...periodData].sort((a, b) => a.timestamp - b.timestamp);
    const firstEntry = sorted[0];
    const lastEntry = sorted[sorted.length - 1];

    const startQty = firstEntry.quantity;
    const endQty = lastEntry.quantity;
    const change = endQty - startQty;
    const percentChange = startQty !== 0 ? (change / startQty) * 100 : 0;

    const trendData: URsTrendData = {
      clientName: firstEntry.clientName,
      codigoCliente,
      startQuantity: startQty,
      endQuantity: endQty,
      trend: change,
      percentChange,
      isAscending: change > 0,
      isDeclining: change < 0,
      isStable: change === 0,
    };

    setTrend(trendData);
  }, [allData, startDate, endDate, codigoCliente]);

  return { trend };
}

/**
 * Hook para calcular tendência de múltiplos clientes
 */
export function useMultipleURsTrends(
  clientes: Array<{ codigoCliente: string; nome: string }>,
  startDate: Date | null,
  endDate: Date | null
) {
  const [trends, setTrends] = useState<URsTrendData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate || clientes.length === 0) {
      setTrends([]);
      return;
    }

    setLoading(true);

    // Carregar dados de evolução para todos os clientes
    const fetchAllTrends = async () => {
      try {
        // Usar o cache global do useURsEvolution
        const response = await fetch(
          'https://docs.google.com/spreadsheets/d/e/2PACX-1vSLsjnFmBMUVU4KF_uCsoRJ9OF0LyEu_ZNxYUClHITba3sfkjyKz-kdSNzQ6CMtdXTiGwkion6m-XJj/pub?gid=1250838098&output=csv',
          { redirect: 'follow', cache: 'force-cache' }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const csv = await response.text();
        const lines = csv.split('\n');
        const clientsMap = new Map<string, URsEvolutionData[]>();

        // Parser CSV
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = parseCSVLine(line);
          if (parts.length < 11) continue;

          const clientName = parts[0]?.trim() || '';
          const quantity = parseInt(parts[4]?.trim() || '0', 10);
          const dateStr = parts[10]?.trim() || '';

          if (!clientName || !dateStr || isNaN(quantity)) continue;

          const [day, month, year] = dateStr.split('/');
          if (!day || !month || !year) continue;

          const date = new Date(`${year}-${month}-${day}`);
          if (isNaN(date.getTime())) continue;

          const evolutionData: URsEvolutionData = {
            clientName,
            date: dateStr,
            quantity,
            timestamp: date.getTime(),
          };

          if (!clientsMap.has(clientName)) {
            clientsMap.set(clientName, []);
          }
          clientsMap.get(clientName)!.push(evolutionData);
        }

        // Calcular tendência para cada cliente
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();
        const calculatedTrends: URsTrendData[] = [];

        clientes.forEach(cliente => {
          const clientData = clientsMap.get(cliente.nome);
          if (!clientData || clientData.length < 2) return;

          const sorted = [...clientData].sort((a, b) => a.timestamp - b.timestamp);
          const periodData = sorted.filter(
            item => item.timestamp >= startTime && item.timestamp <= endTime
          );

          if (periodData.length < 2) return;

          const periodSorted = [...periodData].sort((a, b) => a.timestamp - b.timestamp);
          const firstEntry = periodSorted[0];
          const lastEntry = periodSorted[periodSorted.length - 1];

          const startQty = firstEntry.quantity;
          const endQty = lastEntry.quantity;
          const change = endQty - startQty;
          const percentChange = startQty !== 0 ? (change / startQty) * 100 : 0;

          calculatedTrends.push({
            clientName: cliente.nome,
            codigoCliente: cliente.codigoCliente,
            startQuantity: startQty,
            endQuantity: endQty,
            trend: change,
            percentChange,
            isAscending: change > 0,
            isDeclining: change < 0,
            isStable: change === 0,
          });
        });

        setTrends(calculatedTrends);
      } catch (error) {
        console.error('Erro ao calcular tendências de URs:', error);
        setTrends([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTrends();
  }, [clientes, startDate, endDate]);

  return { trends, loading };
}

// Parser CSV otimizado
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
