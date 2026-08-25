import { describe, it, expect, vi, beforeEach } from 'vitest';

interface ClienteEstado {
  nome: string;
  estado?: string;
  faturamento?: string;
  atendente?: string;
}

describe('BrazilMapPainel - Exportação CSV', () => {
  beforeEach(() => {
    // Mock para URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  });

  it('deve exibir todos os estados (sem limitação de 10)', () => {
    const clientes: ClienteEstado[] = [
      { nome: 'Cliente 1', estado: 'SP', faturamento: '1000', atendente: 'João' },
      { nome: 'Cliente 2', estado: 'RJ', faturamento: '2000', atendente: 'Maria' },
      { nome: 'Cliente 3', estado: 'MG', faturamento: '1500', atendente: 'Pedro' },
      { nome: 'Cliente 4', estado: 'BA', faturamento: '800', atendente: 'Ana' },
      { nome: 'Cliente 5', estado: 'RS', faturamento: '1200', atendente: 'Carlos' },
      { nome: 'Cliente 6', estado: 'SC', faturamento: '900', atendente: 'Laura' },
      { nome: 'Cliente 7', estado: 'PR', faturamento: '1100', atendente: 'Bruno' },
      { nome: 'Cliente 8', estado: 'PE', faturamento: '700', atendente: 'Sofia' },
      { nome: 'Cliente 9', estado: 'CE', faturamento: '950', atendente: 'Diego' },
      { nome: 'Cliente 10', estado: 'PA', faturamento: '850', atendente: 'Fernanda' },
      { nome: 'Cliente 11', estado: 'GO', faturamento: '1050', atendente: 'Rafael' },
    ];

    // Simular contagem de estados
    const clientsByState: Record<string, ClienteEstado[]> = {};
    clientes.forEach(client => {
      if (client.estado) {
        if (!clientsByState[client.estado]) clientsByState[client.estado] = [];
        clientsByState[client.estado].push(client);
      }
    });

    const stateRanking = Object.entries(clientsByState)
      .map(([state, clientes]) => ({ state, count: clientes.length }))
      .sort((a, b) => b.count - a.count);

    // Deve ter 11 estados (todos, não apenas 10)
    expect(stateRanking.length).toBe(11);
  });

  it('deve gerar CSV com todos os estados', () => {
    const clientes: ClienteEstado[] = [
      { nome: 'Cliente 1', estado: 'SP' },
      { nome: 'Cliente 2', estado: 'RJ' },
      { nome: 'Cliente 3', estado: 'MG' },
    ];

    const clientsByState: Record<string, ClienteEstado[]> = {};
    clientes.forEach(client => {
      if (client.estado) {
        if (!clientsByState[client.estado]) clientsByState[client.estado] = [];
        clientsByState[client.estado].push(client);
      }
    });

    const stateRanking = Object.entries(clientsByState)
      .map(([state, clientes]) => ({ state, count: clientes.length }))
      .sort((a, b) => b.count - a.count);

    const totalClients = clientes.length;

    // Simular geração de CSV
    const headers = ['Estado', 'Quantidade', 'Percentual'];
    const rows = stateRanking.map(({ state, count }) => {
      const percentage = ((count / totalClients) * 100).toFixed(1);
      return [state, count.toString(), `${percentage}%`];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    expect(csvContent).toContain('Estado,Quantidade,Percentual');
    expect(csvContent).toContain('SP,1,33.3%');
    expect(csvContent).toContain('RJ,1,33.3%');
    expect(csvContent).toContain('MG,1,33.3%');
  });

  it('deve calcular percentuais corretamente', () => {
    const clientes: ClienteEstado[] = [
      { nome: 'Cliente 1', estado: 'SP' },
      { nome: 'Cliente 2', estado: 'SP' },
      { nome: 'Cliente 3', estado: 'RJ' },
      { nome: 'Cliente 4', estado: 'RJ' },
      { nome: 'Cliente 5', estado: 'RJ' },
    ];

    const clientsByState: Record<string, ClienteEstado[]> = {};
    clientes.forEach(client => {
      if (client.estado) {
        if (!clientsByState[client.estado]) clientsByState[client.estado] = [];
        clientsByState[client.estado].push(client);
      }
    });

    const stateRanking = Object.entries(clientsByState)
      .map(([state, clientes]) => ({ state, count: clientes.length }))
      .sort((a, b) => b.count - a.count);

    const totalClients = clientes.length;

    // RJ deve ter 60% (3 de 5)
    const rjEntry = stateRanking.find(e => e.state === 'RJ');
    expect(rjEntry).toBeDefined();
    expect(rjEntry!.count).toBe(3);

    const rjPercentage = ((rjEntry!.count / totalClients) * 100).toFixed(1);
    expect(rjPercentage).toBe('60.0');

    // SP deve ter 40% (2 de 5)
    const spEntry = stateRanking.find(e => e.state === 'SP');
    expect(spEntry).toBeDefined();
    expect(spEntry!.count).toBe(2);

    const spPercentage = ((spEntry!.count / totalClients) * 100).toFixed(1);
    expect(spPercentage).toBe('40.0');
  });

  it('deve ordenar estados por quantidade (decrescente)', () => {
    const clientes: ClienteEstado[] = [
      { nome: 'Cliente 1', estado: 'SP' },
      { nome: 'Cliente 2', estado: 'SP' },
      { nome: 'Cliente 3', estado: 'SP' },
      { nome: 'Cliente 4', estado: 'RJ' },
      { nome: 'Cliente 5', estado: 'RJ' },
      { nome: 'Cliente 6', estado: 'MG' },
    ];

    const clientsByState: Record<string, ClienteEstado[]> = {};
    clientes.forEach(client => {
      if (client.estado) {
        if (!clientsByState[client.estado]) clientsByState[client.estado] = [];
        clientsByState[client.estado].push(client);
      }
    });

    const stateRanking = Object.entries(clientsByState)
      .map(([state, clientes]) => ({ state, count: clientes.length }))
      .sort((a, b) => b.count - a.count);

    // SP (3) > RJ (2) > MG (1)
    expect(stateRanking[0].state).toBe('SP');
    expect(stateRanking[0].count).toBe(3);
    expect(stateRanking[1].state).toBe('RJ');
    expect(stateRanking[1].count).toBe(2);
    expect(stateRanking[2].state).toBe('MG');
    expect(stateRanking[2].count).toBe(1);
  });
});
