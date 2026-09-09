import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const clientCardSource = readFileSync(
  resolve(process.cwd(), "client/src/components/ClientCard.tsx"),
  "utf8"
);
const modalSource = readFileSync(
  resolve(process.cwd(), "client/src/components/FriccaoModal.tsx"),
  "utf8"
);
const homeSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8"
);

describe("interface de lançamento de acontecimento", () => {
  it("substitui o botão Dashboard por uma bandeira vermelha", () => {
    expect(clientCardSource).toContain('title="Registrar acontecimento"');
    expect(clientCardSource).toContain('backgroundColor: "#DC2626"');
    expect(clientCardSource).toContain(
      '<Flag className="w-4 h-4 fill-current" />'
    );
    expect(clientCardSource).not.toContain('title="Dashboard"');
  });

  it("mantém os campos e opções solicitados no modal", () => {
    expect(modalSource).toContain("Título");
    expect(modalSource).toContain("Setor do acontecimento");
    expect(modalSource).toContain("Tag");
    expect(modalSource).toContain("Registrar acontecimento");
    expect(modalSource).toContain("Descrição");
    expect(modalSource).toContain('"CSM"');
    expect(modalSource).toContain('"Treinamento"');
    expect(modalSource).toContain('"Financeiro"');
    expect(modalSource).toContain('"Comercial"');
    expect(modalSource).toContain('"Suporte"');
    expect(modalSource).toContain('"Problema"');
    expect(modalSource).toContain('"Sugestão de desenvolvimento"');
    expect(modalSource).toContain('"Operação"');
    expect(modalSource).toContain('"Migração"');
    expect(modalSource).toContain('"Fricção"');
    expect(modalSource).toContain('"Travamento"');
  });

  it("conecta o modal ao card de Marcos e ao cliente selecionado", () => {
    expect(homeSource).toContain(
      'import FriccaoModal from "@/components/FriccaoModal"'
    );
    expect(homeSource).toContain(
      "onFriccao={client => setFriccaoClient(client)}"
    );
    expect(homeSource).toContain("client={friccaoClient}");
  });
});
