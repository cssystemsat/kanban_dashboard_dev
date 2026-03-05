import { useState, useCallback } from 'react';

export interface ClientData {
  id: string;
  nome: string;
  codigoCliente: string;
  entrada: string;
  diasCorridos: number;
  urs: string;
  rastreadores: string;
  ultimoBoleto: string;
  atendente: string;
  flag: string; // Coluna O — 'Red Flag' | 'Yellow Flag' | 'Black Flag' | ''
  estrela: boolean; // Coluna Q — checkbox
  comercial: string;
  saude: string;
  marco: number;
  marcoStatus: 'ok' | 'atrasado' | 'pendente';
  marcoData: string;
  bitrixLink?: string;
  ganhoUrs?: string;
  perdaUrs?: string;
  decisor?: string;
  whatsapp?: string;
  whatsappGrupo?: string;
  tags?: string[];
  estado?: string; // Coluna AJ - Estado (UF)
  consumo?: string; // Coluna BE - Consumo
  deltaConsumo?: string; // Coluna AP - Delta entre consumo e pagamento
  percentualDesatualizado?: number; // Coluna I - % Veículos Desatualizados
  diasUltimoContato?: number; // Coluna M - Dias do último contato
  isComplete?: boolean; // Todos os 5 marcos com status OK
  tipoCliente?: string; // Coluna V - Tipo de cliente
  persona?: string; // Coluna Y - Persona
  tagsCliente?: string; // Coluna Z - Tags do cliente
  cidade?: string; // Coluna AI - Cidade do cliente
}

interface RawRow {
  [key: string]: string;
}

export const useKanbanData = () => {
  const [data, setData] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.trim() === '') return null;
    
    // Tenta formato DD/MM/YYYY
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month - 1, day);
    }
    return null;
  };

  const isDateOverdue = (dateStr: string): boolean => {
    const date = parseDate(dateStr);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getMarcoStatus = (marcoValue: string): 'ok' | 'atrasado' | 'pendente' => {
    if (!marcoValue || marcoValue.trim() === '') return 'pendente';
    if (marcoValue.trim().toUpperCase() === 'OK') return 'ok';
    if (isDateOverdue(marcoValue)) return 'atrasado';
    return 'ok';
  };

  const getCurrentMarco = (marcos: string[]): { marco: number; status: 'ok' | 'atrasado' | 'pendente'; data: string; isComplete: boolean } => {
    // Encontra o primeiro marco que não é OK
    for (let i = 0; i < marcos.length; i++) {
      const marcoValue = marcos[i].trim();
      if (marcoValue === '' || marcoValue.toUpperCase() !== 'OK') {
        return {
          marco: i + 1,
          status: getMarcoStatus(marcoValue),
          data: marcoValue,
          isComplete: false
        };
      }
    }
    // Se todos são OK, cliente completou todos os marcos
    return {
      marco: 5,
      status: 'ok',
      data: marcos[4] || '',
      isComplete: true
    };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vR99O_8CQgEAn4-VK_LrJ0T8lJnhYdCkE9gIX68G3vLFmsD6tGhP0WEHaysf_DA7zYscn2nMpTmnUbC/pub?output=csv'
      );
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados da planilha');
      }

      const csv = await response.text();
      const lines = csv.split('\n');
      
      if (lines.length < 2) {
        throw new Error('Planilha vazia ou inválida');
      }

      const header = lines[0].split(',');
      
      // Encontrar indices das colunas
      const codigoClienteIdx = 0; // Coluna A
      const clienteIdx = 1; // Coluna B
      const atendenteIdx = 2; // Coluna C
      const entradaIdx = 3; // Coluna D
      const ultimoBoletoIdx = 5; // Coluna F
      const ursIdx = 6; // Coluna G
      const rastreadoresIdx = 9; // Coluna J
      const percentualDesatualizadoIdx = 8; // Coluna I - % Veículos Desatualizados
      const diasUltimoContatoIdx = 12; // Coluna M - Dias do último contato
      const flagIdx = 14; // Coluna O — nível de flag (texto)
      const estrelaIdx = 16; // Coluna Q — estrela (checkbox)
      const comercialIdx = 23; // Coluna X
      const saudeIdx = 27; // Coluna AB
      const ganhoUrsIdx = 28; // Coluna AC
      const perdaUrsIdx = 29; // Coluna AD
      const decisorIdx = 30; // Coluna AE
      const whatsappIdx = 31; // Coluna AF
      const whatsappGrupoIdx = 56; // Coluna BE
      const consumoIdx = 56; // Coluna BE - Consumo
      const tagsIdx = 26; // Coluna AA (Objetivos do cliente)
      const estadoIdx = 35; // Coluna AJ (Estado)
      const tipoClienteIdx = 21; // Coluna V - Tipo de cliente
      const personaIdx = 24; // Coluna Y - Persona
      const tagsClienteIdx = 25; // Coluna Z - Tags do cliente
      const cidadeIdx = 34; // Coluna AI - Cidade do cliente
      const marco1Idx = 36; // Coluna AK
      const marco2Idx = 37; // Coluna AL
      const marco3Idx = 38; // Coluna AM
      const marco4Idx = 39; // Coluna AN
      const marco5Idx = 40; // Coluna AO
      const deltaConsumoIdx = 41; // Coluna AP (Delta entre consumo e pagamento)
      const bitrixIdx = 55; // Coluna BD

      const clients: ClientData[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV com suporte a campos com aspas
        const row = parseCSVLine(line);
        
        if (row.length <= clienteIdx) continue;

        const nome = row[clienteIdx]?.trim() || '';
        if (!nome) continue;

        const marcos = [
          row[marco1Idx]?.trim() || '',
          row[marco2Idx]?.trim() || '',
          row[marco3Idx]?.trim() || '',
          row[marco4Idx]?.trim() || '',
          row[marco5Idx]?.trim() || ''
        ];

        const { marco, status, data: marcoData, isComplete } = getCurrentMarco(marcos);
        
        // Calcular dias corridos desde a entrada
        const entradaDate = parseDate(row[entradaIdx]?.trim() || '');
        let diasCorridos = 0;
        if (entradaDate) {
          const today = new Date();
          diasCorridos = Math.floor((today.getTime() - entradaDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        const bitrixLink = row[bitrixIdx]?.trim() || undefined;
        const ganhoUrs = row[ganhoUrsIdx]?.trim() || undefined;
        const perdaUrs = row[perdaUrsIdx]?.trim() || undefined;
        const decisor = row[decisorIdx]?.trim() || undefined;
        const whatsapp = row[whatsappIdx]?.trim() || undefined;
        const whatsappGrupo = row[whatsappGrupoIdx]?.trim() || undefined;
        const tagsRaw = row[tagsIdx]?.trim() || '';
        const tags = tagsRaw 
          ? tagsRaw
              .split(/[,\n\r]+/)
              .map(t => t.trim())
              .filter(t => t && t.length > 0)
          : [];
        const estado = row[estadoIdx]?.trim().toUpperCase() || undefined;
        const deltaConsumo = row[deltaConsumoIdx]?.trim() || undefined;
        const percentualDesatualizadoStr = row[percentualDesatualizadoIdx]?.trim() || '0';
        const percentualDesatualizado = parseFloat(percentualDesatualizadoStr.replace('%', '')) || 0;
        const diasUltimoContatoStr = row[diasUltimoContatoIdx]?.trim() || '0';
        const diasUltimoContato = parseInt(diasUltimoContatoStr) || 0;
        const tipoCliente = row[tipoClienteIdx]?.trim() || undefined;
        const persona = row[personaIdx]?.trim() || undefined;
        const tagsCliente = row[tagsClienteIdx]?.trim() || undefined;
        const cidade = row[cidadeIdx]?.trim() || undefined;
        const consumo = row[consumoIdx]?.trim() || undefined;

        const codigoCliente = row[codigoClienteIdx]?.trim() || nome;
        
        clients.push({
          id: `${nome}-${i}`,
          nome,
          codigoCliente,
          entrada: row[entradaIdx]?.trim() || '',
          diasCorridos,
          urs: row[ursIdx]?.trim() || '',
          rastreadores: row[rastreadoresIdx]?.trim() || '',
          ultimoBoleto: row[ultimoBoletoIdx]?.trim() || '',
          atendente: row[atendenteIdx]?.trim() || '',
          flag: row[flagIdx]?.trim() || '',
          estrela: row[estrelaIdx]?.trim().toUpperCase() === 'TRUE',
          comercial: row[comercialIdx]?.trim() || '',
          saude: row[saudeIdx]?.trim() || '',
          marco,
          marcoStatus: status,
          marcoData,
          bitrixLink,
          estado,
          ganhoUrs,
          perdaUrs,
          decisor,
          whatsapp,
          whatsappGrupo,
          tags,
          deltaConsumo,
          consumo,
          percentualDesatualizado,
          diasUltimoContato,
          tipoCliente,
          persona,
          tagsCliente,
          cidade,
          isComplete
        });
      }

      setData(clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};

// Helper para fazer parse correto de CSV com campos entre aspas
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
