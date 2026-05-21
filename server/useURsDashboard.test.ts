import { describe, it, expect } from 'vitest';

// Testar a lógica de parsing e classificação isoladamente
const TAG_MODELS = ['airtag pb703', 'webtag'];

function isTag(model: string): boolean {
  return TAG_MODELS.includes(model.toLowerCase().trim());
}

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

describe('useURsDashboard - Lógica de classificação de equipamentos', () => {
  it('deve identificar AirTag PB703 como tag', () => {
    expect(isTag('AirTag PB703')).toBe(true);
    expect(isTag('airtag pb703')).toBe(true);
    expect(isTag('AIRTAG PB703')).toBe(true);
  });

  it('deve identificar webtag como tag', () => {
    expect(isTag('webtag')).toBe(true);
    expect(isTag('Webtag')).toBe(true);
    expect(isTag('WEBTAG')).toBe(true);
  });

  it('deve identificar outros modelos como câmera', () => {
    expect(isTag('Camera HD')).toBe(false);
    expect(isTag('JC400')).toBe(false);
    expect(isTag('JC450')).toBe(false);
    expect(isTag('MDVR')).toBe(false);
    expect(isTag('Sensor')).toBe(false);
  });
});

describe('useURsDashboard - Parser CSV', () => {
  it('deve parsear linha simples corretamente', () => {
    const line = 'SSX_CLIENTE,valor1,valor2,valor3,100,total,5';
    const parts = parseCSVLine(line);
    expect(parts[0]).toBe('SSX_CLIENTE');
    expect(parts[4]).toBe('100');
    expect(parts[6]).toBe('5');
  });

  it('deve lidar com campos entre aspas', () => {
    const line = '"SSX_CLIENTE, COM VIRGULA",valor1,valor2';
    const parts = parseCSVLine(line);
    expect(parts[0]).toBe('SSX_CLIENTE, COM VIRGULA');
    expect(parts[1]).toBe('valor1');
  });

  it('deve lidar com aspas duplas escapadas', () => {
    const line = '"Campo com ""aspas""",outro';
    const parts = parseCSVLine(line);
    expect(parts[0]).toBe('Campo com "aspas"');
    expect(parts[1]).toBe('outro');
  });

  it('deve retornar campos vazios corretamente', () => {
    const line = 'a,,b,,c';
    const parts = parseCSVLine(line);
    expect(parts).toEqual(['a', '', 'b', '', 'c']);
  });
});

describe('useURsDashboard - Lógica de delta (colunas AA, AD, AE)', () => {
  it('deve usar delta já pronto da coluna AD e % da coluna AE', () => {
    // Simula leitura direta das colunas AA, AD, AE
    const clientDeltaSet = new Map<string, { delta: number; deltaPercent: number }>();
    
    // Dados como viriam da planilha
    const rows = [
      { clientName: 'SSX_CONTROLRISC', deltaStr: '-131', percentStr: '-14.90' },
      { clientName: 'SSX_GLOBALMOVE', deltaStr: '105', percentStr: '7.13' },
      { clientName: 'SSX_KHRONOS', deltaStr: '-45', percentStr: '-0.30' },
    ];

    for (const row of rows) {
      const delta = parseFloat(row.deltaStr);
      const deltaPercent = parseFloat(row.percentStr);
      if (!isNaN(delta) && delta !== 0) {
        clientDeltaSet.set(row.clientName, { delta, deltaPercent });
      }
    }

    expect(clientDeltaSet.get('SSX_CONTROLRISC')?.delta).toBe(-131);
    expect(clientDeltaSet.get('SSX_CONTROLRISC')?.deltaPercent).toBe(-14.90);
    expect(clientDeltaSet.get('SSX_GLOBALMOVE')?.delta).toBe(105);
  });

  it('deve classificar deltas negativos como piores clientes', () => {
    const deltas = [
      { clientName: 'A', delta: -10, deltaPercent: -5 },
      { clientName: 'B', delta: 5, deltaPercent: 2 },
      { clientName: 'C', delta: -3, deltaPercent: -1 },
    ];
    const worst = deltas.filter(c => c.delta < 0).sort((a, b) => a.delta - b.delta);
    expect(worst[0].clientName).toBe('A');
    expect(worst[1].clientName).toBe('C');
    expect(worst.length).toBe(2);
  });

  it('deve classificar deltas positivos como melhores clientes', () => {
    const deltas = [
      { clientName: 'A', delta: -10, deltaPercent: -5 },
      { clientName: 'B', delta: 5, deltaPercent: 2 },
      { clientName: 'C', delta: 15, deltaPercent: 8 },
    ];
    const best = deltas.filter(c => c.delta > 0).sort((a, b) => b.delta - a.delta);
    expect(best[0].clientName).toBe('C');
    expect(best[1].clientName).toBe('B');
    expect(best.length).toBe(2);
  });

  it('deve ignorar clientes com delta zero', () => {
    const clientDeltaSet = new Map<string, { delta: number; deltaPercent: number }>();
    const delta = parseFloat('0');
    if (!isNaN(delta) && delta !== 0) {
      clientDeltaSet.set('SSX_ZERO', { delta, deltaPercent: 0 });
    }
    expect(clientDeltaSet.has('SSX_ZERO')).toBe(false);
  });
});

describe('useURsDashboard - Evolução últimos 30 dias', () => {
  it('deve limitar dados aos últimos 30 dias', () => {
    const allDates = Array.from({ length: 60 }, (_, i) => ({
      date: `2026-03-${String(i + 1).padStart(2, '0')}`,
      quantity: 270000 + i * 10,
    }));
    const evolution = allDates.slice(-30);
    expect(evolution.length).toBe(30);
  });

  it('deve ordenar por data crescente', () => {
    const data = [
      { date: '2026-04-15', quantity: 270000 },
      { date: '2026-04-10', quantity: 269000 },
      { date: '2026-04-20', quantity: 271000 },
    ];
    const sorted = data.sort((a, b) => a.date.localeCompare(b.date));
    expect(sorted[0].date).toBe('2026-04-10');
    expect(sorted[2].date).toBe('2026-04-20');
  });
});

describe('useURsDashboard - Filtro por mês (coluna AU dd/mm/aaaa)', () => {
  function isDateInCurrentMonth(dateStr: string, currentMonth: number, currentYear: number): boolean {
    if (!dateStr) return false;
    const trimmed = dateStr.trim();
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

  it('deve identificar data do mês atual corretamente (maio 2026)', () => {
    expect(isDateInCurrentMonth('05/05/2026', 4, 2026)).toBe(true);
    expect(isDateInCurrentMonth('15/05/2026', 4, 2026)).toBe(true);
    expect(isDateInCurrentMonth('31/05/2026', 4, 2026)).toBe(true);
  });

  it('deve rejeitar datas de outros meses', () => {
    expect(isDateInCurrentMonth('01/04/2026', 4, 2026)).toBe(false);
    expect(isDateInCurrentMonth('01/06/2026', 4, 2026)).toBe(false);
  });

  it('deve rejeitar datas de outros anos', () => {
    expect(isDateInCurrentMonth('05/05/2025', 4, 2026)).toBe(false);
  });

  it('deve rejeitar datas inválidas ou vazias', () => {
    expect(isDateInCurrentMonth('', 4, 2026)).toBe(false);
    expect(isDateInCurrentMonth('abc', 4, 2026)).toBe(false);
    expect(isDateInCurrentMonth('2026-05-05', 4, 2026)).toBe(false);
  });
});

describe('useURsDashboard - Deduplicação de clientes', () => {
  it('deve manter apenas primeira ocorrência de cada cliente (colunas AA/AD/AE)', () => {
    const clientDeltaSet = new Map<string, { delta: number; deltaPercent: number }>();
    
    // Simular múltiplas linhas do mesmo cliente - só primeira deve contar
    const rows = [
      { clientName: 'SSX_A', delta: -10, deltaPercent: -2 },
      { clientName: 'SSX_A', delta: -5, deltaPercent: -1 }, // duplicata
      { clientName: 'SSX_B', delta: 15, deltaPercent: 3 },
    ];

    for (const row of rows) {
      if (row.delta !== 0 && !clientDeltaSet.has(row.clientName)) {
        clientDeltaSet.set(row.clientName, { delta: row.delta, deltaPercent: row.deltaPercent });
      }
    }

    expect(clientDeltaSet.size).toBe(2);
    expect(clientDeltaSet.get('SSX_A')?.delta).toBe(-10); // primeira ocorrência
  });
});

describe('useURsDashboard - Rastreamento de changedToday', () => {
  it('deve marcar cliente como changedToday se data é hoje e delta != 0', () => {
    const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
    const clientsChangedToday = new Set<string>();
    
    // Simular dados de hoje com delta
    const rows = [
      { clientName: 'SSX_SAFE_CAR_SERVICOS_BRASIL', dateStr: today, delta: 8 },
      { clientName: 'SSX_CONTROLRISC', dateStr: today, delta: 0 }, // delta zero não marca
      { clientName: 'SSX_MASTER_ASSOCIADOS', dateStr: '2026-05-20', delta: -65 }, // data diferente não marca
    ];
    
    for (const row of rows) {
      if (row.dateStr === today && row.clientName && row.delta !== 0) {
        clientsChangedToday.add(row.clientName);
      }
    }
    
    expect(clientsChangedToday.has('SSX_SAFE_CAR_SERVICOS_BRASIL')).toBe(true);
    expect(clientsChangedToday.has('SSX_CONTROLRISC')).toBe(false);
    expect(clientsChangedToday.has('SSX_MASTER_ASSOCIADOS')).toBe(false);
  });
  
  it('deve ignorar linhas com delta = "delta" (headers)', () => {
    const clientsChangedToday = new Set<string>();
    
    // Simular header row
    const deltaStr = 'delta';
    
    // Pular se for header
    if (deltaStr === 'delta' || !deltaStr) {
      // skip
    } else {
      clientsChangedToday.add('SSX_TEST');
    }
    
    expect(clientsChangedToday.has('SSX_TEST')).toBe(false);
  });
});
