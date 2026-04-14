import { useEffect, useState } from 'react';

interface ClienteEstado {
  nome: string;
  estado?: string;
  faturamento?: string;
  atendente?: string;
  comercial?: string;
}

interface EstadosData {
  onboarding: ClienteEstado[];
  ongoing: ClienteEstado[];
  geral: ClienteEstado[];
  loading: boolean;
  error: string | null;
}

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

export function useEstadosData(): EstadosData {
  const [data, setData] = useState<EstadosData>({
    onboarding: [],
    ongoing: [],
    geral: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Onboarding (gid=0)
        const onboardingUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC/pub?gid=0&single=true&output=csv`;
        const onboardingRes = await fetch(onboardingUrl);
        const onboardingCsv = await onboardingRes.text();

        // Ongoing (gid=1152476970)
        const ongoingUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC/pub?gid=1152476970&single=true&output=csv`;
        const ongoingRes = await fetch(ongoingUrl);
        const ongoingCsv = await ongoingRes.text();

        // Processar Onboarding
        // Col B (idx 1) = Nome, Col F (idx 5) = Faturamento, Col C (idx 2) = Atendente, Col AJ (idx 35) = Estado, Col X (idx 23) = Comercial
        const onboardingClientes: ClienteEstado[] = [];
        const onboardingLines = onboardingCsv.split('\n');
        for (let i = 1; i < onboardingLines.length; i++) {
          const line = onboardingLines[i].trim();
          if (!line) continue;
          const row = parseCSVLine(line);
          const nome = row[1]?.trim() || '';
          const estado = row[35]?.trim() || '';
          const faturamento = row[5]?.trim() || '—';
          const atendente = row[2]?.trim() || '—';
          const comercial = row[23]?.trim() || '—';

          if (nome && estado) {
            onboardingClientes.push({ nome, estado, faturamento, atendente, comercial });
          }
        }

        // Processar Ongoing
        // Col B (idx 1) = Nome, Col F (idx 5) = Faturamento, Col C (idx 2) = Atendente, Col AJ (idx 35) = Estado, Col V (idx 21) = Churn, Col X (idx 23) = Comercial
        const ongoingClientes: ClienteEstado[] = [];
        const ongoingLines = ongoingCsv.split('\n');
        for (let i = 1; i < ongoingLines.length; i++) {
          const line = ongoingLines[i].trim();
          if (!line) continue;
          const row = parseCSVLine(line);
          const churn = row[21]?.trim() || '';
          if (churn.toLowerCase() === 'churn') continue; // Excluir Churn

          const nome = row[1]?.trim() || '';
          const estado = row[35]?.trim() || '';
          const faturamento = row[5]?.trim() || '—';
          const atendente = row[2]?.trim() || '—';
          const comercial = row[23]?.trim() || '—';

          if (nome && estado) {
            ongoingClientes.push({ nome, estado, faturamento, atendente, comercial });
          }
        }

        // Geral = Onboarding + Ongoing
        const geralClientes = [...onboardingClientes, ...ongoingClientes];

        setData({
          onboarding: onboardingClientes,
          ongoing: ongoingClientes,
          geral: geralClientes,
          loading: false,
          error: null,
        });
      } catch (err) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Erro ao buscar dados',
        }));
      }
    };

    fetchData();
  }, []);

  return data;
}
