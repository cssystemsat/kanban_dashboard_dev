import { useEffect, useState } from 'react';
import { cachedFetch } from '@/lib/sheetsCache';

export interface OngoingClientData {
  id: string; // Coluna A - Código Cliente
  codigoCliente: string; // Coluna A - para matching com gráficos
  nome: string; // Coluna B - Nome
  csm: string; // Coluna C - CSM
  placas: number; // Coluna G - Placas
  ultimoBoleto: number; // Coluna F - Último Boleto
  valorMedioPorPlaca: number; // Coluna H - Valor Médio por Placa
  percentualDesatualizado: number; // Coluna I - % Base Desatualizada
  unidadesDesatualizadas: number; // Coluna J - Unidades Desatualizadas
  ultimoContato: string; // Coluna L - Último Contato
  flag: string; // Coluna O — 'Red Flag' | 'Yellow Flag' | 'Black Flag' | ''
  estrela: boolean; // Coluna Q — checkbox
  situacao: string; // Coluna V - Situação
  comercial: string; // Coluna X - Comercial
  decisor: string; // Coluna AE - Decisor
  contatoDecissor: string; // Coluna AF - Contato do Decisor
  deltaConsumo: number; // Coluna BK (36) - Delta Consumo
  entrada: string; // Coluna D - Data de Entrada
  cidade: string; // Coluna AI - Cidade
  estado: string; // Coluna AJ - Estado
}

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC/pub?gid=1152476970&single=true&output=csv';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote dentro de aspas
        current += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Vírgula fora de aspas = separador de coluna
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Adicionar último valor
  result.push(current.trim());
  return result;
}

export function useOngoingData() {
  const [data, setData] = useState<OngoingClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await cachedFetch(SHEET_URL);
        const csvText = await response.text();
        const lines = csvText.split('\n');

        const clients: OngoingClientData[] = [];

        // Pular header (primeira linha)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          try {
            const row = parseCSVLine(line);

            // Mapeamento de colunas (0-indexed)
            const codigoCliente = String(row[0] || '').trim(); // Coluna A (0)
            const nome = String(row[1] || '').trim(); // Coluna B (1)

            // Pular linhas sem nome
            if (!nome) continue;
            const csm = String(row[2] || '').trim(); // Coluna C (2)
            const entrada = String(row[3] || '').trim(); // Coluna D (3) - Data de Entrada
            
            // Extrair valor numérico do formato "R$ XXXX,XX"
            const extractNumber = (str: string): number => {
              if (!str) return 0;
              // Remove aspas se existirem
              const unquoted = str.replace(/^"|"$/g, '');
              // Remove "R$" e espaços
              const cleaned = unquoted.replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.');
              return parseFloat(cleaned) || 0;
            };

            const ultimoBoleto = extractNumber(row[5] || ''); // Coluna F (5)
            const placas = parseInt(row[6] || '0'); // Coluna G (6)
            const valorMedioPorPlaca = extractNumber(row[7] || ''); // Coluna H (7)
            const percentualDesatualizado = parseFloat((row[8] || '0').replace('%', '')) || 0; // Coluna I (8)
            const unidadesDesatualizadas = parseInt(row[9] || '0'); // Coluna J (9)
            const ultimoContato = String(row[11] || '').trim(); // Coluna L (11)
            const flag = String(row[14] || '').trim(); // Coluna O (14) — texto do nível de flag
            const estrelaStr = String(row[16] || '').trim().toUpperCase(); // Coluna Q (16)
            const estrela = estrelaStr === 'TRUE';
            const situacao = String(row[21] || '').trim(); // Coluna V (21)
            const comercial = String(row[23] || '').trim(); // Coluna X (23)
            const decisor = String(row[30] || '').trim(); // Coluna AE (30)
            const contatoDecissor = String(row[31] || '').trim(); // Coluna AF (31) - Contato do Decisor
            const deltaConsumo = extractNumber(row[36] || ''); // Coluna BK (36) - Delta Consumo
            const cidade = String(row[34] || '').trim(); // Coluna AI (34) - Cidade
            const estado = String(row[35] || '').trim(); // Coluna AJ (35) - Estado

            // Excluir apenas clientes com situação 'Churn'
            if (situacao === 'Churn') continue;

            if (nome) {
              clients.push({
                id: codigoCliente,
                codigoCliente,
                nome,
                csm,
                entrada,
                placas,
                ultimoBoleto,
                valorMedioPorPlaca,
                percentualDesatualizado,
                unidadesDesatualizadas,
                ultimoContato,
                flag,
                estrela,
                situacao,
                comercial,
                decisor,
                contatoDecissor,
                deltaConsumo,
                cidade,
                estado,
              });
            }
          } catch (err) {
            console.error('Erro ao processar linha:', line, err);
          }
        }

        // Ordenar por nome (A-Z)
        clients.sort((a, b) => a.nome.localeCompare(b.nome));

        setData(clients);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao buscar dados');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}
