import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(
  new URL("../client/src/components/NewClientsAlert.tsx", import.meta.url),
  "utf8"
);
const routerSource = readFileSync(
  new URL("./routers.ts", import.meta.url),
  "utf8"
);
const schemaSource = readFileSync(
  new URL("../drizzle/schema.ts", import.meta.url),
  "utf8"
);

describe("aviso de novos clientes", () => {
  it("mostra os nomes e exige checkbox antes de confirmar", () => {
    expect(componentSource).toContain("Novo cliente no Kanban");
    expect(componentSource).toContain("client.companyName");
    expect(componentSource).toContain("Estou ciente dos novos clientes");
    expect(componentSource).toContain("disabled={!isCiente || acknowledge.isPending}");
  });

  it("consulta pendências e registra ciência por usuário e card", () => {
    expect(componentSource).toContain("pendingNewClients.useQuery");
    expect(componentSource).toContain("acknowledgeNewClients.useMutation");
    expect(routerSource).toContain("pendingNewClients: protectedProcedure");
    expect(routerSource).toContain("acknowledgeNewClients: protectedProcedure");
    expect(schemaSource).toContain("app_kanban_new_client_ack");
    expect(schemaSource).toContain("table.userId");
    expect(schemaSource).toContain("table.cardId");
  });
});
