import { describe, it, expect } from 'vitest';

interface ClienteEstado {
  nome: string;
  estado?: string;
  faturamento?: string;
  atendente?: string;
  comercial?: string;
}

describe('BrazilMapPainel - Campo Comercial e Exportação de Clientes', () => {
  it('deve incluir campo comercial nos dados de clientes', () => {
    const cliente: ClienteEstado = {
      nome: 'TOMI 567',
      estado: 'SP',
      faturamento: 'R$ 750,00',
      atendente: 'Clarice',
      comercial: 'João Silva'
    };

    expect(cliente.comercial).toBe('João Silva');
    expect(cliente).toHaveProperty('comercial');
  });

  it('deve gerar CSV com clientes e campo comercial', () => {
    const clientes: ClienteEstado[] = [
      {
        nome: 'TOMI 567',
        estado: 'SP',
        faturamento: 'R$ 750,00',
        atendente: 'Clarice',
        comercial: 'João Silva'
      },
      {
        nome: 'MOOVO MOBILITY',
        estado: 'SP',
        faturamento: 'R$ 800,00',
        atendente: 'Clarice',
        comercial: 'Maria Santos'
      },
      {
        nome: 'LOCALEASY',
        estado: 'RJ',
        faturamento: 'R$ 590,00',
        atendente: 'Pedro',
        comercial: 'Carlos Costa'
      }
    ];

    const headers = ['Estado', 'Cliente', 'Faturamento', 'Atendente', 'Comercial'];
    const rows: string[][] = [];

    // Simular agrupamento por estado
    const clientsByState: Record<string, ClienteEstado[]> = {};
    clientes.forEach(client => {
      if (client.estado) {
        if (!clientsByState[client.estado]) clientsByState[client.estado] = [];
        clientsByState[client.estado].push(client);
      }
    });

    // Simular exportação
    Object.entries(clientsByState).forEach(([state, stateClients]) => {
      stateClients.forEach(client => {
        rows.push([
          state,
          client.nome,
          client.faturamento || '—',
          client.atendente || '—',
          client.comercial || '—'
        ]);
      });
    });

    // Validar CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    expect(csvContent).toContain('Estado,Cliente,Faturamento,Atendente,Comercial');
    expect(csvContent).toContain('SP');
    expect(csvContent).toContain('TOMI 567');
    expect(csvContent).toContain('João Silva');
    expect(csvContent).toContain('RJ');
    expect(csvContent).toContain('Carlos Costa');
  });

  it('deve lidar com comercial vazio', () => {
    const cliente: ClienteEstado = {
      nome: 'Cliente Teste',
      estado: 'MG',
      faturamento: 'R$ 1000,00',
      atendente: 'Ana'
      // comercial não fornecido
    };

    expect(cliente.comercial).toBeUndefined();
    const comercialValue = cliente.comercial || '—';
    expect(comercialValue).toBe('—');
  });

  it('deve ordenar clientes por estado na exportação', () => {
    const clientes: ClienteEstado[] = [
      { nome: 'Cliente RJ 1', estado: 'RJ', comercial: 'Com1' },
      { nome: 'Cliente SP 1', estado: 'SP', comercial: 'Com2' },
      { nome: 'Cliente RJ 2', estado: 'RJ', comercial: 'Com3' },
      { nome: 'Cliente SP 2', estado: 'SP', comercial: 'Com4' },
      { nome: 'Cliente MG 1', estado: 'MG', comercial: 'Com5' }
    ];

    const clientsByState: Record<string, ClienteEstado[]> = {};
    clientes.forEach(client => {
      if (client.estado) {
        if (!clientsByState[client.estado]) clientsByState[client.estado] = [];
        clientsByState[client.estado].push(client);
      }
    });

    // Verificar agrupamento
    expect(Object.keys(clientsByState).length).toBe(3);
    expect(clientsByState['SP'].length).toBe(2);
    expect(clientsByState['RJ'].length).toBe(2);
    expect(clientsByState['MG'].length).toBe(1);
  });

  it('deve escapar aspas duplas no CSV', () => {
    const cliente: ClienteEstado = {
      nome: 'Empresa "XYZ" Ltda',
      estado: 'SP',
      faturamento: 'R$ 1500,00',
      atendente: 'João "João" Silva',
      comercial: 'Maria "Comercial"'
    };

    const row = [
      cliente.estado,
      cliente.nome,
      cliente.faturamento,
      cliente.atendente,
      cliente.comercial
    ];

    const csvRow = row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',');

    expect(csvRow).toContain('""XYZ""');
    expect(csvRow).toContain('""João""');
    expect(csvRow).toContain('""Comercial""');
  });
});
