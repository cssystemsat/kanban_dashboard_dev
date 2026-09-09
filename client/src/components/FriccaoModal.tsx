import { useState } from "react";
import { Flag, Loader2, ShieldX, X } from "lucide-react";
import { toast } from "sonner";
import { ClientData } from "@/hooks/useKanbanData";
import { trpc } from "@/lib/trpc";

interface FriccaoModalProps {
  client: ClientData;
  onClose: () => void;
}

const SETORES = [
  "CSM",
  "Treinamento",
  "Financeiro",
  "Comercial",
  "Suporte",
] as const;
type Setor = (typeof SETORES)[number];

const TAGS = [
  "Operação",
  "Migração",
  "Fricção",
  "Sugestão de desenvolvimento",
  "Travamento",
  "Problema",
] as const;
type Tag = (typeof TAGS)[number];

type FriccaoForm = {
  titulo: string;
  setor: "" | Setor;
  tag: "" | Tag;
  descricao: string;
};

const INITIAL_FORM: FriccaoForm = {
  titulo: "",
  setor: "",
  tag: "",
  descricao: "",
};

export default function FriccaoModal({ client, onClose }: FriccaoModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const { data: permission, isLoading: permissionLoading } =
    trpc.atendimento.checkPermission.useQuery();
  const gravar = trpc.friccao.gravar.useMutation({
    onSuccess: data => {
      toast.success(
        `Acontecimento registrado na linha ${data.row} da planilha!`
      );
      onClose();
    },
    onError: error =>
      toast.error(`Erro ao registrar acontecimento: ${error.message}`),
  });

  const handleSubmit = () => {
    if (
      !form.titulo.trim() ||
      !form.setor ||
      !form.tag ||
      !form.descricao.trim()
    ) {
      toast.warning("Preencha todos os campos antes de enviar.");
      return;
    }
    gravar.mutate({
      cliente: client.nome,
      titulo: form.titulo.trim(),
      setor: form.setor as Setor,
      tag: form.tag as Tag,
      descricao: form.descricao.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.97)",
          border: "2px solid #DC2626",
          backdropFilter: "blur(8px)",
        }}
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#DC2626" }}
            >
              <Flag className="h-4 w-4 fill-current text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "#001F3F" }}>
                Registrar acontecimento
              </h2>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {client.nome}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
            style={{ color: "#6B7280" }}
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {permissionLoading ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            <p className="text-sm text-gray-500">Verificando permissão...</p>
          </div>
        ) : !permission?.allowed || !permission.canLaunch ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <ShieldX className="h-12 w-12 text-red-400" />
            <div>
              <h3 className="mb-1 text-lg font-bold text-gray-800">
                Acesso negado
              </h3>
              <p className="text-sm text-gray-500">
                Seu usuário não tem permissão para registrar acontecimentos.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Nome da central
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700">
                {client.nome}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                value={form.titulo}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    titulo: event.target.value,
                  }))
                }
                placeholder="Digite o título do acontecimento"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Setor do acontecimento <span className="text-red-500">*</span>
              </label>
              <select
                value={form.setor}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    setor: event.target.value as FriccaoForm["setor"],
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-600"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {SETORES.map(setor => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Tag <span className="text-red-500">*</span>
              </label>
              <select
                value={form.tag}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    tag: event.target.value as FriccaoForm["tag"],
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-600"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {TAGS.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.descricao}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    descricao: event.target.value,
                  }))
                }
                placeholder="Descreva o acontecimento..."
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-600"
              />
            </div>

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={gravar.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {gravar.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Registrar acontecimento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
