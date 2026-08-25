import { useState, useCallback } from 'react';
import { cachedFetch } from '@/lib/sheetsCache';

export interface Atendimento {
  id: string;
  dia: string;
  cliente: string;
  origem: string;
  tipo: string;
  detalhes: string;
  tempo: number; // em minutos
  assunto: string;
  atendente: string;
}

export interface AtendimentosStats {
  totalAtendimentos: number;
  tempoTotalMinutos: number;
  tempoMedioMinutos: number;
  clientesMaisAtendidos: Array<{ cliente: string; count: number }>;
  assuntosMaisFalados: Array<{ assunto: string; count: number }>;
  origemMaisComum: Array<{ origem: string; count: number }>;
  tipoMaisComum: Array<{ tipo: string; count: number }>;
  atendentesComMaisAtendimentos: Array<{ atendente: string; count: number }>;
}

const SPREADSHEET_ID = '1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc';
const GID = '1655169262';

export function useAtendimentosData() {
  const [data, setData] = useState<Atendimento[]>([]);
  const [stats, setStats] = useState<AtendimentosStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
      const response = await cachedFetch(url);
      const csv = await response.text();

      const lines = csv.split('\n').filter(line => line.trim());
      const atendimentos: Atendimento[] = [];

      // Pular header (linha 0) e sub-header (linha 1)
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = parseCSVLine(line);
        if (values.length < 9) continue;

        const dia = values[0]?.trim() || '';
        const cliente = values[1]?.trim() || '';
        const origem = values[2]?.trim() || '';
        const tipo = values[3]?.trim() || '';
        const detalhes = values[4]?.trim() || '';
        const tempoStr = values[5]?.trim() || '0';
        const assunto = values[6]?.trim() || '';
        const atendente = values[8]?.trim() || '';

        // Converter tempo para minutos (já deve estar em minutos)
        let tempo = 0;
        try {
          tempo = parseInt(tempoStr) || 0;
        } catch {
          tempo = 0;
        }

        if (cliente && atendente) {
          atendimentos.push({
            id: `${i}-${cliente}`,
            dia,
            cliente,
            origem,
            tipo,
            detalhes,
            tempo,
            assunto,
            atendente,
          });
        }
      }

      setData(atendimentos);
      calculateStats(atendimentos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStats = (atendimentos: Atendimento[]) => {
    if (atendimentos.length === 0) {
      setStats(null);
      return;
    }

    const totalAtendimentos = atendimentos.length;
    const tempoTotalMinutos = atendimentos.reduce((sum, a) => sum + a.tempo, 0);
    const tempoMedioMinutos = Math.round(tempoTotalMinutos / totalAtendimentos);

    // Clientes mais atendidos
    const clienteCount: Record<string, number> = {};
    atendimentos.forEach(a => {
      clienteCount[a.cliente] = (clienteCount[a.cliente] || 0) + 1;
    });
    const clientesMaisAtendidos = Object.entries(clienteCount)
      .map(([cliente, count]) => ({ cliente, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Assuntos mais falados
    const assuntoCount: Record<string, number> = {};
    atendimentos.forEach(a => {
      if (a.assunto) {
        assuntoCount[a.assunto] = (assuntoCount[a.assunto] || 0) + 1;
      }
    });
    const assuntosMaisFalados = Object.entries(assuntoCount)
      .map(([assunto, count]) => ({ assunto, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Origem mais comum
    const origemCount: Record<string, number> = {};
    atendimentos.forEach(a => {
      if (a.origem) {
        origemCount[a.origem] = (origemCount[a.origem] || 0) + 1;
      }
    });
    const origemMaisComum = Object.entries(origemCount)
      .map(([origem, count]) => ({ origem, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Tipo mais comum
    const tipoCount: Record<string, number> = {};
    atendimentos.forEach(a => {
      if (a.tipo) {
        tipoCount[a.tipo] = (tipoCount[a.tipo] || 0) + 1;
      }
    });
    const tipoMaisComum = Object.entries(tipoCount)
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Atendentes com mais atendimentos
    const atendenteCount: Record<string, number> = {};
    atendimentos.forEach(a => {
      atendenteCount[a.atendente] = (atendenteCount[a.atendente] || 0) + 1;
    });
    const atendentesComMaisAtendimentos = Object.entries(atendenteCount)
      .map(([atendente, count]) => ({ atendente, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      totalAtendimentos,
      tempoTotalMinutos,
      tempoMedioMinutos,
      clientesMaisAtendidos,
      assuntosMaisFalados,
      origemMaisComum,
      tipoMaisComum,
      atendentesComMaisAtendimentos,
    });
  };

  return { data, stats, loading, error, fetchData };
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
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
