import { useEffect, useState } from 'react';

export interface URsEvolutionData {
  clientName: string;
  date: string;
  quantity: number;
  timestamp: number;
}

export interface ClientURsEvolution {
  clientName: string;
  data: URsEvolutionData[];
}

// Cache em memória (mais rápido que localStorage)
let globalCache: Map<string, URsEvolutionData[]> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

const CACHE_KEY = 'urs_evolution_cache';
const CACHE_TIMESTAMP_KEY = 'urs_evolution_cache_timestamp';

export function useURsEvolution(codigoCliente?: string) {
  const [data, setData] = useState<URsEvolutionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let controller: AbortController | null = null;

    const fetchData = async () => {
      try {
        // Verificar cache em memória primeiro (mais rápido)
        if (globalCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
          if (codigoCliente) {
            const clientData = globalCache.get(codigoCliente);
            setData(clientData || []);
          }
          setLoading(false);
          return;
        }

        // Tentar carregar do localStorage
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (cachedData && cachedTimestamp && Date.now() - parseInt(cachedTimestamp) < CACHE_DURATION) {
          const parsed = JSON.parse(cachedData) as Array<[string, URsEvolutionData[]]>;
          globalCache = new Map(parsed);
          cacheTimestamp = parseInt(cachedTimestamp);
          
          if (codigoCliente) {
            const clientData = globalCache.get(codigoCliente);
            setData(clientData || []);
          }
          setLoading(false);
          return;
        }

        // Fetch do CSV com timeout
        controller = new AbortController();
        timeoutId = setTimeout(() => controller?.abort(), 30000); // 30s timeout

        const response = await fetch(
          'https://docs.google.com/spreadsheets/d/e/2PACX-1vSLsjnFmBMUVU4KF_uCsoRJ9OF0LyEu_ZNxYUClHITba3sfkjyKz-kdSNzQ6CMtdXTiGwkion6m-XJj/pub?gid=1250838098&output=csv',
          { 
            signal: controller?.signal,
            cache: 'force-cache'
          }
        );
        
        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const csv = await response.text();
        const lines = csv.split('\n');
        const clientsMap = new Map<string, URsEvolutionData[]>();

        // Parser otimizado com validação mínima
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Usar regex para parsear CSV corretamente (lida com aspas)
          const parts = parseCSVLine(line);
          if (parts.length < 11) continue;

          const clientName = parts[0]?.trim() || '';
          const quantity = parseInt(parts[4]?.trim() || '0', 10);
          const dateStr = parts[10]?.trim() || '';

          if (!clientName || !dateStr || isNaN(quantity)) continue;

          // Parse da data em formato DD/MM/YYYY
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

        // Ordenar dados por timestamp
        const sortedMap = new Map<string, URsEvolutionData[]>();
        clientsMap.forEach((evolution, clientName) => {
          sortedMap.set(clientName, evolution.sort((a: URsEvolutionData, b: URsEvolutionData) => a.timestamp - b.timestamp));
        });

        // Guardar em cache (memória e localStorage)
        globalCache = sortedMap;
        cacheTimestamp = Date.now();
        
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(sortedMap.entries())));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, cacheTimestamp.toString());
        } catch (e) {
          // localStorage pode estar cheio, ignorar erro
          console.warn('localStorage full, skipping cache');
        }

        if (isMounted && codigoCliente) {
          const clientData = sortedMap.get(codigoCliente);
          setData(clientData || []);
        }
      } catch (error) {
        // Ignorar erros de abort (componente desmontado ou timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Fetch cancelado (timeout ou desmontagem)');
          return;
        }
        console.error('Erro ao carregar dados de evolução de URs:', error);
        if (isMounted) {
          setData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup: cancelar fetch se componente desmontar
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      controller?.abort();
    };
  }, [codigoCliente]);

  return { data, loading };
}


// Parser CSV otimizado que lida com aspas
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
        i++; // Skip next quote
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
