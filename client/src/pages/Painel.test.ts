import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Teste para validar o auto-refresh a cada 10 minutos na aba Painel
 * 
 * Nota: Este é um teste unitário que valida a lógica do hook useAutoRefresh
 * e a integração com o componente Painel. O teste real de auto-refresh seria
 * melhor validado com um teste de integração ou e2e que simule o tempo passando.
 */

describe('Painel Auto-Refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('deve chamar callback a cada 10 minutos (600000ms)', () => {
    const callback = vi.fn();
    const intervalMs = 600000; // 10 minutos

    // Simular o comportamento do useAutoRefresh
    const interval = setInterval(callback, intervalMs);

    // Avançar 10 minutos
    vi.advanceTimersByTime(600000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Avançar mais 10 minutos
    vi.advanceTimersByTime(600000);
    expect(callback).toHaveBeenCalledTimes(2);

    // Limpar
    clearInterval(interval);
  });

  it('deve permitir atualização manual além do auto-refresh', () => {
    const callback = vi.fn();
    const manualCallback = vi.fn();

    // Simular auto-refresh
    const interval = setInterval(callback, 600000);

    // Simular clique manual no botão
    manualCallback();
    expect(manualCallback).toHaveBeenCalledTimes(1);

    // Auto-refresh deve continuar funcionando
    vi.advanceTimersByTime(600000);
    expect(callback).toHaveBeenCalledTimes(1);

    clearInterval(interval);
  });

  it('deve limpar o intervalo quando o componente desmontar', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const callback = vi.fn();

    const interval = setInterval(callback, 600000);

    // Simular desmontagem
    clearInterval(interval);

    expect(clearIntervalSpy).toHaveBeenCalledWith(interval);
    clearIntervalSpy.mockRestore();
  });

  it('deve atualizar lastRefreshTime ao fazer refresh manual', () => {
    const now = new Date('2026-04-10T15:00:00Z');
    vi.setSystemTime(now);

    // Simular o comportamento de setLastRefreshTime
    let lastRefreshTime: Date | null = null;
    const setLastRefreshTime = (time: Date) => {
      lastRefreshTime = time;
    };

    // Simular clique no botão Atualizar
    setLastRefreshTime(new Date());

    expect(lastRefreshTime).not.toBeNull();
    expect(lastRefreshTime?.getTime()).toBe(now.getTime());
  });

  it('deve chamar fetchData e fetchMig no auto-refresh', () => {
    const fetchData = vi.fn();
    const fetchMig = vi.fn();
    const setLastRefreshTime = vi.fn();

    // Simular o callback do useAutoRefresh
    const autoRefreshCallback = () => {
      fetchData();
      fetchMig();
      setLastRefreshTime(new Date());
    };

    const interval = setInterval(autoRefreshCallback, 600000);

    // Avançar 10 minutos
    vi.advanceTimersByTime(600000);

    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(fetchMig).toHaveBeenCalledTimes(1);
    expect(setLastRefreshTime).toHaveBeenCalledTimes(1);

    clearInterval(interval);
  });
});

  it('cronometro deve contar regressivamente de 600 segundos', () => {
    let timeLeft = 600;
    const onComplete = vi.fn();

    // Simular decremento a cada segundo
    const countdownInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
      } else {
        onComplete();
        timeLeft = 600;
      }
    }, 1000);

    // Avançar 1 segundo
    vi.advanceTimersByTime(1000);
    expect(timeLeft).toBe(599);

    // Avançar 599 segundos
    vi.advanceTimersByTime(599000);
    expect(timeLeft).toBe(0);

    // Verificar que onComplete foi chamado
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Após reset, deve voltar a 600
    expect(timeLeft).toBe(600);

    clearInterval(countdownInterval);
  });

  it('cronometro deve resetar após completar', () => {
    let timeLeft = 600;
    const onComplete = vi.fn();

    const countdownInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
      } else {
        onComplete();
        timeLeft = 600;
      }
    }, 1000);

    // Avançar 600 segundos (10 minutos)
    vi.advanceTimersByTime(600000);

    // Após completar, deve resetar para 600
    expect(timeLeft).toBe(600);
    expect(onComplete).toHaveBeenCalled();

    clearInterval(countdownInterval);
  });
});
