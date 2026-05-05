import { useEffect, useState, useCallback } from 'react';

// URL da planilha aba D (gid=1250838098)
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSLsjnFmBMUVU4KF_uCsoRJ9OF0LyEu_ZNxYUClHITba3sfkjyKz-kdSNzQ6CMtdXTiGwkion6m-XJj/pub?gid=1250838098&output=csv';

export interface DailyUR {
  date: string; // yyyy-mm-dd
  quantity: number;
}

export interface ClientDelta {
  clientName: string;
  delta: number;
  deltaPercent: number;
}

export interface EquipmentEntry {
  clientName: string;
  model: string;
}

export interface EquipmentCount {
  clientName: string;
  quantity: number;
}

export interface URsDashboardData {
  evolution: DailyUR[]; // últimos 30 dias
  worstClients: ClientDelta[]; // negativos
  bestClients: ClientDelta[]; // positivos
  cameras: EquipmentCount[];
  tags: EquipmentCount[];
}

const TAG_MODELS = ['airtag pb703', 'webtag'];

function isTag(model: string): boolean {
  return TAG_MODELS.includes(model.toLowerCase().trim());
}

// Parser CSV que lida com aspas
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

export function useURsDashboard() {
  const [data, setData] = useState<URsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(CSV_URL, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const csv = await response.text();
      const lines = csv.split('\n');

      // Colunas relevantes (0-indexed):
      // A (0) = nome do cliente
      // E (4) = total (primeiro valor encontrado de cima para baixo por cliente)
      // G (6) = variação no dia
      // X (23) = data (yyyy-mm-dd)
      // Y (24) = quantidade de placa (evolução geral)
      // AP (41) = cliente (equipamentos)
      // AQ (42) = modelo (equipamentos)

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Dados para evolução (últimos 30 dias)
      const evolutionMap = new Map<string, number>();

      // Dados para delta por cliente (mês atual)
      const clientDeltaMap = new Map<string, number>();
      const clientFirstTotal = new Map<string, number>();

      // Dados para equipamentos (mês atual)
      const cameraMap = new Map<string, number>();
      const tagMap = new Map<string, number>();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = parseCSVLine(line);

        // --- Evolução geral (colunas X=23 e Y=24) ---
        const dateStr = parts[23]?.trim() || '';
        const quantityStr = parts[24]?.trim() || '';

        if (dateStr && quantityStr) {
          const quantity = parseInt(quantityStr.replace(/\./g, '').replace(/,/g, ''), 10);
          if (!isNaN(quantity) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Guardar último valor para cada data
            evolutionMap.set(dateStr, quantity);
          }
        }

        // --- Delta por cliente (colunas A=0, E=4, G=6) ---
        const clientName = parts[0]?.trim() || '';
        const totalStr = parts[4]?.trim() || '';
        const variacaoStr = parts[6]?.trim() || '';

        if (clientName && variacaoStr) {
          const variacao = parseInt(variacaoStr.replace(/\./g, '').replace(/,/g, ''), 10);
          if (!isNaN(variacao)) {
            // Verificar se é do mês atual usando coluna K (10) que tem data DD/MM/YYYY
            // Ou simplesmente somar todas as variações (o usuário disse "todas as linhas do mês atual")
            // Vamos usar a data da coluna X para filtrar mês atual
            const rowDate = parts[23]?.trim() || '';
            let isCurrentMonth = false;

            if (rowDate && rowDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [y, m] = rowDate.split('-').map(Number);
              isCurrentMonth = (m - 1 === currentMonth && y === currentYear);
            } else {
              // Se não tem data na coluna X, tentar coluna K (formato DD/MM/YYYY)
              const altDate = parts[10]?.trim() || '';
              if (altDate) {
                const dateParts = altDate.split('/');
                if (dateParts.length === 3) {
                  const [, m, y] = dateParts.map(Number);
                  isCurrentMonth = (m - 1 === currentMonth && y === currentYear);
                }
              }
            }

            if (isCurrentMonth) {
              clientDeltaMap.set(clientName, (clientDeltaMap.get(clientName) || 0) + variacao);
            }
          }
        }

        // Primeiro total encontrado por cliente (coluna E)
        if (clientName && totalStr && !clientFirstTotal.has(clientName)) {
          const total = parseInt(totalStr.replace(/\./g, '').replace(/,/g, ''), 10);
          if (!isNaN(total) && total > 0) {
            clientFirstTotal.set(clientName, total);
          }
        }

        // --- Equipamentos (colunas AP=41 e AQ=42) ---
        const equipClient = parts[41]?.trim() || '';
        const equipModel = parts[42]?.trim() || '';

        if (equipClient && equipModel) {
          if (isTag(equipModel)) {
            tagMap.set(equipClient, (tagMap.get(equipClient) || 0) + 1);
          } else {
            cameraMap.set(equipClient, (cameraMap.get(equipClient) || 0) + 1);
          }
        }
      }

      // Processar evolução (últimos 30 dias)
      const allDates = Array.from(evolutionMap.entries())
        .map(([date, quantity]) => ({ date, quantity }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const evolution = allDates.slice(-30);

      // Processar piores e melhores clientes
      const allDeltas: ClientDelta[] = [];
      clientDeltaMap.forEach((delta, clientName) => {
        const firstTotal = clientFirstTotal.get(clientName) || 1;
        const deltaPercent = (delta / firstTotal) * 100;
        allDeltas.push({ clientName, delta, deltaPercent });
      });

      const worstClients = allDeltas
        .filter(c => c.delta < 0)
        .sort((a, b) => a.delta - b.delta); // mais negativo primeiro

      const bestClients = allDeltas
        .filter(c => c.delta > 0)
        .sort((a, b) => b.delta - a.delta); // mais positivo primeiro

      // Processar equipamentos
      const cameras: EquipmentCount[] = Array.from(cameraMap.entries())
        .map(([clientName, quantity]) => ({ clientName, quantity }))
        .sort((a, b) => b.quantity - a.quantity);

      const tags: EquipmentCount[] = Array.from(tagMap.entries())
        .map(([clientName, quantity]) => ({ clientName, quantity }))
        .sort((a, b) => b.quantity - a.quantity);

      setData({ evolution, worstClients, bestClients, cameras, tags });
    } catch (err) {
      console.error('Erro ao carregar dados de URs Dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, fetchData };
}
