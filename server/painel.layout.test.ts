import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Layout otimizado do Painel', () => {
  const painelSource = readFileSync(resolve(process.cwd(), 'client/src/pages/Painel.tsx'), 'utf8');

  it('compacta as tabelas de cobertura semanal', () => {
    expect(painelSource).toContain('text-[10px] font-semibold text-gray-500 uppercase tracking-wide');
    expect(painelSource).toContain('py-1.5 font-semibold text-gray-800 text-xs truncate');
    expect(painelSource).toContain('text-lg leading-none');
  });

  it('substitui Marcos pelo ranking Geral ao lado de Migração', () => {
    expect(painelSource).toContain('function RankingGeralPainel');
    expect(painelSource).toContain('<TabelaMigracao />');
    expect(painelSource).toContain('<RankingGeralPainel onboarding={data.onboarding} ongoing={data.ongoing} />');
    expect(painelSource).not.toContain("<TabelaMarcos \n                dados={data.clientesPorMarco}");
  });

  it('consulta as pontuações atuais para calcular o ranking Geral', () => {
    expect(painelSource).toContain('trpc.analystScores.list.useQuery');
    expect(painelSource).toContain("title={history}");
  });
});
