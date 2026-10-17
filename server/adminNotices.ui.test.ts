import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const toolsSource = readFileSync(resolve(process.cwd(), "client/src/pages/Ferramentas.tsx"), "utf8");
const promptSource = readFileSync(resolve(process.cwd(), "client/src/components/AdminNoticePrompt.tsx"), "utf8");
const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

describe("Central de Avisos — contrato de interface", () => {
  it("mantém a ferramenta exclusiva para administradores", () => {
    expect(toolsSource).toContain('id: "notices"');
    expect(toolsSource).toContain("adminOnly: true");
    expect(toolsSource).toContain("permission?.isAdmin");
    expect(routerSource).toContain("await assertAdmin(ctx)");
  });

  it("oferece aviso único imediato ou agendado e aviso periódico", () => {
    expect(toolsSource).toContain('"unique", "periodic"');
    expect(toolsSource).toContain("Mostrar imediatamente");
    expect(toolsSource).toContain("Dias da semana");
    expect(toolsSource).toContain("+ Adicionar horário");
  });

  it("entrega o modal bloqueante e registra ciência individual", () => {
    expect(appSource).toContain("<AdminNoticePrompt />");
    expect(promptSource).toContain('role="dialog"');
    expect(promptSource).toContain("Estou ciente deste aviso");
    expect(promptSource).toContain("trpc.notices.acknowledge.useMutation");
    expect(routerSource).toContain("occurrenceKey");
  });

  it("permite imagem opcional com pré-visualização e validação no backend", () => {
    expect(toolsSource).toContain('accept="image/png,image/jpeg,image/webp,image/gif"');
    expect(toolsSource).toContain("Pré-visualização do aviso");
    expect(promptSource).toContain('alt="Imagem do aviso"');
    expect(routerSource).toContain("decodeNoticeImage");
    expect(routerSource).toContain("5 * 1024 * 1024");
    expect(routerSource).toContain("storagePut");
    expect(routerSource).toContain("imageUrl: notice.imageUrl");
  });
});
