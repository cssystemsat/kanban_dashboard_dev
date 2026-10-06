import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Marcos — objetivos do cliente", () => {
  const clientCard = readFileSync(
    resolve(process.cwd(), "client/src/components/ClientCard.tsx"),
    "utf8"
  );
  const kanbanData = readFileSync(
    resolve(process.cwd(), "client/src/hooks/useKanbanData.ts"),
    "utf8"
  );
  const routers = readFileSync(
    resolve(process.cwd(), "server/routers.ts"),
    "utf8"
  );
  const schema = readFileSync(
    resolve(process.cwd(), "drizzle/schema.ts"),
    "utf8"
  );

  it("substitui o botão de grupo por uma seta que abre os objetivos", () => {
    expect(clientCard).toContain("Ver objetivos do cliente");
    expect(clientCard).toContain("setShowObjectives(value => !value)");
    expect(clientCard).toContain("getGlobalObjectiveDefinition(tag)");
    expect(clientCard).not.toContain('title="Abrir grupo do WhatsApp"');
  });

  it("mostra objetivos globais e subobjetivos com checkbox compartilhado", () => {
    expect(clientCard).toContain('width: "min(42rem, calc(100vw - 2rem))"');
    expect(clientCard).toContain("fixed left-1/2 top-1/2");
    expect(clientCard).toContain("max-h-[calc(100vh-2rem)]");
    expect(clientCard).toContain("createPortal");
    expect(clientCard).toContain('type="checkbox"');
    expect(clientCard).toContain("accent-emerald-600");
    expect(clientCard).toContain("line-through");
    expect(clientCard).toContain("trpc.marcos.subobjectiveCompletions.useQuery");
    expect(clientCard).toContain("trpc.marcos.setSubobjectiveCompletion.useMutation");
    expect(clientCard).toContain("subobjectiveCompletionMetrics.invalidate");
    expect(clientCard).toContain("isGlobalObjectiveComplete");
    expect(clientCard).toContain("O global conclui quando todos os subobjetivos");
    expect(clientCard).toContain("Data da conclusão");
    expect(clientCard).toContain('type="date"');
    expect(clientCard).toContain("completedAt,");
    expect(clientCard).not.toContain("localStorage");
  });

  it("lê os objetivos da coluna AA", () => {
    expect(kanbanData).toContain("const tagsIdx = 26; // Coluna AA");
    expect(kanbanData).toContain("tagsRaw");
  });

  it("usa o ID Central estável em vez do índice da linha", () => {
    expect(kanbanData).toContain("buildStableClientId");
    expect(kanbanData).toContain("central:${central}");
    expect(kanbanData).not.toContain('id: `${nome}-${i}`');
  });

  it("persiste a conclusão no backend compartilhado", () => {
    expect(routers).toContain("subobjectiveCompletions: protectedProcedure");
    expect(routers).toContain("setSubobjectiveCompletion: protectedProcedure");
    expect(routers).toContain("setClientSubobjectiveCompletion(");
    expect(routers).toContain("subobjectiveCompletionMetrics: protectedProcedure");
    expect(routers).toContain("completedAt: z");
    expect(schema).toContain('completedAt: timestamp("completedAt")');
    expect(schema).toContain("client_subobjective_completions");
  });
});
