import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import * as googleSheets from "./googleSheets";
import { appRouter } from "./routers";

// Mock do módulo googleSheets
vi.mock("./googleSheets", () => ({
  updateMigracao: vi.fn(),
}));

describe("migracao.atualizar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update migration with levantamentoDados", async () => {
    const mockUpdateMigracao = vi.mocked(googleSheets.updateMigracao);
    mockUpdateMigracao.mockResolvedValue({
      success: true,
      row: 5,
      sheetName: "Migração",
    });

    // Criar contexto autenticado
    const ctx = {
      user: {
        id: "user123",
        email: "test@example.com",
        name: "Test User",
      },
      session: null,
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.migracao.atualizar({
      empresa: "Test Company",
      dataInicio: "01/01/2026",
      levantamentoDados: "Levantamento concluído",
    });

    expect(result.success).toBe(true);
    expect(result.row).toBe(5);
    expect(mockUpdateMigracao).toHaveBeenCalledWith({
      empresa: "Test Company",
      dataInicio: "01/01/2026",
      levantamentoDados: "Levantamento concluído",
      envioDados: undefined,
      situacao: undefined,
    });
  });

  it("should update migration with envioDados", async () => {
    const mockUpdateMigracao = vi.mocked(googleSheets.updateMigracao);
    mockUpdateMigracao.mockResolvedValue({
      success: true,
      row: 10,
      sheetName: "Migração",
    });

    const ctx = {
      user: {
        id: "user123",
        email: "test@example.com",
        name: "Test User",
      },
      session: null,
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.migracao.atualizar({
      empresa: "Test Company",
      dataInicio: "01/01/2026",
      envioDados: "Dados enviados com sucesso",
    });

    expect(result.success).toBe(true);
    expect(result.row).toBe(10);
    expect(mockUpdateMigracao).toHaveBeenCalledWith({
      empresa: "Test Company",
      dataInicio: "01/01/2026",
      levantamentoDados: undefined,
      envioDados: "Dados enviados com sucesso",
      situacao: undefined,
    });
  });

  it("should update migration with situacao", async () => {
    const mockUpdateMigracao = vi.mocked(googleSheets.updateMigracao);
    mockUpdateMigracao.mockResolvedValue({
      success: true,
      row: 15,
      sheetName: "Migração",
    });

    const ctx = {
      user: {
        id: "user123",
        email: "test@example.com",
        name: "Test User",
      },
      session: null,
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.migracao.atualizar({
      empresa: "Test Company",
      dataInicio: "01/01/2026",
      situacao: "Finalizada",
    });

    expect(result.success).toBe(true);
    expect(result.row).toBe(15);
    expect(mockUpdateMigracao).toHaveBeenCalledWith({
      empresa: "Test Company",
      dataInicio: "01/01/2026",
      levantamentoDados: undefined,
      envioDados: undefined,
      situacao: "Finalizada",
    });
  });

  it("should reject when user is not authenticated", async () => {
    const ctx = {
      user: null,
      session: null,
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.migracao.atualizar({
        empresa: "Test Company",
        dataInicio: "01/01/2026",
        levantamentoDados: "Test",
      })
    ).rejects.toThrow("autenticado");
  });

  it("should update migration with all fields", async () => {
    const mockUpdateMigracao = vi.mocked(googleSheets.updateMigracao);
    mockUpdateMigracao.mockResolvedValue({
      success: true,
      row: 20,
      sheetName: "Migração",
    });

    const ctx = {
      user: {
        id: "user123",
        email: "test@example.com",
        name: "Test User",
      },
      session: null,
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.migracao.atualizar({
      empresa: "Test Company",
      dataInicio: "01/01/2026",
      levantamentoDados: "Levantamento concluído",
      envioDados: "Dados enviados",
      situacao: "Finalizada",
    });

    expect(result.success).toBe(true);
    expect(result.row).toBe(20);
    expect(mockUpdateMigracao).toHaveBeenCalledWith({
      empresa: "Test Company",
      dataInicio: "01/01/2026",
      levantamentoDados: "Levantamento concluído",
      envioDados: "Dados enviados",
      situacao: "Finalizada",
    });
  });
});
