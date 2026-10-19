import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Wrench,
  CheckSquare,
  Plus,
  Trash2,
  Pencil,
  LogIn,
  Loader2,
  RotateCcw,
  ShieldCheck,
  GripVertical,
  X,
  ChevronDown,
  ChevronUp,
  BellRing,
  CalendarClock,
  Image as ImageIcon,
  Code2,
} from "lucide-react";
import { toast } from "sonner";

type ChecklistItem = {
  id: number;
  checklistId: number;
  text: string;
  order: number;
  completed: boolean;
};

type ChecklistData = {
  id: number;
  ownerEmail: string;
  title: string;
  description: string | null;
  isAdminChecklist: number;
  resetType: string;
  isOwner: boolean;
  items: ChecklistItem[];
};

const resetLabel: Record<string, string> = {
  daily: "Reset diário (meia-noite)",
  manual: "Reset manual",
  none: "Sem reset",
  unique: "Única (desaparece ao marcar)",
};

// Ferramentas disponíveis
const TOOLS = [
  {
    id: "checklists",
    label: "Checklists",
    icon: CheckSquare,
    description: "Gerencie suas listas de tarefas diárias",
  },
  {
    id: "notices",
    label: "Central de Avisos",
    icon: BellRing,
    description: "Crie avisos agendados para os usuários do sistema",
    adminOnly: true,
  },
  {
    id: "api",
    label: "Documentação da API",
    icon: Code2,
    description: "Consulte a API e crie tokens para integrações",
    adminOnly: true,
  },
];

export default function Ferramentas() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();
  const { data: permission } = trpc.atendimento.checkPermission.useQuery();

  if (authLoading) {
    return (
      <div
        className="min-h-screen md:ml-20 flex items-center justify-center"
        style={{ backgroundColor: "#F5F7FA" }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen md:ml-20 flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "#F5F7FA" }}
      >
        <ShieldCheck className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-700">Acesso restrito</h2>
        <p className="text-gray-500 text-sm">
          Você precisa estar autenticado para acessar as ferramentas.
        </p>
        <Button
          onClick={() => (window.location.href = getLoginUrl())}
          className="gap-2"
        >
          <LogIn className="w-4 h-4" />
          Entrar com Google
        </Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen md:ml-20"
      style={{ backgroundColor: "#F5F7FA" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b px-4 py-2 flex items-center gap-3"
        style={{ backgroundColor: "#001F3F", borderColor: "#1a3a5c" }}
      >
        <Wrench className="w-5 h-5 text-green-400" />
        <h1 className="text-lg font-bold text-white">Ferramentas</h1>
        {activeTool && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-300">
              {TOOLS.find(t => t.id === activeTool)?.label}
            </span>
            <button
              onClick={() => setActiveTool(null)}
              className="ml-auto p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </header>

      <main className="p-4">
        {!activeTool ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.filter(tool => !tool.adminOnly || permission?.isAdmin).map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow text-left"
                  style={{ borderColor: "#E0E8F0" }}
                >
                  <Icon className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-800">{tool.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {tool.description}
                  </p>
                </button>
              );
            })}
          </div>
        ) : activeTool === "checklists" ? (
          <ChecklistsPage />
        ) : activeTool === "notices" && permission?.isAdmin ? (
          <AdminNoticesPage />
        ) : activeTool === "api" && permission?.isAdmin ? (
          <ApiDocumentationPage />
        ) : null}
      </main>
    </div>
  );
}

function ChecklistsPage() {
  const { data: checklists, isLoading } = trpc.checklists.list.useQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] =
    useState<ChecklistData | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const toggleItemMutation = trpc.checklists.toggleItem.useMutation({
    onSuccess: () => utils.checklists.list.invalidate(),
    onError: e => toast("Erro: " + e.message),
  });

  const deleteChecklistMutation = trpc.checklists.delete.useMutation({
    onSuccess: () => {
      utils.checklists.list.invalidate();
      toast("Checklist removido.");
    },
    onError: e => toast("Erro: " + e.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Meus Checklists</h2>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Checklist
        </Button>
      </div>

      <div className="space-y-3">
        {checklists && checklists.length > 0 ? (
          checklists.map(checklist => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              expanded={expandedId === checklist.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === checklist.id ? null : checklist.id)
              }
              onToggleItem={(itemId, completed) =>
                toggleItemMutation.mutate({ itemId, completed })
              }
              onEdit={() => setEditingChecklist(checklist)}
              onDelete={() =>
                deleteChecklistMutation.mutate({ id: checklist.id })
              }
              isDeleting={deleteChecklistMutation.isPending}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            Nenhum checklist criado ainda.
          </p>
        )}
      </div>

      <CreateChecklistDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => setCreateOpen(false)}
      />
      {editingChecklist && (
        <EditChecklistDialog
          checklist={editingChecklist}
          onClose={() => setEditingChecklist(null)}
          onUpdated={() => setEditingChecklist(null)}
        />
      )}
    </div>
  );
}

function ChecklistCard({
  checklist,
  expanded,
  onToggleExpand,
  onToggleItem,
  onEdit,
  onDelete,
  isDeleting,
}: {
  checklist: ChecklistData;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleItem: (itemId: number, completed: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting: boolean;
}) {
  const completedCount = checklist.items.filter(i => i.completed).length;
  const total = checklist.items.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const resetLabelMap: Record<string, string> = {
    daily: "Reset diário",
    manual: "Reset manual",
    none: "Sem reset",
    unique: "Única (desaparece ao marcar)",
  };

  return (
    <div
      className="bg-white rounded-xl border shadow-sm overflow-hidden"
      style={{ borderColor: "#E0E8F0" }}
    >
      {/* Header do card */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">
              {checklist.title}
            </span>
            {checklist.isAdminChecklist === 1 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                Equipe
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 text-gray-400"
            >
              {resetLabelMap[checklist.resetType] ?? checklist.resetType}
            </Badge>
          </div>
          {checklist.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {checklist.description}
            </p>
          )}
        </div>

        {/* Progresso e Dias */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">
            {completedCount}/{total}
          </span>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? "#22C55E" : "#3B82F6",
              }}
            />
          </div>
          {onEdit && (
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Itens */}
      {expanded && (
        <div
          className="border-t px-4 py-2 space-y-1"
          style={{ borderColor: "#F0F4F8" }}
        >
          {checklist.items.length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center">
              Nenhum item ainda.
            </p>
          ) : (
            checklist.items
              .filter(item => {
                if (checklist.resetType === "unique" && item.completed) {
                  return false;
                }
                return true;
              })
              .map(item => {
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 py-1.5 px-1 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={e => onToggleItem(item.id, e.target.checked)}
                        className="w-4 h-4 rounded accent-blue-600 mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm block ${item.completed ? "line-through text-gray-400" : "text-gray-700"}`}
                        >
                          {item.text}
                        </span>
                      </div>
                    </label>
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
}

// ---- Dialog Criar Checklist ----
function CreateChecklistDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resetType, setResetType] = useState<
    "daily" | "manual" | "none" | "unique"
  >("daily");
  const [isAdminChecklist, setIsAdminChecklist] = useState(false);
  const [items, setItems] = useState<string[]>([""]);

  const { data: permission } = trpc.atendimento.checkPermission.useQuery();
  const isAdmin = permission?.isAdmin === true;

  const createMutation = trpc.checklists.create.useMutation({
    onSuccess: () => {
      toast("Checklist criado com sucesso!");
      setTitle("");
      setDescription("");
      setResetType("daily");
      setIsAdminChecklist(false);
      setItems([""]);
      onCreated();
    },
    onError: e => toast("Erro: " + e.message),
  });

  const addItemField = () => setItems(prev => [...prev, ""]);
  const removeItemField = (idx: number) =>
    setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, val: string) =>
    setItems(prev => prev.map((v, i) => (i === idx ? val : v)));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Checklist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Título *
            </label>
            <Input
              placeholder="Ex: Rotina diária"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Descrição (opcional)
            </label>
            <Input
              placeholder="Descrição do checklist"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Tipo de reset
            </label>
            <select
              value={resetType}
              onChange={e =>
                setResetType(
                  e.target.value as "daily" | "manual" | "none" | "unique"
                )
              }
              className="w-full text-sm rounded-lg px-3 py-2 border outline-none"
              style={{ borderColor: "#D1D5DB", backgroundColor: "#FAFAFA" }}
            >
              <option value="daily">Reset diário (meia-noite)</option>
              <option value="manual">Reset manual</option>
              <option value="none">Sem reset</option>
              <option value="unique">Única (desaparece ao marcar)</option>
            </select>
          </div>
          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdminChecklist}
                onChange={e => setIsAdminChecklist(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">
                Checklist da equipe (visível para todos)
              </span>
            </label>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Itens</label>
              <button
                onClick={addItemField}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Adicionar item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                    <Input
                      placeholder={`Item ${idx + 1}`}
                      value={item}
                      onChange={e => updateItem(idx, e.target.value)}
                      className="flex-1"
                    />
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItemField(idx)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              createMutation.mutate({
                title,
                description: description || undefined,
                resetType,
                isAdminChecklist,
                items: items.filter(i => i.trim()),
              })
            }
            disabled={!title.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Dialog Editar Checklist ----
function EditChecklistDialog({
  checklist,
  onClose,
  onUpdated,
}: {
  checklist: ChecklistData;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(checklist.title);
  const [description, setDescription] = useState(checklist.description ?? "");
  const [resetType, setResetType] = useState<
    "daily" | "manual" | "none" | "unique"
  >(checklist.resetType as "daily" | "manual" | "none" | "unique");
  const [newItemText, setNewItemText] = useState("");

  const { data: permission } = trpc.atendimento.checkPermission.useQuery();
  const isAdmin = permission?.isAdmin === true;
  const [isAdminChecklist, setIsAdminChecklist] = useState(
    checklist.isAdminChecklist === 1
  );

  const updateMutation = trpc.checklists.update.useMutation({
    onSuccess: () => {
      toast("Checklist atualizado!");
      onUpdated();
    },
    onError: e => toast("Erro: " + e.message),
  });

  const addItemMutation = trpc.checklists.addItem.useMutation({
    onSuccess: () => {
      utils.checklists.list.invalidate();
      setNewItemText("");
      toast("Item adicionado!");
    },
    onError: e => toast("Erro: " + e.message),
  });

  const deleteItemMutation = trpc.checklists.deleteItem.useMutation({
    onSuccess: () => {
      utils.checklists.list.invalidate();
      toast("Item removido.");
    },
    onError: e => toast("Erro: " + e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Checklist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Título *
            </label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Descrição
            </label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Tipo de reset
            </label>
            <select
              value={resetType}
              onChange={e =>
                setResetType(
                  e.target.value as "daily" | "manual" | "none" | "unique"
                )
              }
              className="w-full text-sm rounded-lg px-3 py-2 border outline-none"
              style={{ borderColor: "#D1D5DB", backgroundColor: "#FAFAFA" }}
            >
              <option value="daily">Reset diário (meia-noite)</option>
              <option value="manual">Reset manual</option>
              <option value="none">Sem reset</option>
              <option value="unique">Única (desaparece ao marcar)</option>
            </select>
          </div>
          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdminChecklist}
                onChange={e => setIsAdminChecklist(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">
                Checklist da equipe (visível para todos)
              </span>
            </label>
          )}

          {/* Itens existentes */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Itens do checklist
            </label>
            <div className="space-y-1.5 mb-3">
              {checklist.items.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum item ainda.</p>
              ) : (
                checklist.items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-700 block">
                        {item.text}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteItemMutation.mutate({ id: item.id })}
                      disabled={deleteItemMutation.isPending}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {/* Adicionar novo item */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Novo item..."
                  value={newItemText}
                  onChange={e => setNewItemText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && newItemText.trim()) {
                      addItemMutation.mutate({
                        checklistId: checklist.id,
                        text: newItemText.trim(),
                        order: checklist.items.length,
                      });
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    newItemText.trim() &&
                    addItemMutation.mutate({
                      checklistId: checklist.id,
                      text: newItemText.trim(),
                      order: checklist.items.length,
                    })
                  }
                  disabled={!newItemText.trim() || addItemMutation.isPending}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            onClick={() =>
              updateMutation.mutate({
                id: checklist.id,
                title,
                description: description || undefined,
                resetType,
                isAdminChecklist,
              })
            }
            disabled={!title.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


const NOTICE_WEEKDAYS = [
  [1, "Segunda"],
  [2, "Terça"],
  [3, "Quarta"],
  [4, "Quinta"],
  [5, "Sexta"],
  [6, "Sábado"],
  [0, "Domingo"],
] as const;

function parseNoticeList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function AdminNoticesPage() {
  const { data: notices, isLoading } = trpc.notices.list.useQuery();
  const { data: recipients } = trpc.notices.recipients.useQuery();
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduleType, setScheduleType] = useState<"unique" | "periodic">("unique");
  const [immediate, setImmediate] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timesOfDay, setTimesOfDay] = useState<string[]>(["09:00"]);
  const [recipientMode, setRecipientMode] = useState<"all" | "selected">("all");
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [imageData, setImageData] = useState<string | null>(null);

  const createMutation = trpc.notices.create.useMutation({
    onSuccess: async () => {
      toast("Aviso criado com sucesso!");
      setTitle("");
      setMessage("");
      setScheduleType("unique");
      setImmediate(true);
      setStartDate("");
      setStartTime("09:00");
      setRecipientMode("all");
      setRecipientEmails([]);
      setImageData(null);
      await utils.notices.list.invalidate();
    },
    onError: error => toast("Erro: " + error.message),
  });
  const deactivateMutation = trpc.notices.deactivate.useMutation({
    onSuccess: async () => {
      toast("Aviso desativado.");
      await utils.notices.list.invalidate();
    },
    onError: error => toast("Erro: " + error.message),
  });

  const toggleDay = (day: number) =>
    setDaysOfWeek(current =>
      current.includes(day)
        ? current.filter(value => value !== day)
        : [...current, day]
    );
  const updateRecipient = (email: string) =>
    setRecipientEmails(current =>
      current.includes(email)
        ? current.filter(value => value !== email)
        : [...current, email]
    );

  const handleImageChange = (file: File | undefined) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      toast("Use uma imagem PNG, JPEG, WebP ou GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("A imagem deve ter no máximo 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageData(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    createMutation.mutate({
      title,
      message,
      scheduleType,
      startDate: startDate || null,
      startTime: startTime || null,
      immediate: scheduleType === "unique" && immediate,
      daysOfWeek,
      timesOfDay,
      recipientMode,
      recipientEmails,
      imageData,
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <BellRing className="h-5 w-5 text-amber-600" /> Central de Avisos
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Crie comunicados importantes com agenda e destinatários personalizados.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E0E8F0" }}>
          <h3 className="mb-4 font-semibold text-gray-800">Criar aviso</h3>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Título
              <Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: Reunião geral hoje" className="mt-1" />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Mensagem
              <textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="Digite o aviso que os usuários deverão ler" className="mt-1 min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </label>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Imagem (opcional)</p>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                <ImageIcon className="h-4 w-4" />
                <span>{imageData ? "Trocar imagem" : "Selecionar imagem"}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={event => handleImageChange(event.target.files?.[0])} />
              </label>
              {imageData && (
                <div className="relative mt-2 w-fit">
                  <img src={imageData} alt="Pré-visualização do aviso" className="max-h-40 max-w-full rounded-lg border object-contain" />
                  <button type="button" onClick={() => setImageData(null)} className="absolute -right-2 -top-2 rounded-full bg-white px-2 py-1 text-xs font-bold text-red-600 shadow" aria-label="Remover imagem">×</button>
                </div>
              )}
              <p className="mt-1 text-xs text-slate-400">PNG, JPEG, WebP ou GIF até 5 MB.</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Quando aparecer</p>
              <div className="flex gap-2">
                {(["unique", "periodic"] as const).map(type => (
                  <button key={type} type="button" onClick={() => setScheduleType(type)} className={`rounded-md border px-3 py-2 text-sm font-medium ${scheduleType === type ? "border-amber-500 bg-amber-50 text-amber-800" : "border-gray-200 text-gray-600"}`}>
                    {type === "unique" ? "Único" : "Periódico"}
                  </button>
                ))}
              </div>
            </div>

            {scheduleType === "unique" ? (
              <div className="space-y-3 rounded-lg bg-slate-50 p-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={immediate} onChange={event => setImmediate(event.target.checked)} className="h-4 w-4 accent-amber-600" />
                  Mostrar imediatamente
                </label>
                {!immediate && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-medium text-gray-600">Dia<input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className="mt-1 block w-full rounded-md border px-2 py-2 text-sm" /></label>
                    <label className="text-xs font-medium text-gray-600">Horário<input type="time" value={startTime} onChange={event => setStartTime(event.target.value)} className="mt-1 block w-full rounded-md border px-2 py-2 text-sm" /></label>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-gray-600">Dias da semana</p>
                <div className="flex flex-wrap gap-2">
                  {NOTICE_WEEKDAYS.map(([day, label]) => (
                    <label key={day} className="flex items-center gap-1.5 rounded border bg-white px-2 py-1.5 text-xs text-gray-700">
                      <input type="checkbox" checked={daysOfWeek.includes(day)} onChange={() => toggleDay(day)} className="h-3.5 w-3.5 accent-amber-600" />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="text-xs font-medium text-gray-600">Horários</p>
                {timesOfDay.map((time, index) => (
                  <div key={`${time}-${index}`} className="flex items-center gap-2">
                    <input type="time" value={time} onChange={event => setTimesOfDay(current => current.map((value, i) => i === index ? event.target.value : value))} className="rounded-md border px-2 py-2 text-sm" />
                    {timesOfDay.length > 1 && <button type="button" onClick={() => setTimesOfDay(current => current.filter((_, i) => i !== index))} className="text-xs text-red-600">Remover</button>}
                  </div>
                ))}
                <button type="button" onClick={() => setTimesOfDay(current => [...current, "14:00"])} className="text-xs font-semibold text-blue-700">+ Adicionar horário</button>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Quem receberá</p>
              <div className="flex gap-2">
                {(["all", "selected"] as const).map(mode => (
                  <button key={mode} type="button" onClick={() => setRecipientMode(mode)} className={`rounded-md border px-3 py-2 text-sm font-medium ${recipientMode === mode ? "border-blue-500 bg-blue-50 text-blue-800" : "border-gray-200 text-gray-600"}`}>
                    {mode === "all" ? "Todos os usuários" : "Selecionar usuários"}
                  </button>
                ))}
              </div>
              {recipientMode === "selected" && (
                <div className="mt-2 max-h-36 space-y-1 overflow-y-auto rounded-lg border p-2">
                  {(recipients ?? []).filter(recipient => recipient.email).map(recipient => (
                    <label key={recipient.id} className="flex items-center gap-2 px-1 py-1 text-xs text-gray-700">
                      <input type="checkbox" checked={recipientEmails.includes(recipient.email ?? "")} onChange={() => updateRecipient(recipient.email ?? "")} className="h-3.5 w-3.5 accent-blue-600" />
                      <span>{recipient.name || recipient.email}</span><span className="text-gray-400">({recipient.email})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Button type="button" onClick={submit} disabled={createMutation.isPending || !title.trim() || !message.trim()} className="w-full gap-2 bg-[#001F3F] text-white hover:bg-[#0b3157]">
              <CalendarClock className="h-4 w-4" />
              {createMutation.isPending ? "Criando..." : "Criar aviso"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Avisos cadastrados</h3>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : (notices ?? []).length === 0 ? <div className="rounded-xl border bg-white p-5 text-sm text-gray-500">Nenhum aviso cadastrado.</div> : (notices ?? []).map(notice => {
            const days = parseNoticeList(notice.daysOfWeek);
            const times = parseNoticeList(notice.timesOfDay);
            return <div key={notice.id} className={`rounded-xl border bg-white p-4 shadow-sm ${notice.isActive ? "border-amber-200" : "border-gray-200 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-gray-800">{notice.title}</p>{notice.imageUrl && <img src={notice.imageUrl} alt="Imagem do aviso" className="mt-2 max-h-28 max-w-full rounded-md object-contain" />}<p className="mt-1 whitespace-pre-wrap text-xs text-gray-500">{notice.message}</p></div><Badge variant="outline">{notice.isActive ? "Ativo" : "Desativado"}</Badge></div>
              <p className="mt-3 text-[11px] text-gray-500">{notice.scheduleType === "unique" ? (notice.immediate ? "Imediato" : `${notice.startDate} às ${notice.startTime}`) : `Dias: ${days.join(", ")} · Horários: ${times.join(", ")}`} · {notice.recipientMode === "all" ? "Todos os usuários" : `${parseNoticeList(notice.recipientEmails).length} selecionado(s)`}</p>
              {notice.isActive && <button type="button" onClick={() => deactivateMutation.mutate({ id: notice.id })} className="mt-3 text-xs font-semibold text-red-600">Desativar aviso</button>}
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}


function ApiDocumentationPage() {
  const { data: users, isLoading: isLoadingUsers } = trpc.apiTokens.listUsers.useQuery();
  const { data: tokens, isLoading: isLoadingTokens } = trpc.apiTokens.list.useQuery();
  const utils = trpc.useUtils();
  const [userEmail, setUserEmail] = useState("");
  const [label, setLabel] = useState("");
  const [createdToken, setCreatedToken] = useState<{
    id: number;
    token: string;
    tokenPrefix: string;
  } | null>(null);

  const createMutation = trpc.apiTokens.create.useMutation({
    onSuccess: async result => {
      setCreatedToken(result);
      setLabel("");
      await utils.apiTokens.list.invalidate();
      toast("Token criado. Copie-o agora: ele não será exibido novamente.");
    },
    onError: error => toast("Erro ao criar token: " + error.message),
  });
  const revokeMutation = trpc.apiTokens.revoke.useMutation({
    onSuccess: async () => {
      await utils.apiTokens.list.invalidate();
      toast("Token revogado.");
    },
    onError: error => toast("Erro ao revogar token: " + error.message),
  });

  const copyToken = async () => {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken.token);
    toast("Token copiado para a área de transferência.");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <Code2 className="h-5 w-5 text-blue-700" /> Documentação da API
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">
          Área administrativa para preparar integrações com o painel. Nesta primeira etapa,
          você pode provisionar tokens individuais para usuários autorizados.
        </p>
      </div>

      {createdToken && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-emerald-900">Token criado com sucesso</p>
              <p className="mt-1 text-sm text-emerald-800">
                Este é o único momento em que o valor completo aparece. Armazene-o em um local seguro.
              </p>
            </div>
            <button type="button" onClick={() => setCreatedToken(null)} className="text-xs font-semibold text-emerald-700 hover:text-emerald-950">
              Ocultar
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-emerald-950">
              {createdToken.token}
            </code>
            <Button type="button" onClick={copyToken} className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800">
              Copiar token
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
        <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E0E8F0" }}>
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <h3 className="font-semibold text-gray-800">Criar token para um usuário</h3>
              <p className="mt-1 text-xs leading-5 text-gray-500">Somente usuários que já estão na lista de permissões podem receber tokens.</p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Usuário autorizado
              <select
                value={userEmail}
                onChange={event => setUserEmail(event.target.value)}
                disabled={isLoadingUsers}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{isLoadingUsers ? "Carregando usuários..." : "Selecione um usuário"}</option>
                {(users ?? []).map(user => (
                  <option key={user.email} value={user.email}>
                    {user.label ? `${user.label} — ${user.email}` : user.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Nome do token
              <Input value={label} onChange={event => setLabel(event.target.value)} placeholder="Ex.: Integração financeira" className="mt-1" maxLength={120} />
            </label>
            <Button
              type="button"
              onClick={() => createMutation.mutate({ userEmail, label: label.trim() })}
              disabled={createMutation.isPending || !userEmail || !label.trim()}
              className="w-full gap-2 bg-[#001F3F] text-white hover:bg-[#0b3157]"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Code2 className="h-4 w-4" />}
              {createMutation.isPending ? "Gerando token..." : "Gerar token"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-slate-50 p-5" style={{ borderColor: "#E0E8F0" }}>
          <h3 className="font-semibold text-gray-800">Como o token será usado</h3>
          <div className="mt-3 space-y-3 text-sm text-gray-600">
            <p>Na próxima etapa, cada endpoint poderá exigir o cabeçalho:</p>
            <pre className="overflow-x-auto rounded-lg bg-[#071b33] p-3 text-xs text-cyan-200"><code>Authorization: Bearer SEU_TOKEN</code></pre>
            <p className="text-xs leading-5 text-gray-500">Os endpoints de leitura e escrita ainda serão construídos. Por segurança, o valor completo não fica salvo no banco e não pode ser recuperado depois.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "#E0E8F0" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-800">Tokens provisionados</h3>
            <p className="mt-1 text-xs text-gray-500">Revogue imediatamente tokens que não devem mais ser utilizados.</p>
          </div>
          <Badge variant="outline">{tokens?.length ?? 0}</Badge>
        </div>
        <div className="mt-4 overflow-x-auto">
          {isLoadingTokens ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : (tokens ?? []).length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-gray-500">Nenhum token criado.</p>
          ) : (
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-gray-400">
                <tr><th className="px-3 py-2">Usuário</th><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Prefixo</th><th className="px-3 py-2">Criado em</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr>
              </thead>
              <tbody>
                {(tokens ?? []).map(token => {
                  const revoked = Boolean(token.revokedAt);
                  return (
                    <tr key={token.id} className="border-b last:border-0">
                      <td className="px-3 py-3 text-gray-700">{token.userEmail}</td>
                      <td className="px-3 py-3 text-gray-700">{token.label}</td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-500">{token.tokenPrefix}...</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{new Date(token.createdAt).toLocaleString("pt-BR")}</td>
                      <td className="px-3 py-3"><Badge variant="outline" className={revoked ? "text-gray-400" : "border-emerald-200 text-emerald-700"}>{revoked ? "Revogado" : "Ativo"}</Badge></td>
                      <td className="px-3 py-3 text-right">{!revoked && <button type="button" onClick={() => revokeMutation.mutate({ id: token.id })} disabled={revokeMutation.isPending} className="text-xs font-semibold text-red-600 hover:text-red-800">Revogar</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
