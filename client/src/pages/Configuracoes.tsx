import { useState } from "react";
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
import { Trash2, Pencil, Plus, ShieldCheck, User, LogIn, Loader2, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";

// Abas disponíveis para controle de acesso
const ALL_PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "marcos", label: "Marcos" },
  { id: "ongoing", label: "Ongoing" },
  { id: "churns", label: "CHURNs" },
  { id: "migracao", label: "Migração" },
  { id: "redflags", label: "Red Flags" },
  { id: "ferramentas", label: "Ferramentas" },
];

type EmailEntry = {
  id: number;
  email: string;
  label: string | null;
  isAdmin: number;
  canLaunch: number;
  allowedPages: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function Configuracoes() {
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  const { data: emails, isLoading, error } = trpc.config.listEmails.useQuery(undefined, {
    retry: false,
  });

  const addMutation = trpc.config.addEmail.useMutation({
    onSuccess: () => {
      utils.config.listEmails.invalidate();
      toast("E-mail adicionado com sucesso!");
      setAddOpen(false);
      setNewEmail("");
      setNewLabel("");
      setNewIsAdmin(false);
      setNewCanLaunch(true);
      setNewAllowedPages(null);
    },
    onError: (e) => toast("Erro: " + e.message),
  });

  const updateMutation = trpc.config.updateEmail.useMutation({
    onSuccess: () => {
      utils.config.listEmails.invalidate();
      toast("E-mail atualizado!");
      setEditOpen(false);
      setEditEntry(null);
    },
    onError: (e) => toast("Erro: " + e.message),
  });

  const deleteMutation = trpc.config.deleteEmail.useMutation({
    onSuccess: () => {
      utils.config.listEmails.invalidate();
      toast("E-mail removido.");
    },
    onError: (e) => toast("Erro: " + e.message),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [newCanLaunch, setNewCanLaunch] = useState(true);
  const [newAllowedPages, setNewAllowedPages] = useState<string[] | null>(null); // null = todas

  const [editOpen, setEditOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<EmailEntry | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editCanLaunch, setEditCanLaunch] = useState(true);
  const [editAllowedPages, setEditAllowedPages] = useState<string[] | null>(null);

  const openEdit = (entry: EmailEntry) => {
    setEditEntry(entry);
    setEditEmail(entry.email);
    setEditLabel(entry.label ?? "");
    setEditIsAdmin(entry.isAdmin === 1);
    setEditCanLaunch(entry.canLaunch === 1);
    setEditAllowedPages(entry.allowedPages ? JSON.parse(entry.allowedPages) as string[] : null);
    setEditOpen(true);
  };

  // Não autenticado
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
        <p className="text-gray-500 text-sm">Você precisa estar autenticado para acessar as configurações.</p>
        <Button onClick={() => window.location.href = getLoginUrl()} className="gap-2">
          <LogIn className="w-4 h-4" />
          Entrar com Google
        </Button>
      </div>
    );
  }

  // Acesso negado (não é admin)
  if (error) {
    return (
      <div className="min-h-screen md:ml-20 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#F5F7FA' }}>
        <ShieldCheck className="w-16 h-16 text-red-300" />
        <h2 className="text-xl font-bold text-gray-700">Acesso negado</h2>
        <p className="text-gray-500 text-sm">Seu e-mail não tem permissão para acessar as configurações.</p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:ml-20" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#001F3F', borderColor: '#1a3a5c' }}>
        <h1 className="text-lg font-bold text-white">Configurações</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300">{user.email}</span>
          <Badge variant="outline" className="text-xs text-white border-white/30">Admin</Badge>
        </div>
      </header>

      <main className="px-4 pt-4 pb-8 max-w-3xl mx-auto">
        {/* Card de e-mails */}
        <div className="bg-white rounded-xl border shadow-sm" style={{ borderColor: '#E0E8F0' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E0E8F0' }}>
            <div>
              <h2 className="text-base font-semibold text-gray-800">E-mails autorizados</h2>
              <p className="text-xs text-gray-500 mt-0.5">Usuários que podem lançar atendimentos e acessar o sistema</p>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : !emails || emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <User className="w-10 h-10 mb-2" />
              <p className="text-sm">Nenhum e-mail cadastrado ainda.</p>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: '#F0F4F8' }}>
              {emails.map((entry) => {
                const parsedPages = (entry as EmailEntry).allowedPages
                  ? JSON.parse((entry as EmailEntry).allowedPages!) as string[]
                  : null;
                return (
                  <li key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">{entry.email}</span>
                        {entry.isAdmin === 1 && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                            Admin
                          </Badge>
                        )}
                        {(entry as EmailEntry).canLaunch === 1 ? (
                          <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                            Lança atend.
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-gray-200">
                            Só visualiza
                          </Badge>
                        )}
                      </div>
                      {entry.label && (
                        <p className="text-xs text-gray-400 mt-0.5">{entry.label}</p>
                      )}
                      {/* Abas permitidas */}
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <LayoutDashboard className="w-3 h-3 text-gray-300" />
                        {parsedPages === null ? (
                          <span className="text-[10px] text-green-600 font-medium">Todas as abas</span>
                        ) : parsedPages.length === 0 ? (
                          <span className="text-[10px] text-red-500 font-medium">Nenhuma aba</span>
                        ) : (
                          parsedPages.map(p => {
                            const page = ALL_PAGES.find(pg => pg.id === p);
                            return page ? (
                              <span key={p} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {page.label}
                              </span>
                            ) : null;
                          })
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                        onClick={() => openEdit(entry as EmailEntry)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                        onClick={() => deleteMutation.mutate({ id: entry.id })}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {/* Dialog Adicionar */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar e-mail autorizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail *</label>
              <Input
                placeholder="usuario@empresa.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Nome / Descrição (opcional)</label>
              <Input
                placeholder="Ex: João Pedro"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">Permissão de administrador (acesso às Configurações)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newCanLaunch}
                onChange={(e) => setNewCanLaunch(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">Pode lançar atendimentos</span>
            </label>

            {/* Seleção de abas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Abas permitidas</label>
                <button
                  onClick={() => setNewAllowedPages(null)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {newAllowedPages === null ? "✓ Todas as abas" : "Liberar todas"}
                </button>
              </div>
              {newAllowedPages !== null && (
                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_PAGES.map(page => (
                    <label key={page.id} className="flex items-center gap-2 cursor-pointer bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={newAllowedPages.includes(page.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAllowedPages(prev => [...(prev ?? []), page.id]);
                          } else {
                            setNewAllowedPages(prev => (prev ?? []).filter(p => p !== page.id));
                          }
                        }}
                        className="w-4 h-4 rounded accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{page.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {newAllowedPages === null && (
                <div className="bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-xs text-green-700">Usuário terá acesso a todas as abas do sistema.</span>
                  <button onClick={() => setNewAllowedPages([])} className="text-xs text-blue-600 hover:underline ml-auto">Restringir</button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => addMutation.mutate({ email: newEmail, label: newLabel || undefined, isAdmin: newIsAdmin, canLaunch: newCanLaunch })}
              disabled={!newEmail || addMutation.isPending}
            >
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar e-mail</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail *</label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Nome / Descrição (opcional)</label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editIsAdmin}
                onChange={(e) => setEditIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">Permissão de administrador</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editCanLaunch}
                onChange={(e) => setEditCanLaunch(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">Pode lançar atendimentos</span>
            </label>

            {/* Seleção de abas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Abas permitidas</label>
                <button
                  onClick={() => setEditAllowedPages(null)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {editAllowedPages === null ? "✓ Todas as abas" : "Liberar todas"}
                </button>
              </div>
              {editAllowedPages !== null && (
                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_PAGES.map(page => (
                    <label key={page.id} className="flex items-center gap-2 cursor-pointer bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={editAllowedPages.includes(page.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditAllowedPages(prev => [...(prev ?? []), page.id]);
                          } else {
                            setEditAllowedPages(prev => (prev ?? []).filter(p => p !== page.id));
                          }
                        }}
                        className="w-4 h-4 rounded accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{page.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {editAllowedPages === null && (
                <div className="bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-xs text-green-700">Usuário terá acesso a todas as abas do sistema.</span>
                  <button onClick={() => setEditAllowedPages([])} className="text-xs text-blue-600 hover:underline ml-auto">Restringir</button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => editEntry && updateMutation.mutate({
                id: editEntry.id,
                email: editEmail,
                label: editLabel || undefined,
                isAdmin: editIsAdmin,
                canLaunch: editCanLaunch,
                allowedPages: editAllowedPages,
              })}
              disabled={!editEmail || updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
