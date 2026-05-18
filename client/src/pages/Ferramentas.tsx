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
  { id: "checklists", label: "Checklists", icon: CheckSquare, description: "Gerencie suas listas de tarefas diárias" },
];

export default function Ferramentas() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();

  if (authLoading) {
    return (
      <div className="min-h-screen md:ml-20 flex items-center justify-center" style={{ backgroundColor: '#F5F7FA' }}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen md:ml-20 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#F5F7FA' }}>
        <ShieldCheck className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-700">Acesso restrito</h2>
        <p className="text-gray-500 text-sm">Você precisa estar autenticado para acessar as ferramentas.</p>
        <Button onClick={() => window.location.href = getLoginUrl()} className="gap-2">
          <LogIn className="w-4 h-4" />
          Entrar com Google
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:ml-20" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b px-4 py-2 flex items-center gap-3" style={{ backgroundColor: '#001F3F', borderColor: '#1a3a5c' }}>
        <Wrench className="w-5 h-5 text-green-400" />
        <h1 className="text-lg font-bold text-white">Ferramentas</h1>
        {activeTool && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-300">{TOOLS.find(t => t.id === activeTool)?.label}</span>
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
            {TOOLS.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow text-left"
                  style={{ borderColor: '#E0E8F0' }}
                >
                  <Icon className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-800">{tool.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{tool.description}</p>
                </button>
              );
            })}
          </div>
        ) : activeTool === "checklists" ? (
          <ChecklistsPage />
        ) : null}
      </main>
    </div>
  );
}

function ChecklistsPage() {
  const { data: checklists, isLoading } = trpc.checklists.list.useQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistData | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const toggleItemMutation = trpc.checklists.toggleItem.useMutation({
    onSuccess: () => utils.checklists.list.invalidate(),
    onError: (e) => toast("Erro: " + e.message),
  });

  const deleteChecklistMutation = trpc.checklists.delete.useMutation({
    onSuccess: () => { utils.checklists.list.invalidate(); toast("Checklist removido."); },
    onError: (e) => toast("Erro: " + e.message),
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
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
              onToggleExpand={() => setExpandedId(expandedId === checklist.id ? null : checklist.id)}
              onToggleItem={(itemId, completed) => toggleItemMutation.mutate({ itemId, completed })}
              onEdit={() => setEditingChecklist(checklist)}
              onDelete={() => deleteChecklistMutation.mutate({ id: checklist.id })}
              isDeleting={deleteChecklistMutation.isPending}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">Nenhum checklist criado ainda.</p>
        )}
      </div>

      <CreateChecklistDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => setCreateOpen(false)} />
      {editingChecklist && <EditChecklistDialog checklist={editingChecklist} onClose={() => setEditingChecklist(null)} onUpdated={() => setEditingChecklist(null)} />}
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
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E0E8F0' }}>
      {/* Header do card */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">{checklist.title}</span>
            {checklist.isAdminChecklist === 1 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">Equipe</Badge>
            )}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-400">
              {resetLabelMap[checklist.resetType] ?? checklist.resetType}
            </Badge>
          </div>
          {checklist.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{checklist.description}</p>
          )}
        </div>

        {/* Progresso e Dias */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">{completedCount}/{total}</span>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#22C55E' : '#3B82F6' }}
            />
          </div>
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={isDeleting}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Itens */}
      {expanded && (
        <div className="border-t px-4 py-2 space-y-1" style={{ borderColor: '#F0F4F8' }}>
          {checklist.items.length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center">Nenhum item ainda.</p>
          ) : (
            checklist.items
              .filter(item => {
                if (checklist.resetType === 'unique' && item.completed) {
                  return false;
                }
                return true;
              })
              .map(item => {
                return (
                  <div key={item.id} className="flex items-start gap-3 py-1.5 px-1 rounded-lg hover:bg-gray-50 transition-colors">
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => onToggleItem(item.id, e.target.checked)}
                        className="w-4 h-4 rounded accent-blue-600 mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm block ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
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
function CreateChecklistDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resetType, setResetType] = useState<"daily" | "manual" | "none" | "unique">("daily");
  const [isAdminChecklist, setIsAdminChecklist] = useState(false);
  const [items, setItems] = useState<string[]>([""]);;

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
    onError: (e) => toast("Erro: " + e.message),
  });

  const addItemField = () => setItems(prev => [...prev, ""]);
  const removeItemField = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, val: string) => setItems(prev => prev.map((v, i) => i === idx ? val : v));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Checklist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Título *</label>
            <Input placeholder="Ex: Rotina diária" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Descrição (opcional)</label>
            <Input placeholder="Descrição do checklist" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo de reset</label>
            <select
              value={resetType}
              onChange={e => setResetType(e.target.value as "daily" | "manual" | "none" | "unique")}
              className="w-full text-sm rounded-lg px-3 py-2 border outline-none"
              style={{ borderColor: '#D1D5DB', backgroundColor: '#FAFAFA' }}
            >
              <option value="daily">Reset diário (meia-noite)</option>
              <option value="manual">Reset manual</option>
              <option value="none">Sem reset</option>
              <option value="unique">Única (desaparece ao marcar)</option>
            </select>
          </div>
          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isAdminChecklist} onChange={e => setIsAdminChecklist(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700">Checklist da equipe (visível para todos)</span>
            </label>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Itens</label>
              <button onClick={addItemField} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
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
                      <button onClick={() => removeItemField(idx)} className="p-1 text-gray-400 hover:text-red-500">
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
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => createMutation.mutate({ title, description: description || undefined, resetType, isAdminChecklist, items: items.filter(i => i.trim()) })}
            disabled={!title.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Dialog Editar Checklist ----
function EditChecklistDialog({ checklist, onClose, onUpdated }: { checklist: ChecklistData; onClose: () => void; onUpdated: () => void }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(checklist.title);
  const [description, setDescription] = useState(checklist.description ?? "");
  const [resetType, setResetType] = useState<"daily" | "manual" | "none" | "unique">(checklist.resetType as "daily" | "manual" | "none" | "unique");
  const [newItemText, setNewItemText] = useState("");

  const { data: permission } = trpc.atendimento.checkPermission.useQuery();
  const isAdmin = permission?.isAdmin === true;
  const [isAdminChecklist, setIsAdminChecklist] = useState(checklist.isAdminChecklist === 1);

  const updateMutation = trpc.checklists.update.useMutation({
    onSuccess: () => { toast("Checklist atualizado!"); onUpdated(); },
    onError: (e) => toast("Erro: " + e.message),
  });

  const addItemMutation = trpc.checklists.addItem.useMutation({
    onSuccess: () => { utils.checklists.list.invalidate(); setNewItemText(""); toast("Item adicionado!"); },
    onError: (e) => toast("Erro: " + e.message),
  });

  const deleteItemMutation = trpc.checklists.deleteItem.useMutation({
    onSuccess: () => { utils.checklists.list.invalidate(); toast("Item removido."); },
    onError: (e) => toast("Erro: " + e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Checklist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Título *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Descrição</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo de reset</label>
            <select
              value={resetType}
              onChange={e => setResetType(e.target.value as "daily" | "manual" | "none" | "unique")}
              className="w-full text-sm rounded-lg px-3 py-2 border outline-none"
              style={{ borderColor: '#D1D5DB', backgroundColor: '#FAFAFA' }}
            >
              <option value="daily">Reset diário (meia-noite)</option>
              <option value="manual">Reset manual</option>
              <option value="none">Sem reset</option>
              <option value="unique">Única (desaparece ao marcar)</option>
            </select>
          </div>
          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isAdminChecklist} onChange={e => setIsAdminChecklist(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700">Checklist da equipe (visível para todos)</span>
            </label>
          )}

          {/* Itens existentes */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Itens do checklist</label>
            <div className="space-y-1.5 mb-3">
              {checklist.items.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum item ainda.</p>
              ) : (
                checklist.items.map(item => (
                  <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-700 block">{item.text}</span>
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
                    if (e.key === 'Enter' && newItemText.trim()) {
                      addItemMutation.mutate({ checklistId: checklist.id, text: newItemText.trim(), order: checklist.items.length });
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => newItemText.trim() && addItemMutation.mutate({ checklistId: checklist.id, text: newItemText.trim(), order: checklist.items.length })}
                  disabled={!newItemText.trim() || addItemMutation.isPending}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button
            onClick={() => updateMutation.mutate({ id: checklist.id, title, description: description || undefined, resetType, isAdminChecklist })}
            disabled={!title.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
