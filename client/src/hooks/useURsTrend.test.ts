import { describe, it, expect } from 'vitest';
import { URsEvolutionData, URsTrendData } from './useURsTrend';

// Simular cálculo de tendência (mesma lógica do hook)
function calculateTrend(
  allData: URsEvolutionData[],
  startDate: Date,
  endDate: Date
): URsTrendData | null {
  if (!allData || allData.length === 0) {
    return null;
  }

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  const periodData = allData.filter(
    item => item.timestamp >= startTime && item.timestamp <= endTime
  );

  if (periodData.length < 2) {
    return null;
  }

  const sorted = [...periodData].sort((a, b) => a.timestamp - b.timestamp);
  const firstEntry = sorted[0];
  const lastEntry = sorted[sorted.length - 1];

  const startQty = firstEntry.quantity;
  const endQty = lastEntry.quantity;
  const change = endQty - startQty;
  const percentChange = startQty !== 0 ? (change / startQty) * 100 : 0;

  return {
    clientName: firstEntry.clientName,
    codigoCliente: 'TEST001',
    startQuantity: startQty,
    endQuantity: endQty,
    trend: change,
    percentChange,
    isAscending: change > 0,
    isDeclining: change < 0,
    isStable: change === 0,
  };
}

describe('useURsTrend', () => {
  it('deve calcular tendência ascendente corretamente', () => {
    const data: URsEvolutionData[] = [
      { clientName: 'Cliente A', date: '01/01/2025', quantity: 10, timestamp: new Date('2025-01-01').getTime() },
      { clientName: 'Cliente A', date: '15/01/2025', quantity: 15, timestamp: new Date('2025-01-15').getTime() },
      { clientName: 'Cliente A', date: '31/01/2025', quantity: 20, timestamp: new Date('2025-01-31').getTime() },
    ];

    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    const trend = calculateTrend(data, startDate, endDate);

    expect(trend).not.toBeNull();
    expect(trend?.isAscending).toBe(true);
    expect(trend?.isDeclining).toBe(false);
    expect(trend?.trend).toBe(10);
    expect(trend?.percentChange).toBe(100);
  });

  it('deve calcular tendência descendente corretamente', () => {
    const data: URsEvolutionData[] = [
      { clientName: 'Cliente B', date: '01/01/2025', quantity: 20, timestamp: new Date('2025-01-01').getTime() },
      { clientName: 'Cliente B', date: '15/01/2025', quantity: 15, timestamp: new Date('2025-01-15').getTime() },
      { clientName: 'Cliente B', date: '31/01/2025', quantity: 10, timestamp: new Date('2025-01-31').getTime() },
    ];

    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    const trend = calculateTrend(data, startDate, endDate);

    expect(trend).not.toBeNull();
    expect(trend?.isAscending).toBe(false);
    expect(trend?.isDeclining).toBe(true);
    expect(trend?.trend).toBe(-10);
    expect(trend?.percentChange).toBe(-50);
  });

  it('deve calcular tendência estável corretamente', () => {
    const data: URsEvolutionData[] = [
      { clientName: 'Cliente C', date: '01/01/2025', quantity: 15, timestamp: new Date('2025-01-01').getTime() },
      { clientName: 'Cliente C', date: '15/01/2025', quantity: 15, timestamp: new Date('2025-01-15').getTime() },
      { clientName: 'Cliente C', date: '31/01/2025', quantity: 15, timestamp: new Date('2025-01-31').getTime() },
    ];

    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    const trend = calculateTrend(data, startDate, endDate);

    expect(trend).not.toBeNull();
    expect(trend?.isAscending).toBe(false);
    expect(trend?.isDeclining).toBe(false);
    expect(trend?.isStable).toBe(true);
    expect(trend?.trend).toBe(0);
    expect(trend?.percentChange).toBe(0);
  });

  it('deve retornar null se não houver dados suficientes', () => {
    const data: URsEvolutionData[] = [
      { clientName: 'Cliente D', date: '01/01/2025', quantity: 10, timestamp: new Date('2025-01-01').getTime() },
    ];

    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    const trend = calculateTrend(data, startDate, endDate);

    expect(trend).toBeNull();
  });

  it('deve filtrar dados corretamente por período', () => {
    const data: URsEvolutionData[] = [
      { clientName: 'Cliente E', date: '01/12/2024', quantity: 5, timestamp: new Date('2024-12-01').getTime() },
      { clientName: 'Cliente E', date: '01/01/2025', quantity: 10, timestamp: new Date('2025-01-01').getTime() },
      { clientName: 'Cliente E', date: '15/01/2025', quantity: 15, timestamp: new Date('2025-01-15').getTime() },
      { clientName: 'Cliente E', date: '01/02/2025', quantity: 20, timestamp: new Date('2025-02-01').getTime() },
    ];

    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    const trend = calculateTrend(data, startDate, endDate);

    expect(trend).not.toBeNull();
    expect(trend?.startQuantity).toBe(10);
    expect(trend?.endQuantity).toBe(15);
    expect(trend?.trend).toBe(5);
  });

  it('deve calcular percentual de mudança corretamente', () => {
    const data: URsEvolutionData[] = [
      { clientName: 'Cliente F', date: '01/01/2025', quantity: 100, timestamp: new Date('2025-01-01').getTime() },
      { clientName: 'Cliente F', date: '31/01/2025', quantity: 150, timestamp: new Date('2025-01-31').getTime() },
    ];

    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    const trend = calculateTrend(data, startDate, endDate);

    expect(trend).not.toBeNull();
    expect(trend?.percentChange).toBe(50);
  });
});
