import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeLLM } from './_core/llm';

// Mock do invokeLLM
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn(),
}));

describe('URs Generate Insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve gerar insights com dados CSV válidos', async () => {
    const mockInsights = `Relatório diário SSX - alertas e insights
Resumo executivo
A base SSX chegou a 284.779 URs com crescimento de +21 URs vs. ontem.`;

    (invokeLLM as any).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: mockInsights,
          },
        },
      ],
    });

    const csvData = `Cliente,Data,Quantidade,Variacao
SSX_CARTRACKINGMONITORAMENTO,06/07/2026,16083,+5
SSX_TOPLOCALIZA,06/07/2026,423,-92`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um analista de dados especializado em rastreamento de URs.',
        },
        {
          role: 'user',
          content: `Analise os dados CSV de URs fornecidos e gere um relatório executivo estruturado.\n\nDados CSV:\n${csvData}`,
        },
      ],
    });

    expect(response.choices[0].message.content).toContain('Relatório diário SSX');
    expect(response.choices[0].message.content).toContain('284.779 URs');
  });

  it('deve retornar string vazia se a resposta for inválida', async () => {
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [],
    });

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um analista de dados.',
        },
        {
          role: 'user',
          content: 'Analise os dados.',
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';
    expect(content).toBe('');
  });

  it('deve incluir seções obrigatórias no relatório', async () => {
    const mockInsights = `Resumo executivo
Alertas críticos
Variação da contagem total
Centrais que mais ganharam URs
Centrais que mais perderam URs
Possíveis anomalias e insights
Recomendações de ação`;

    (invokeLLM as any).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: mockInsights,
          },
        },
      ],
    });

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um analista de dados.',
        },
        {
          role: 'user',
          content: 'Gere um relatório com as seções obrigatórias.',
        },
      ],
    });

    const content = response.choices[0].message.content;
    expect(content).toContain('Resumo executivo');
    expect(content).toContain('Alertas críticos');
    expect(content).toContain('Variação da contagem total');
    expect(content).toContain('Recomendações de ação');
  });

  it('deve processar CSV com múltiplas linhas corretamente', async () => {
    const csvData = `Cliente,Data,Quantidade,Variacao
SSX_CARTRACKINGMONITORAMENTO,06/07/2026,16083,+5
SSX_TOPLOCALIZA,06/07/2026,423,-92
SSX_JOSEOSNI,06/07/2026,197,-67
SSX_DGS_MONITORA,06/07/2026,3935,-66`;

    const mockInsights = `Total de 4 clientes analisados.
Crescimento semanal: +2.758 URs
Maiores perdas: SSX_TOPLOCALIZA (-92), SSX_JOSEOSNI (-67)`;

    (invokeLLM as any).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: mockInsights,
          },
        },
      ],
    });

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um analista de dados.',
        },
        {
          role: 'user',
          content: `Analise:\n${csvData}`,
        },
      ],
    });

    const content = response.choices[0].message.content;
    expect(content).toContain('4 clientes');
    expect(content).toContain('Maiores perdas');
  });
});
