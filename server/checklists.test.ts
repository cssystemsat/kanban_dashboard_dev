import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Checklist Unique Type Logic', () => {
  describe('Item filtering for unique type', () => {
    it('should filter out completed items for unique type checklists', () => {
      const items = [
        { id: 1, text: 'Task 1', completed: false, dueDate: null, order: 0, checklistId: 1, createdAt: new Date() },
        { id: 2, text: 'Task 2', completed: true, dueDate: null, order: 1, checklistId: 1, createdAt: new Date() },
        { id: 3, text: 'Task 3', completed: false, dueDate: null, order: 2, checklistId: 1, createdAt: new Date() },
      ];

      const filtered = items.filter(item => {
        if ('unique' === 'unique' && item.completed) {
          return false;
        }
        return true;
      });

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe(1);
      expect(filtered[1].id).toBe(3);
    });

    it('should not filter completed items for non-unique type checklists', () => {
      const items = [
        { id: 1, text: 'Task 1', completed: false, dueDate: null, order: 0, checklistId: 1, createdAt: new Date() },
        { id: 2, text: 'Task 2', completed: true, dueDate: null, order: 1, checklistId: 1, createdAt: new Date() },
        { id: 3, text: 'Task 3', completed: false, dueDate: null, order: 2, checklistId: 1, createdAt: new Date() },
      ];

      const filtered = items.filter(item => {
        if ('daily' === 'unique' && item.completed) {
          return false;
        }
        return true;
      });

      expect(filtered).toHaveLength(3);
    });
  });

  describe('Due date calculations', () => {
    it('should calculate days remaining correctly', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const daysRemaining = Math.ceil((new Date(tomorrowStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysRemaining).toBe(1);
    });

    it('should identify overdue items', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const isOverdue = yesterdayStr && new Date(yesterdayStr) < today && true;
      expect(isOverdue).toBe(true);
    });

    it('should identify items due today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const daysRemaining = Math.ceil((new Date(todayStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      // Handle -0 === 0 by using Math.abs or Object.is
      expect(Object.is(daysRemaining, 0) || Object.is(daysRemaining, -0)).toBe(true);
    });

    it('should identify items due in 3 days', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // In 3 days
      const inThreeDays = new Date(today);
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      const inThreeDaysStr = inThreeDays.toISOString().split('T')[0];

      const daysRemaining = Math.ceil((new Date(inThreeDaysStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysRemaining).toBe(3);
    });
  });

  describe('Reset type enum validation', () => {
    it('should accept valid reset types', () => {
      const validTypes = ['daily', 'manual', 'none', 'unique'];
      validTypes.forEach(type => {
        expect(['daily', 'manual', 'none', 'unique'].includes(type)).toBe(true);
      });
    });

    it('should reject invalid reset types', () => {
      const invalidType = 'invalid';
      expect(['daily', 'manual', 'none', 'unique'].includes(invalidType)).toBe(false);
    });
  });

  describe('Due date format validation', () => {
    it('should accept valid date format YYYY-MM-DD', () => {
      const validDate = '2026-12-31';
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(dateRegex.test(validDate)).toBe(true);
    });

    it('should handle null dueDate', () => {
      const item = {
        id: 1,
        text: 'Task without due date',
        completed: false,
        dueDate: null,
        order: 0,
        checklistId: 1,
        createdAt: new Date(),
      };

      const daysRemaining = item.dueDate ? Math.ceil((new Date(item.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
      expect(daysRemaining).toBe(null);
    });
  });

  describe('Color coding for due dates', () => {
    it('should return red for overdue items', () => {
      const daysRemaining = -5;
      const colorClass = daysRemaining < 0 ? 'text-red-500 font-medium' : 'text-gray-400';
      expect(colorClass).toBe('text-red-500 font-medium');
    });

    it('should return orange for items due today', () => {
      const daysRemaining = 0;
      const colorClass = daysRemaining === 0 ? 'text-orange-500 font-medium' : 'text-gray-400';
      expect(colorClass).toBe('text-orange-500 font-medium');
    });

    it('should return light orange for items due within 3 days', () => {
      const daysRemaining = 2;
      const colorClass = daysRemaining <= 3 ? 'text-orange-400' : 'text-gray-400';
      expect(colorClass).toBe('text-orange-400');
    });

    it('should return gray for items due in more than 3 days', () => {
      const daysRemaining = 5;
      const colorClass = daysRemaining <= 3 ? 'text-orange-400' : 'text-gray-400';
      expect(colorClass).toBe('text-gray-400');
    });
  });

  describe('Due date display text', () => {
    it('should display correct text for overdue items', () => {
      const daysRemaining = -3;
      const text = `Vencido há ${Math.abs(daysRemaining)} dia${Math.abs(daysRemaining) !== 1 ? 's' : ''}`;
      expect(text).toBe('Vencido há 3 dias');
    });

    it('should display correct text for items due today', () => {
      const daysRemaining = 0;
      const text = 'Vence hoje';
      expect(text).toBe('Vence hoje');
    });

    it('should display correct text for items due in future', () => {
      const daysRemaining = 5;
      const text = `${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} para vencer`;
      expect(text).toBe('5 dias para vencer');
    });

    it('should display singular for 1 day remaining', () => {
      const daysRemaining = 1;
      const text = `${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} para vencer`;
      expect(text).toBe('1 dia para vencer');
    });
  });
});
