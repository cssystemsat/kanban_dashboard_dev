import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CheckSquare, X, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

// Obtém a data de hoje no fuso de Brasília (YYYY-MM-DD)
function getTodayBRT(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

export default function ChecklistPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: checklists, isLoading, refetch } = trpc.checklists.list.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const toggleItem = trpc.checklists.toggleItem.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast("Erro: " + e.message),
  });

  const today = getTodayBRT();

  // isAdminChecklist === 1 → checklist da equipe (criado por admin para todos)
  const myChecklists = checklists?.filter(c => c.isAdminChecklist !== 1) ?? [];
  const teamChecklists = checklists?.filter(c => c.isAdminChecklist === 1) ?? [];

  const handleToggle = (itemId: number, currentDone: boolean) => {
    if (!user) return;
    toggleItem.mutate({ itemId, completed: !currentDone });
  };

  // Botão flutuante — posicionado acima do assistente de dados (bottom-24)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3.5 shadow-lg hover:shadow-xl transition-all z-40"
        title="Meus Checklists"
      >
        <CheckSquare className="w-5 h-5" />
      </button>
    );
  }

  return (
    <>
      {/* Overlay para fechar ao clicar fora */}
      <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

      {/* Painel lateral */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        style={{ width: '320px', maxHeight: '520px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ backgroundColor: '#001F3F', borderColor: '#1a3a5c' }}
        >
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-white">Checklists</span>
            <span className="text-[10px] text-gray-400 ml-1">{today}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => refetch()}
              className="p-1 rounded hover:bg-white/10 text-gray-300 transition-colors"
              title="Atualizar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-white/10 text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 gap-3">
              <CheckSquare className="w-10 h-10 text-gray-200" />
              <p className="text-sm text-gray-500 text-center">Faça login para ver seus checklists</p>
              <button
                onClick={() => window.location.href = getLoginUrl()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Entrar com Google
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (!checklists || checklists.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 gap-2">
              <CheckSquare className="w-10 h-10 text-gray-200" />
              <p className="text-sm text-gray-500 text-center">Nenhum checklist encontrado.</p>
              <p className="text-xs text-gray-400 text-center">Crie checklists na aba Ferramentas.</p>
            </div>
          ) : (
            <div>
              {/* Checklists pessoais */}
              {myChecklists.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Meus Checklists</span>
                  </div>
                  {myChecklists.map(checklist => (
                    <ChecklistGroup
                      key={checklist.id}
                      title={checklist.title}
                      items={checklist.items}
                      onToggle={handleToggle}
                      isToggling={toggleItem.isPending}
                    />
                  ))}
                </div>
              )}

              {/* Checklists da equipe */}
              {teamChecklists.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                    <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">Equipe</span>
                  </div>
                  {teamChecklists.map(checklist => (
                    <ChecklistGroup
                      key={checklist.id}
                      title={checklist.title}
                      items={checklist.items}
                      onToggle={handleToggle}
                      isToggling={toggleItem.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer com progresso */}
        {user && checklists && checklists.length > 0 && (
          <div className="px-4 py-2 border-t bg-gray-50 shrink-0">
            {(() => {
              const totalItems = checklists.reduce((acc, c) => acc + (c.items?.length ?? 0), 0);
              const doneItems = checklists.reduce((acc, c) => acc + (c.items?.filter(i => i.completed).length ?? 0), 0);
              const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
              return (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0">{doneItems}/{totalItems}</span>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </>
  );
}

// Sub-componente para cada checklist
type ChecklistItem = {
  id: number;
  text: string;
  completed: boolean;
};

type ChecklistGroupProps = {
  title: string;
  items: ChecklistItem[];
  onToggle: (itemId: number, currentDone: boolean) => void;
  isToggling: boolean;
};

function ChecklistGroup({ title, items, onToggle, isToggling }: ChecklistGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const doneCount = items.filter(i => i.completed).length;
  const total = items.length;
  const allDone = total > 0 && doneCount === total;

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
      >
        <span className={`text-sm font-medium truncate ${allDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {title}
        </span>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${allDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {doneCount}/{total}
          </span>
          <span className="text-gray-400 text-xs">{collapsed ? '▶' : '▼'}</span>
        </div>
      </button>

      {!collapsed && (
        <div className="pb-1">
          {items.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 pb-2">Nenhum item.</p>
          ) : (
            items.map(item => (
              <label
                key={item.id}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors hover:bg-gray-50 ${item.completed ? 'opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => onToggle(item.id, item.completed)}
                  disabled={isToggling}
                  className="w-4 h-4 rounded accent-blue-600 shrink-0"
                />
                <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.text}
                </span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
