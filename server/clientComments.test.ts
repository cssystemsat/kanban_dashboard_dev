import { describe, it, expect } from 'vitest';

// Testar lógica de ordenação e classificação de comentários

type ClientDelta = {
  clientName: string;
  delta: number;
  deltaPercent: number;
};

type SortMode = 'qty' | 'percent';

function sortClients(clients: ClientDelta[], sortMode: SortMode, type: 'worst' | 'best'): ClientDelta[] {
  return [...clients].sort((a, b) => {
    if (type === 'worst') {
      if (sortMode === 'qty') return a.delta - b.delta;
      return a.deltaPercent - b.deltaPercent;
    } else {
      if (sortMode === 'qty') return b.delta - a.delta;
      return b.deltaPercent - a.deltaPercent;
    }
  });
}

describe('Ordenação de clientes - Piores', () => {
  const worstClients: ClientDelta[] = [
    { clientName: 'SSX_A', delta: -10, deltaPercent: -2.5 },
    { clientName: 'SSX_B', delta: -50, deltaPercent: -1.0 },
    { clientName: 'SSX_C', delta: -5, deltaPercent: -15.0 },
    { clientName: 'SSX_D', delta: -30, deltaPercent: -0.5 },
  ];

  it('deve ordenar por quantidade (mais negativo primeiro)', () => {
    const sorted = sortClients(worstClients, 'qty', 'worst');
    expect(sorted[0].clientName).toBe('SSX_B'); // -50
    expect(sorted[1].clientName).toBe('SSX_D'); // -30
    expect(sorted[2].clientName).toBe('SSX_A'); // -10
    expect(sorted[3].clientName).toBe('SSX_C'); // -5
  });

  it('deve ordenar por percentual (mais negativo % primeiro)', () => {
    const sorted = sortClients(worstClients, 'percent', 'worst');
    expect(sorted[0].clientName).toBe('SSX_C'); // -15%
    expect(sorted[1].clientName).toBe('SSX_A'); // -2.5%
    expect(sorted[2].clientName).toBe('SSX_B'); // -1%
    expect(sorted[3].clientName).toBe('SSX_D'); // -0.5%
  });
});

describe('Ordenação de clientes - Melhores', () => {
  const bestClients: ClientDelta[] = [
    { clientName: 'SSX_X', delta: 10, deltaPercent: 5.0 },
    { clientName: 'SSX_Y', delta: 50, deltaPercent: 2.0 },
    { clientName: 'SSX_Z', delta: 5, deltaPercent: 25.0 },
    { clientName: 'SSX_W', delta: 30, deltaPercent: 8.0 },
  ];

  it('deve ordenar por quantidade (maior primeiro)', () => {
    const sorted = sortClients(bestClients, 'qty', 'best');
    expect(sorted[0].clientName).toBe('SSX_Y'); // 50
    expect(sorted[1].clientName).toBe('SSX_W'); // 30
    expect(sorted[2].clientName).toBe('SSX_X'); // 10
    expect(sorted[3].clientName).toBe('SSX_Z'); // 5
  });

  it('deve ordenar por percentual (maior % primeiro)', () => {
    const sorted = sortClients(bestClients, 'percent', 'best');
    expect(sorted[0].clientName).toBe('SSX_Z'); // 25%
    expect(sorted[1].clientName).toBe('SSX_W'); // 8%
    expect(sorted[2].clientName).toBe('SSX_X'); // 5%
    expect(sorted[3].clientName).toBe('SSX_Y'); // 2%
  });
});

describe('Lógica de comentários', () => {
  it('deve gerar monthYear no formato correto', () => {
    const now = new Date(2026, 4, 5); // Maio 2026
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(monthYear).toBe('2026-05');
  });

  it('deve converter lista de comentários em mapa', () => {
    const commentsList = [
      { id: 1, clientName: 'SSX_A', comment: 'Comentário A', monthYear: '2026-05', authorEmail: null, authorName: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, clientName: 'SSX_B', comment: 'Comentário B', monthYear: '2026-05', authorEmail: null, authorName: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    const map: Record<string, string> = {};
    for (const c of commentsList) {
      map[c.clientName] = c.comment;
    }
    expect(map['SSX_A']).toBe('Comentário A');
    expect(map['SSX_B']).toBe('Comentário B');
    expect(map['SSX_C']).toBeUndefined();
  });

  it('deve identificar clientes com comentário', () => {
    const comments: Record<string, string> = {
      'SSX_A': 'Tem comentário',
      'SSX_B': 'Outro comentário',
    };
    expect(!!comments['SSX_A']).toBe(true);
    expect(!!comments['SSX_B']).toBe(true);
    expect(!!comments['SSX_C']).toBe(false);
  });

  it('deve remover comentário do mapa corretamente', () => {
    const comments: Record<string, string> = {
      'SSX_A': 'Comentário A',
      'SSX_B': 'Comentário B',
    };
    const next = { ...comments };
    delete next['SSX_A'];
    expect(next['SSX_A']).toBeUndefined();
    expect(next['SSX_B']).toBe('Comentário B');
  });
});
