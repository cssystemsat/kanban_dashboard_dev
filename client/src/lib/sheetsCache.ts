/**
 * Cache centralizado para chamadas ao Google Sheets.
 * Evita rate limit "Too many requests" mantendo respostas em memória
 * por um período configurável (padrão: 5 minutos).
 */

interface CacheEntry {
  data: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const pendingRequests = new Map<string, Promise<string>>();

/**
 * Fetch com cache para URLs do Google Sheets.
 * Se a mesma URL já foi buscada nos últimos 5 minutos, retorna do cache.
 * Se há uma requisição pendente para a mesma URL, aguarda a mesma promise.
 */
export async function cachedFetch(url: string, _options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const cached = cache.get(url);

  // Retornar do cache se ainda válido
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return new Response(cached.data, { status: 200, statusText: 'OK' });
  }

  // Se já há uma requisição pendente para esta URL, aguardar
  const pending = pendingRequests.get(url);
  if (pending) {
    const data = await pending;
    return new Response(data, { status: 200, statusText: 'OK' });
  }

  // Fazer nova requisição
  const fetchPromise = (async () => {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const text = await response.text();

    // Armazenar no cache
    cache.set(url, { data: text, timestamp: Date.now() });

    return text;
  })();

  pendingRequests.set(url, fetchPromise);

  try {
    const data = await fetchPromise;
    return new Response(data, { status: 200, statusText: 'OK' });
  } finally {
    pendingRequests.delete(url);
  }
}

/**
 * Limpar todo o cache (útil para forçar refresh)
 */
export function clearSheetsCache() {
  cache.clear();
}

/**
 * Limpar cache de uma URL específica
 */
export function invalidateCache(url: string) {
  cache.delete(url);
}
