import { useState, useCallback } from 'react';

// URLs das planilhas
const MARCOS_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC/pub?output=csv';

const ONGOING_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC/pub?gid=1152476970&single=true&output=csv';

export type FlagTipo = 'Red Flag' | 'Yellow Flag' | 'Black Flag' | '';

export interface ClienteContato {
  nome: string;
  flag: FlagTipo;
  ultimoContato: string;
}

export interface CoberturaCSM {
  csm: string;
  contatosSemana: number;
  totalClientes: number;
  percentual: number;
  bateuMeta: boolean;
  clientesContatados: ClienteContato[]; // lista para tooltip
}

export interface PainelData {
  onboarding: CoberturaCSM[];
  ongoing: CoberturaCSM[];
  totalOnboarding: { contatos: number; total: number; percentual: number; bateuMeta: boolean };
  totalOngoing: { contatos: number; total: number; percentual: number; bateuMeta: boolean };
  totalGeral: { contatos: number; total: number; percentual: number; bateuMeta: boolean };
  semanaAtual: { inicio: string; fim: string };
}

const META_SEMANAL = 0.25; // 25%

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
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month - 1, day);
    }
  }
  return null;
}

function getSemanaAtual(): { inicio: Date; fim: Date } {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diaSemana = hoje.getDay();
  const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + diffParaSegunda);
  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  return { inicio: segunda, fim: domingo };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function normalizeFlag(raw: string): FlagTipo {
  const v = raw.trim();
  if (v === 'Red Flag') return 'Red Flag';
  if (v === 'Yellow Flag') return 'Yellow Flag';
  if (v === 'Black Flag') return 'Black Flag';
  return '';
}

function calcularCobertura(
  rows: { nome: string; csm: string; ultimoContato: string; flag: FlagTipo }[],
  semana: { inicio: Date; fim: Date }
): CoberturaCSM[] {
  const mapa: Record<string, {
    contatos: number;
    total: number;
    clientesContatados: ClienteContato[];
  }> = {};

  for (const row of rows) {
    const csm = row.csm.trim();
    if (!csm) continue;

    if (!mapa[csm]) mapa[csm] = { contatos: 0, total: 0, clientesContatados: [] };
    mapa[csm].total++;

    const data = parseDate(row.ultimoContato);
    if (data && data >= semana.inicio && data <= semana.fim) {
      mapa[csm].contatos++;
      mapa[csm].clientesContatados.push({
        nome: row.nome,
        flag: row.flag,
        ultimoContato: row.ultimoContato,
      });
    }
  }

  return Object.entries(mapa)
    .map(([csm, { contatos, total, clientesContatados }]) => {
      const percentual = total > 0 ? contatos / total : 0;
      // Ordenar: flags primeiro (Red > Yellow > Black > sem flag), depois nome
      const flagOrder: Record<FlagTipo, number> = { 'Red Flag': 0, 'Yellow Flag': 1, 'Black Flag': 2, '': 3 };
      clientesContatados.sort((a, b) => {
        const fo = flagOrder[a.flag] - flagOrder[b.flag];
        if (fo !== 0) return fo;
        return a.nome.localeCompare(b.nome);
      });
      return {
        csm,
        contatosSemana: contatos,
        totalClientes: total,
        percentual,
        bateuMeta: percentual >= META_SEMANAL,
        clientesContatados,
      };
    })
    .sort((a, b) => a.csm.localeCompare(b.csm));
}

function somarTotal(lista: CoberturaCSM[]): { contatos: number; total: number; percentual: number; bateuMeta: boolean } {
  const contatos = lista.reduce((s, c) => s + c.contatosSemana, 0);
  const total = lista.reduce((s, c) => s + c.totalClientes, 0);
  const percentual = total > 0 ? contatos / total : 0;
  return { contatos, total, percentual, bateuMeta: percentual >= META_SEMANAL };
}

export function usePainelData() {
  const [data, setData] = useState<PainelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const semana = getSemanaAtual();

      const [marcosRes, ongoingRes] = await Promise.all([
        fetch(MARCOS_URL),
        fetch(ONGOING_URL),
      ]);

      if (!marcosRes.ok || !ongoingRes.ok) {
        throw new Error('Erro ao buscar planilhas');
      }

      const [marcosCsv, ongoingCsv] = await Promise.all([
        marcosRes.text(),
        ongoingRes.text(),
      ]);

      // Processar Marcos (Onboarding)
      // Col B (idx 1) = Nome, Col C (idx 2) = CSM, Col L (idx 11) = Último Contato, Col O (idx 14) = Flag
      const marcosRows: { nome: string; csm: string; ultimoContato: string; flag: FlagTipo }[] = [];
      const marcosLines = marcosCsv.split('\n');
      for (let i = 1; i < marcosLines.length; i++) {
        const line = marcosLines[i].trim();
        if (!line) continue;
        const row = parseCSVLine(line);
        const nome = row[1]?.trim() || '';
        if (!nome) continue;
        const csm = row[2]?.trim() || '';
        const ultimoContato = row[11]?.trim() || '';
        const flag = normalizeFlag(row[14] || '');
        if (csm) marcosRows.push({ nome, csm, ultimoContato, flag });
      }

      // Processar Ongoing
      // Col A (idx 0) = Código, Col B (idx 1) = Nome, Col C (idx 2) = CSM, Col L (idx 11) = Último Contato, Col O (idx 14) = Flag
      const ongoingRows: { nome: string; csm: string; ultimoContato: string; flag: FlagTipo }[] = [];
      const ongoingLines = ongoingCsv.split('\n');
      for (let i = 1; i < ongoingLines.length; i++) {
        const line = ongoingLines[i].trim();
        if (!line) continue;
        const row = parseCSVLine(line);
        const codigoCliente = row[0]?.trim() || '';
        if (!codigoCliente) continue;
        const nome = row[1]?.trim() || '';
        const csm = row[2]?.trim() || '';
        const ultimoContato = row[11]?.trim() || '';
        const flag = normalizeFlag(row[14] || '');
        if (csm) ongoingRows.push({ nome, csm, ultimoContato, flag });
      }

      const onboarding = calcularCobertura(marcosRows, semana);
      const ongoing = calcularCobertura(ongoingRows, semana);

      const totalOnboarding = somarTotal(onboarding);
      const totalOngoing = somarTotal(ongoing);
      const totalGeral = {
        contatos: totalOnboarding.contatos + totalOngoing.contatos,
        total: totalOnboarding.total + totalOngoing.total,
        percentual: 0,
        bateuMeta: false,
      };
      totalGeral.percentual = totalGeral.total > 0 ? totalGeral.contatos / totalGeral.total : 0;
      totalGeral.bateuMeta = totalGeral.percentual >= META_SEMANAL;

      setData({
        onboarding,
        ongoing,
        totalOnboarding,
        totalOngoing,
        totalGeral,
        semanaAtual: {
          inicio: formatDate(semana.inicio),
          fim: formatDate(semana.fim),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
}
