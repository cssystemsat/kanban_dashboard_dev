import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { allowedEmails, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('App Personalizado - Permissões', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }
  });

  afterAll(async () => {
    // Cleanup
    if (db) {
      // Remover dados de teste
      await db.delete(allowedEmails).where(eq(allowedEmails.email, 'test-move@example.com'));
      await db.delete(allowedEmails).where(eq(allowedEmails.email, 'test-only@example.com'));
    }
  });

  it('deve criar usuário com permissão canMoveAppKanban', async () => {
    if (!db) throw new Error('Database not available');

    // Inserir usuário com permissão de mover cards
    await db.insert(allowedEmails).values({
      email: 'test-move@example.com',
      label: 'Teste Move',
      isAdmin: 0,
      canLaunch: 1,
      canMoveAppKanban: 1,
      onlyAppKanban: 0,
    });

    // Verificar se foi inserido
    const result = await db.select().from(allowedEmails).where(eq(allowedEmails.email, 'test-move@example.com'));
    expect(result).toHaveLength(1);
    expect(result[0].canMoveAppKanban).toBe(1);
    expect(result[0].onlyAppKanban).toBe(0);
  });

  it('deve criar usuário com permissão onlyAppKanban', async () => {
    if (!db) throw new Error('Database not available');

    // Inserir usuário que vê apenas App Personalizado
    await db.insert(allowedEmails).values({
      email: 'test-only@example.com',
      label: 'Teste Only',
      isAdmin: 0,
      canLaunch: 0,
      canMoveAppKanban: 0,
      onlyAppKanban: 1,
    });

    // Verificar se foi inserido
    const result = await db.select().from(allowedEmails).where(eq(allowedEmails.email, 'test-only@example.com'));
    expect(result).toHaveLength(1);
    expect(result[0].canMoveAppKanban).toBe(0);
    expect(result[0].onlyAppKanban).toBe(1);
  });

  it('deve permitir atualizar permissões de usuário', async () => {
    if (!db) throw new Error('Database not available');

    // Atualizar permissões
    await db.update(allowedEmails)
      .set({ canMoveAppKanban: 1 })
      .where(eq(allowedEmails.email, 'test-only@example.com'));

    // Verificar atualização
    const result = await db.select().from(allowedEmails).where(eq(allowedEmails.email, 'test-only@example.com'));
    expect(result[0].canMoveAppKanban).toBe(1);
  });

  it('deve validar que campos padrão são 0', async () => {
    if (!db) throw new Error('Database not available');

    // Inserir usuário sem permissões especiais
    await db.insert(allowedEmails).values({
      email: 'test-default@example.com',
      label: 'Teste Default',
      isAdmin: 0,
      canLaunch: 1,
      // canMoveAppKanban e onlyAppKanban devem usar default (0)
    });

    // Verificar defaults
    const result = await db.select().from(allowedEmails).where(eq(allowedEmails.email, 'test-default@example.com'));
    expect(result[0].canMoveAppKanban).toBe(0);
    expect(result[0].onlyAppKanban).toBe(0);

    // Cleanup
    await db.delete(allowedEmails).where(eq(allowedEmails.email, 'test-default@example.com'));
  });

  it('deve permitir combinação de canMoveAppKanban + onlyAppKanban', async () => {
    if (!db) throw new Error('Database not available');

    // Inserir usuário com ambas permissões
    await db.insert(allowedEmails).values({
      email: 'test-both@example.com',
      label: 'Teste Both',
      isAdmin: 0,
      canLaunch: 1,
      canMoveAppKanban: 1,
      onlyAppKanban: 1,
    });

    // Verificar ambas permissões
    const result = await db.select().from(allowedEmails).where(eq(allowedEmails.email, 'test-both@example.com'));
    expect(result[0].canMoveAppKanban).toBe(1);
    expect(result[0].onlyAppKanban).toBe(1);

    // Cleanup
    await db.delete(allowedEmails).where(eq(allowedEmails.email, 'test-both@example.com'));
  });
});
