import { useEffect, useState } from 'react';

export interface AgendaEntry {
  data: string;       // Coluna A — DD/MM/AAAA
  cliente: string;    // Coluna B — nome do cliente
  status: string;     // Coluna C — status operacional (texto livre)
  timestamp: number;  // Para ordenação
}

// Cache global em memória (compartilhado entre instâncias do hook)
let globalCache: Map<string, AgendaEntry> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC/pub?gid=1655169262&single=true&output=csv';

function parseDate(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return 0;
  const [day, month, year] = parts;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

async function loadAgendaCache(): Promise<Map<string, AgendaEntry>> {
  const response = await fetch(SHEET_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const csv = await response.text();
  const lines = csv.split('\n');

  // Mapa: nome_cliente → entrada mais recente (último registro em caso de empate de data)
  const map = new Map<string, AgendaEntry>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    const data = cols[0]?.trim() || '';
    const cliente = cols[1]?.trim() || '';
    // Coluna C pode conter vírgulas se estiver entre aspas — juntar o restante
    const statusRaw = cols.slice(2).join(',').trim().replace(/^"|"$/g, '');

    if (!data || !cliente || !statusRaw) continue;

    const timestamp = parseDate(data);
    if (timestamp === 0) continue;

    const existing = map.get(cliente);
    // Substitui se: data mais recente OU mesma data (pega o último que aparece)
    if (!existing || timestamp >= existing.timestamp) {
      map.set(cliente, { data, cliente, status: statusRaw, timestamp });
    }
  }

  return map;
}

const OUTDATED_THRESHOLD_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calcula quantos dias se passaram desde a última atualização.
 * Retorna null se não houver registro.
 */
export function getDaysSinceUpdate(entry: AgendaEntry | null): number | null {
  if (!entry || entry.timestamp === 0) return null;
  return Math.floor((Date.now() - entry.timestamp) / MS_PER_DAY);
}

/**
 * Retorna true se o cliente não tem atualização há mais de 30 dias
 * OU se não tem nenhum registro na aba Agendas.
 */
export function isAgendaOutdated(entry: AgendaEntry | null, loading: boolean): boolean {
  if (loading) return false;
  if (!entry) return true; // sem registro = sem atualização
  const days = getDaysSinceUpdate(entry);
  return days !== null && days > OUTDATED_THRESHOLD_DAYS;
}

/**
 * Retorna a última entrada operacional de um cliente específico da aba Agendas.
 * O match é feito pelo nome do cliente (Coluna B da aba Agendas = Coluna B da planilha Marcos).
 */
export function useAgendaData(nomeCliente?: string) {
  const [entry, setEntry] = useState<AgendaEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!nomeCliente) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Usar cache em memória se ainda válido
        if (globalCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
          setEntry(globalCache.get(nomeCliente) ?? null);
          setLoading(false);
          return;
        }

        const map = await loadAgendaCache();
        globalCache = map;
        cacheTimestamp = Date.now();

        setEntry(map.get(nomeCliente) ?? null);
      } catch (error) {
        console.error('[useAgendaData] Erro ao carregar aba Agendas:', error);
        setEntry(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [nomeCliente]);

  return { entry, loading };
}
