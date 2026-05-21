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
  changedToday?: boolean; // true se o cliente teve variação hoje
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

/**
 * Verifica se uma data no formato dd/mm/aaaa pertence ao mês/ano atual
 */
function isDateInCurrentMonth(dateStr: string, currentMonth: number, currentYear: number): boolean {
  if (!dateStr) return false;
  const trimmed = dateStr.trim();
  
  // Formato dd/mm/aaaa
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return (month - 1 === currentMonth && year === currentYear);
    }
  }
  return false;
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
      // X (23) = data (yyyy-mm-dd) para evolução geral
      // Y (24) = quantidade de placa (evolução geral)
      // AA (26) = nome do cliente (piores/melhores)
      // AD (29) = delta do mês (já calculado)
      // AE (30) = percentual (já calculado, negativo para piores)
      // AP (41) = cliente (equipamentos)
      // AQ (42) = modelo (equipamentos)
      // AU (46) = data do equipamento (dd/mm/aaaa)

      const now = new Date();
      const currentMonth = now.getMonth(); // 0-indexed
      const currentYear = now.getFullYear();

      // Dados para evolução (últimos 30 dias)
      const evolutionMap = new Map<string, number>();

      // Dados para piores/melhores clientes (colunas AA, AD, AE)
      const clientDeltaSet = new Map<string, { delta: number; deltaPercent: number }>(); 
      
      // Rastrear clientes que variaram hoje
      const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
      const clientsChangedToday = new Set<string>();

      // Dados para equipamentos (filtrado por mês usando coluna AU)
      const cameraMap = new Map<string, number>();
      const tagMap = new Map<string, number>();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Pular linha 1 (vazia) e linha 2 (cabeçalho)
        if (i <= 2) continue;

        const parts = parseCSVLine(line);

        // --- Evolução geral (colunas X=23 e Y=24) ---
        const dateStr = parts[23]?.trim() || '';
        const quantityStr = parts[24]?.trim() || '';

        if (dateStr && quantityStr) {
          const quantity = parseInt(quantityStr.replace(/\./g, '').replace(/,/g, ''), 10);
          if (!isNaN(quantity) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            evolutionMap.set(dateStr, quantity);
          }
        }

        // --- Piores/Melhores clientes (colunas AA=26, AD=29, AE=30, AF=31) ---
        const clientNameAA = parts[26]?.trim() || '';
        const deltaStr = parts[29]?.trim() || '';
        const deltaPercentStr = parts[30]?.trim() || '';
        const lastChangeStr = parts[31]?.trim() || ''; // AF - data da última variação (DD/MM/YYYY)

        if (clientNameAA && deltaStr) {
          const delta = parseFloat(deltaStr.replace(/\./g, '').replace(',', '.'));
          const deltaPercent = deltaPercentStr
            ? parseFloat(deltaPercentStr.replace(/\./g, '').replace(',', '.').replace('%', ''))
            : 0;

          if (!isNaN(delta) && delta !== 0 && !clientDeltaSet.has(clientNameAA)) {
            clientDeltaSet.set(clientNameAA, { delta, deltaPercent: isNaN(deltaPercent) ? 0 : deltaPercent });
          }
          
          // Rastrear se o cliente variou hoje (verificar data em AF - DD/MM/YYYY)
          if (lastChangeStr && clientNameAA) {
            // Converter DD/MM/YYYY para YYYY-MM-DD
            const dateParts = lastChangeStr.split('/');
            if (dateParts.length === 3) {
              const day = dateParts[0];
              const month = dateParts[1];
              const year = dateParts[2];
              const lastChangeDateStr = `${year}-${month}-${day}`;
              
              if (lastChangeDateStr === today) {
                clientsChangedToday.add(clientNameAA);
              }
            }
          }
        }

        // --- Equipamentos (colunas AP=41, AQ=42, AU=46) ---
        const equipClient = parts[41]?.trim() || '';
        const equipModel = parts[42]?.trim() || '';
        const equipDate = parts[46]?.trim() || ''; // coluna AU - dd/mm/aaaa

        if (equipClient && equipModel) {
          // Filtrar apenas equipamentos do mês atual usando coluna AU
          if (isDateInCurrentMonth(equipDate, currentMonth, currentYear)) {
            if (isTag(equipModel)) {
              tagMap.set(equipClient, (tagMap.get(equipClient) || 0) + 1);
            } else {
              cameraMap.set(equipClient, (cameraMap.get(equipClient) || 0) + 1);
            }
          }
        }
      }

      // Processar evolução (últimos 30 dias)
      const allDates = Array.from(evolutionMap.entries())
        .map(([date, quantity]) => ({ date, quantity }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const evolution = allDates.slice(-30);

      // Processar piores e melhores clientes (dados já prontos das colunas AA, AD, AE)
      const allDeltas: ClientDelta[] = [];
      clientDeltaSet.forEach(({ delta, deltaPercent }, clientName) => {
        allDeltas.push({ 
          clientName, 
          delta: Math.round(delta), 
          deltaPercent,
          changedToday: clientsChangedToday.has(clientName)
        });
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
