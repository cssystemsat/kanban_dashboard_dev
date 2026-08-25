import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAppKanbanCard, getAppKanbanCards, moveAppKanbanCard, getAppKanbanHistory, deleteAppKanbanCard } from './db';

describe('App Kanban', () => {
  describe('createAppKanbanCard', () => {
    it('deve criar um card com dados válidos', async () => {
      const result = await createAppKanbanCard({
        companyName: 'Empresa Teste',
        csm: 'João Silva',
        startDate: new Date('2026-06-17'),
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.companyName).toBe('Empresa Teste');
      expect(result.csm).toBe('João Silva');
      expect(result.stage).toBe('venda_feita');
    });

    it('deve criar card com stage padrão venda_feita', async () => {
      const result = await createAppKanbanCard({
        companyName: 'Empresa 2',
        csm: 'Maria',
        startDate: new Date('2026-06-17'),
      });

      expect(result.stage).toBe('venda_feita');
    });
  });

  describe('getAppKanbanCards', () => {
    it('deve retornar lista de cards', async () => {
      // Criar um card primeiro
      await createAppKanbanCard({
        companyName: 'Empresa Teste',
        csm: 'João Silva',
        startDate: new Date('2026-06-17'),
      });

      const cards = await getAppKanbanCards();
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
    });

    it('deve retornar cards com todas as propriedades', async () => {
      const cards = await getAppKanbanCards();
      
      if (cards.length > 0) {
        const card = cards[0];
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('companyName');
        expect(card).toHaveProperty('csm');
        expect(card).toHaveProperty('startDate');
        expect(card).toHaveProperty('stage');
        expect(card).toHaveProperty('order');
      }
    });
  });

  describe('moveAppKanbanCard', () => {
    it('deve mover card entre etapas', async () => {
      // Criar um card
      const card = await createAppKanbanCard({
        companyName: 'Empresa Mover',
        csm: 'Pedro',
        startDate: new Date('2026-06-17'),
      });

      // Mover para próxima etapa
      await moveAppKanbanCard(
        card.id,
        'venda_feita',
        'formulario',
        'admin',
        0
      );

      // Verificar se foi movido
      const cards = await getAppKanbanCards();
      const movedCard = cards.find(c => c.id === card.id);
      expect(movedCard?.stage).toBe('formulario');
    });

    it('deve registrar histórico ao mover card', async () => {
      const card = await createAppKanbanCard({
        companyName: 'Empresa Histórico',
        csm: 'Ana',
        startDate: new Date('2026-06-17'),
      });

      await moveAppKanbanCard(
        card.id,
        'venda_feita',
        'revisao_dados',
        'admin',
        0
      );

      const history = await getAppKanbanHistory(card.id);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].fromStage).toBe('venda_feita');
      expect(history[0].toStage).toBe('revisao_dados');
    });
  });

  describe('deleteAppKanbanCard', () => {
    it('deve deletar um card', async () => {
      const card = await createAppKanbanCard({
        companyName: 'Empresa Deletar',
        csm: 'Carlos',
        startDate: new Date('2026-06-17'),
      });

      await deleteAppKanbanCard(card.id);

      const cards = await getAppKanbanCards();
      const deletedCard = cards.find(c => c.id === card.id);
      expect(deletedCard).toBeUndefined();
    });
  });

  describe('getAppKanbanHistory', () => {
    it('deve retornar histórico de um card', async () => {
      const card = await createAppKanbanCard({
        companyName: 'Empresa Histórico 2',
        csm: 'Lucas',
        startDate: new Date('2026-06-17'),
      });

      await moveAppKanbanCard(
        card.id,
        'venda_feita',
        'desenvolvimento',
        'admin',
        0
      );

      const history = await getAppKanbanHistory(card.id);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });
});
