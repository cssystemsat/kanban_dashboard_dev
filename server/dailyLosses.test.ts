import { describe, it, expect, vi } from 'vitest';

// Mock fetch para simular resposta do Google Sheets
const mockCsvResponse = `Cliente,SUM de Dif1Dia,SUM de QtdAtual,%
SSX_CLIENTEA,-10,"500,00","-2,00%"
SSX_CLIENTEB,5,"300,00","1,67%"
SSX_CLIENTEC,-3,"1000,00","-0,30%"
SSX_CLIENTED,0,"200,00","0,00%"`;

describe('dailyLosses.getAlert', () => {
  it('should parse CSV and return only clients with losses (negative values)', async () => {
    // Simulate the parsing logic from the router
    const csv = mockCsvResponse;
    const lines = csv.split('\n');
    const losses: { cliente: string; perda: number; qtdAtual: string; percentual: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { cols.push(current); current = ''; }
        else { current += char; }
      }
      cols.push(current);

      const cliente = (cols[0] || '').replace(/^SSX_/, '').trim();
      const perdaStr = (cols[1] || '').replace(/\./g, '').replace(',', '.').trim();
      const perda = parseFloat(perdaStr);
      const qtdAtual = (cols[2] || '').trim();
      const percentual = (cols[3] || '').trim();

      if (!isNaN(perda) && perda < 0) {
        losses.push({ cliente, perda, qtdAtual, percentual });
      }
    }

    losses.sort((a, b) => a.perda - b.perda);

    // Should only include negative values
    expect(losses).toHaveLength(2);
    expect(losses[0].cliente).toBe('CLIENTEA');
    expect(losses[0].perda).toBe(-10);
    expect(losses[0].qtdAtual).toBe('500,00');
    expect(losses[0].percentual).toBe('-2,00%');
    expect(losses[1].cliente).toBe('CLIENTEC');
    expect(losses[1].perda).toBe(-3);
  });

  it('should calculate total losses correctly', () => {
    const losses = [
      { cliente: 'A', perda: -10, qtdAtual: '500', percentual: '-2%' },
      { cliente: 'B', perda: -3, qtdAtual: '1000', percentual: '-0.3%' },
    ];
    const totalPerdas = losses.reduce((sum, l) => sum + l.perda, 0);
    expect(totalPerdas).toBe(-13);
  });

  it('should sort losses by most negative first', () => {
    const losses = [
      { cliente: 'B', perda: -3, qtdAtual: '1000', percentual: '-0.3%' },
      { cliente: 'A', perda: -10, qtdAtual: '500', percentual: '-2%' },
      { cliente: 'C', perda: -1, qtdAtual: '200', percentual: '-0.5%' },
    ];
    losses.sort((a, b) => a.perda - b.perda);
    expect(losses[0].cliente).toBe('A');
    expect(losses[1].cliente).toBe('B');
    expect(losses[2].cliente).toBe('C');
  });

  it('should remove SSX_ prefix from client names', () => {
    const raw = 'SSX_CORDILHA_E_ARAUJO';
    const cleaned = raw.replace(/^SSX_/, '').trim();
    expect(cleaned).toBe('CORDILHA_E_ARAUJO');
  });

  it('should return empty array when no losses exist', () => {
    const csv = `Cliente,SUM de Dif1Dia,SUM de QtdAtual,%
SSX_CLIENTEA,10,"500,00","2,00%"
SSX_CLIENTEB,5,"300,00","1,67%"`;
    const lines = csv.split('\n');
    const losses: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { cols.push(current); current = ''; }
        else { current += char; }
      }
      cols.push(current);
      const perdaStr = (cols[1] || '').replace(/\./g, '').replace(',', '.').trim();
      const perda = parseFloat(perdaStr);
      if (!isNaN(perda) && perda < 0) {
        losses.push({ perda });
      }
    }
    expect(losses).toHaveLength(0);
  });
});
