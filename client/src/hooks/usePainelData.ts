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
  faturamento: string; // coluna F
  cidade: string; // coluna AI
  estado: string; // coluna AJ
}

export interface CoberturaCSM {
  csm: string;
  contatosSemana: number;
  totalClientes: number;
  percentual: number;
  bateuMeta: boolean;
  clientesContatados: ClienteContato[]; // lista para tooltip da semana
  clientesSemContato: ClienteContato[]; // lista de clientes SEM contato na semana
  acumuladoMes: number; // clientes únicos contatados no mês atual
}

export interface MarcoStats {
  marco: number;
  quantidade: number;
  percentual: number; // % do total de clientes
}

export interface ClienteMarcoDetalhado {
  nome: string;
  csm: string;
  marco: number;
  ultimoBoleto: number;
  quantidadeURs: number;
  flag: FlagTipo;
  ultimoContato: string;
  faturamento: string;
  cidade: string;
  estado: string;
}

export interface PainelData {
  onboarding: CoberturaCSM[];
  ongoing: CoberturaCSM[];
  totalOnboarding: { contatos: number; total: number; percentual: number; bateuMeta: boolean; acumuladoMes: number };
  totalOngoing: { contatos: number; total: number; percentual: number; bateuMeta: boolean; acumuladoMes: number };
  totalGeral: { contatos: number; total: number; percentual: number; bateuMeta: boolean; acumuladoMes: number };
  semanaAtual: { inicio: string; fim: string };
  mesAtual: string; // ex: "Março/2026"
  clientesPorMarco: MarcoStats[]; // clientes até 90 dias por marco
  totalClientesMarco: number;
  clientesMarcoDetalhado: ClienteMarcoDetalhado[]; // todos os clientes com dados de boleto e URs
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

function getMesAtual(): { inicio: Date; fim: Date; label: string } {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  fim.setHours(23, 59, 59, 999);
  const label = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return { inicio, fim, label: label.charAt(0).toUpperCase() + label.slice(1) };
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
  rows: { nome: string; csm: string; ultimoContato: string; flag: FlagTipo; faturamento: string; cidade: string; estado: string }[],
  semana: { inicio: Date; fim: Date },
  mes: { inicio: Date; fim: Date }
): CoberturaCSM[] {
  const mapa: Record<string, {
    contatos: number;
    total: number;
    clientesContatados: ClienteContato[];
    clientesSemContato: ClienteContato[];
    nomesNoMes: Set<string>; // para deduplicar por nome no mês
  }> = {};

  for (const row of rows) {
    const csm = row.csm.trim();
    if (!csm) continue;

    if (!mapa[csm]) mapa[csm] = { contatos: 0, total: 0, clientesContatados: [], clientesSemContato: [], nomesNoMes: new Set() };
    mapa[csm].total++;

    const data = parseDate(row.ultimoContato);

    // Contato na semana atual
    if (data && data >= semana.inicio && data <= semana.fim) {
      mapa[csm].contatos++;
      mapa[csm].clientesContatados.push({
        nome: row.nome,
        flag: row.flag,
        ultimoContato: row.ultimoContato,
        faturamento: row.faturamento,
        cidade: row.cidade,
        estado: row.estado,
      });
    } else {
      // Clientes SEM contato na semana
      mapa[csm].clientesSemContato.push({
        nome: row.nome,
        flag: row.flag,
        ultimoContato: row.ultimoContato,
        faturamento: row.faturamento,
        cidade: row.cidade,
        estado: row.estado,
      });
    }

    // Acumulado do mês (cliente único por nome)
    if (data && data >= mes.inicio && data <= mes.fim) {
      mapa[csm].nomesNoMes.add(row.nome.trim());
    }
  }

  return Object.entries(mapa)
    .map(([csm, { contatos, total, clientesContatados, clientesSemContato, nomesNoMes }]) => {
      const percentual = total > 0 ? contatos / total : 0;
      const flagOrder: Record<FlagTipo, number> = { 'Red Flag': 0, 'Yellow Flag': 1, 'Black Flag': 2, '': 3 };
      clientesContatados.sort((a, b) => {
        const fo = flagOrder[a.flag] - flagOrder[b.flag];
        if (fo !== 0) return fo;
        return a.nome.localeCompare(b.nome);
      });
      // Ordenar clientes sem contato por data (mais antigo primeiro)
      clientesSemContato.sort((a, b) => {
        const dataA = parseDate(a.ultimoContato);
        const dataB = parseDate(b.ultimoContato);
        if (!dataA && !dataB) return a.nome.localeCompare(b.nome);
        if (!dataA) return 1; // sem data vai para o final
        if (!dataB) return -1;
        return dataA.getTime() - dataB.getTime(); // mais antigo primeiro
      });
      return {
        csm,
        contatosSemana: contatos,
        totalClientes: total,
        percentual,
        bateuMeta: percentual >= META_SEMANAL,
        clientesContatados,
        clientesSemContato,
        acumuladoMes: nomesNoMes.size,
      };
    })
    .sort((a, b) => a.csm.localeCompare(b.csm));
}

function somarTotal(lista: CoberturaCSM[]): { contatos: number; total: number; percentual: number; bateuMeta: boolean; acumuladoMes: number } {
  const contatos = lista.reduce((s, c) => s + c.contatosSemana, 0);
  const total = lista.reduce((s, c) => s + c.totalClientes, 0);
  const acumuladoMes = lista.reduce((s, c) => s + c.acumuladoMes, 0);
  const percentual = total > 0 ? contatos / total : 0;
  return { contatos, total, percentual, bateuMeta: percentual >= META_SEMANAL, acumuladoMes };
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
      const mes = getMesAtual();

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
      // Col A (idx 0) = Código, Col B (idx 1) = Nome, Col C (idx 2) = CSM, Col D (idx 3) = Entrada
      // Col L (idx 11) = Último Contato, Col O (idx 14) = Flag
      // Marcos: AK(36), AL(37), AM(38), AN(39), AO(40)
      const marcosRows: { nome: string; csm: string; ultimoContato: string; flag: FlagTipo; faturamento: string; cidade: string; estado: string }[] = [];
      const marcosRowsMarco: { nome: string; entrada: string; marcos: string[]; ultimoBoleto: number; quantidadeURs: number }[] = [];
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
        const faturamento = row[5]?.trim() || '';
        const cidade = row[34]?.trim() || ''; // AI (índice 34)
        const estado = row[35]?.trim() || ''; // AJ (índice 35)
        const entrada = row[3]?.trim() || '';
        const marcos = [row[36]?.trim() || '', row[37]?.trim() || '', row[38]?.trim() || '', row[39]?.trim() || '', row[40]?.trim() || ''];
        const ultimoBoletoStr = row[5]?.trim() || '0';
        const ultimoBoleto = parseFloat(ultimoBoletoStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
        const quantidadeURsStr = row[6]?.trim() || '0';
        const quantidadeURs = parseInt(quantidadeURsStr, 10) || 0;
        if (csm) marcosRows.push({ nome, csm, ultimoContato, flag, faturamento, cidade, estado });
        if (entrada) marcosRowsMarco.push({ nome, entrada, marcos, ultimoBoleto, quantidadeURs });
      }

      // Calcular clientes até 90 dias por Marco e coletar dados detalhados
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const marcoContagem: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const clientesMarcoDetalhado: ClienteMarcoDetalhado[] = [];
      
      for (const r of marcosRowsMarco) {
        const entradaDate = parseDate(r.entrada);
        if (!entradaDate) continue;
        const dias = Math.floor((hoje.getTime() - entradaDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dias > 90) continue; // só até 90 dias
        
        // Determinar marco atual (primeiro não-OK)
        let marcoAtual = 1;
        for (let m = 0; m < r.marcos.length; m++) {
          const v = r.marcos[m].trim();
          if (v.toUpperCase() === 'OK') {
            marcoAtual = m + 2; // próximo marco
          } else {
            marcoAtual = m + 1;
            break;
          }
        }
        if (marcoAtual > 5) marcoAtual = 5;
        marcoContagem[marcoAtual] = (marcoContagem[marcoAtual] || 0) + 1;
        
        // Encontrar dados do cliente em marcosRows para obter CSM, flag, etc
        const clienteInfo = marcosRows.find(mr => mr.nome === r.nome);
        if (clienteInfo) {
          clientesMarcoDetalhado.push({
            nome: r.nome,
            csm: clienteInfo.csm,
            marco: marcoAtual,
            ultimoBoleto: r.ultimoBoleto,
            quantidadeURs: r.quantidadeURs,
            flag: clienteInfo.flag,
            ultimoContato: clienteInfo.ultimoContato,
            faturamento: clienteInfo.faturamento,
            cidade: clienteInfo.cidade,
            estado: clienteInfo.estado
          });
        }
      }
      const totalClientesMarco = Object.values(marcoContagem).reduce((s, v) => s + v, 0);
      const clientesPorMarco: MarcoStats[] = [1, 2, 3, 4, 5].map(m => ({
        marco: m,
        quantidade: marcoContagem[m] || 0,
        percentual: totalClientesMarco > 0 ? (marcoContagem[m] || 0) / totalClientesMarco : 0,
      }));

      // Processar Ongoing
      // Col A (idx 0) = Código, Col B (idx 1) = Nome, Col C (idx 2) = CSM, Col F (idx 5) = Faturamento, Col AI (idx 34) = Cidade, Col AJ (idx 35) = Estado, Col L (idx 11) = Último Contato, Col O (idx 14) = Flag
      const ongoingRows: { nome: string; csm: string; ultimoContato: string; flag: FlagTipo; faturamento: string; cidade: string; estado: string }[] = [];
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
        const faturamento = row[5]?.trim() || '';
        const cidade = row[34]?.trim() || ''; // AI (índice 34)
        const estado = row[35]?.trim() || ''; // AJ (índice 35)
        if (csm) ongoingRows.push({ nome, csm, ultimoContato, flag, faturamento, cidade, estado });
      }

      const onboarding = calcularCobertura(marcosRows, semana, mes);
      const ongoing = calcularCobertura(ongoingRows, semana, mes);

      const totalOnboarding = somarTotal(onboarding);
      const totalOngoing = somarTotal(ongoing);
      const totalGeral = {
        contatos: totalOnboarding.contatos + totalOngoing.contatos,
        total: totalOnboarding.total + totalOngoing.total,
        acumuladoMes: totalOnboarding.acumuladoMes + totalOngoing.acumuladoMes,
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
        mesAtual: mes.label,
        clientesPorMarco,
        totalClientesMarco,
        clientesMarcoDetalhado,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
}
