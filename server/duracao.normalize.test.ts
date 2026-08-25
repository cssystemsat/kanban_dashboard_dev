import { describe, it, expect } from "vitest";

// Função de normalização (copiada do routers.ts para teste)
const normalizarDuracao = (duracao: string): string => {
  const lower = duracao.toLowerCase().trim();
  
  // Verificar se é em horas
  const horasMatch = lower.match(/(\d+)\s*(horas?|h)/);
  if (horasMatch) {
    const horas = parseInt(horasMatch[1], 10);
    return (horas * 60).toString();
  }
  
  // Verificar se é em minutos
  const minutosMatch = lower.match(/(\d+)\s*(minutos?|min)?/);
  if (minutosMatch) {
    return minutosMatch[1];
  }
  
  return '0';
};

describe("duracao.normalize", () => {
  it("should normalize '30 minutos' to '30'", () => {
    expect(normalizarDuracao("30 minutos")).toBe("30");
  });

  it("should normalize '30 minuto' to '30'", () => {
    expect(normalizarDuracao("30 minuto")).toBe("30");
  });

  it("should normalize '30 min' to '30'", () => {
    expect(normalizarDuracao("30 min")).toBe("30");
  });

  it("should normalize '30' to '30'", () => {
    expect(normalizarDuracao("30")).toBe("30");
  });

  it("should normalize '  30  minutos  ' to '30'", () => {
    expect(normalizarDuracao("  30  minutos  ")).toBe("30");
  });

  it("should normalize '1 hora' to '60' (convert to minutes)", () => {
    expect(normalizarDuracao("1 hora")).toBe("60");
  });

  it("should normalize '2 horas' to '120' (convert to minutes)", () => {
    expect(normalizarDuracao("2 horas")).toBe("120");
  });

  it("should normalize '2h' to '120' (convert to minutes)", () => {
    expect(normalizarDuracao("2h")).toBe("120");
  });

  it("should normalize '1h' to '60' (convert to minutes)", () => {
    expect(normalizarDuracao("1h")).toBe("60");
  });

  it("should normalize empty string to '0'", () => {
    expect(normalizarDuracao("")).toBe("0");
  });

  it("should normalize 'abc' (no numbers) to '0'", () => {
    expect(normalizarDuracao("abc")).toBe("0");
  });

  it("should extract first number from mixed text", () => {
    expect(normalizarDuracao("45 minutos de atendimento")).toBe("45");
  });

  it("should handle uppercase", () => {
    expect(normalizarDuracao("30 MINUTOS")).toBe("30");
  });

  it("should handle mixed case", () => {
    expect(normalizarDuracao("30 MiNuToS")).toBe("30");
  });

  it("should handle '3 HORAS' uppercase", () => {
    expect(normalizarDuracao("3 HORAS")).toBe("180");
  });
});
