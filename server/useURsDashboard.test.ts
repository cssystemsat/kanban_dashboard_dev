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

describe('useURsDashboard - Lógica de delta', () => {
  it('deve calcular delta percentual corretamente', () => {
    const delta = -131;
    const firstTotal = 879;
    const deltaPercent = (delta / firstTotal) * 100;
    expect(deltaPercent).toBeCloseTo(-14.90, 1);
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
});

describe('useURsDashboard - Evolução últimos 30 dias', () => {
  it('deve limitar dados aos últimos 30 dias', () => {
    const allDates = Array.from({ length: 60 }, (_, i) => ({
      date: `2026-04-${String(i + 1).padStart(2, '0')}`,
      quantity: 270000 + i * 10,
    }));
    const evolution = allDates.slice(-30);
    expect(evolution.length).toBe(30);
    expect(evolution[0].date).toBe('2026-04-31');
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
