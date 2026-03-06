import { LayoutDashboard, CheckSquare, Users, AlertCircle, TrendingDown, Settings, LogIn, LogOut, Wrench } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';

interface SideMenuProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

// Mapeamento de todas as abas disponíveis
const ALL_MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'marcos', label: 'Marcos', icon: CheckSquare },
  { id: 'ongoing', label: 'Ongoing', icon: Users },
  { id: 'churns', label: 'CHURNs', icon: TrendingDown },
  { id: 'migracao', label: 'Migração', icon: AlertCircle },
  { id: 'redflags', label: 'Red Flags', icon: AlertCircle },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
];

// Obtém a data de hoje no fuso de Brasília (YYYY-MM-DD)
function getTodayBRT(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

export default function SideMenu({ currentPage, onPageChange }: SideMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: permission } = trpc.atendimento.checkPermission.useQuery();
  const { data: myPerms } = trpc.config.myPermissions.useQuery(undefined, {
    enabled: !!user,
  });
  const utils = trpc.useUtils();

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });

  const isAdmin = permission?.isAdmin === true;

  // Reset diário automático: invalida cache de checklists quando muda o dia
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem('checklist_last_date');
    const today = getTodayBRT();
    if (stored !== today) {
      localStorage.setItem('checklist_last_date', today);
      utils.checklists.list.invalidate();
    }

    // Verificar a cada minuto se o dia mudou (para usuários que ficam logados a noite toda)
    const interval = setInterval(() => {
      const now = getTodayBRT();
      const last = localStorage.getItem('checklist_last_date');
      if (last !== now) {
        localStorage.setItem('checklist_last_date', now);
        utils.checklists.list.invalidate();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [user, utils]);

  // Filtrar abas visíveis baseado nas permissões do usuário
  // - Se não logado ou sem permissões: mostra todas (painel é público)
  // - Se logado e tem allowedPages: mostra apenas as permitidas
  // - Se logado e allowedPages é null: mostra todas
  const visibleMenuItems = (() => {
    if (!user || !myPerms || !myPerms.isAllowed) return ALL_MENU_ITEMS;
    if (myPerms.allowedPages === null) return ALL_MENU_ITEMS; // acesso total
    return ALL_MENU_ITEMS.filter(item => myPerms.allowedPages!.includes(item.id));
  })();

  return (
    <div
      className="fixed left-0 top-0 h-screen z-50 transition-all duration-300 hidden md:flex md:flex-col"
      style={{
        width: isExpanded ? '200px' : '80px',
        backgroundColor: '#001F3F',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Header do Menu */}
      <div className="px-3 py-3 border-b flex items-center justify-center" style={{ borderColor: '#1a3a5c', minHeight: '72px' }}>
        {isExpanded ? (
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663388902916/m4JthXh6fRtQzx9KxAa8P4/systemsat_logo_674d294f.jpg"
            alt="Systemsat"
            className="w-full object-contain rounded"
            style={{ maxHeight: '56px' }}
          />
        ) : (
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663388902916/m4JthXh6fRtQzx9KxAa8P4/favicon_df62fb09.png"
            alt="Systemsat"
            className="object-contain rounded"
            style={{ width: '44px', height: '44px' }}
          />
        )}
      </div>

      {/* Itens do Menu */}
      <nav className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`
                flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-800'}
              `}
              style={{
                backgroundColor: isActive ? '#00DD00' : undefined,
                color: isActive ? '#001F3F' : undefined,
              }}
              title={!isExpanded ? item.label : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Separador + Ferramentas (se não estiver na lista principal) */}
        {/* Configurações (só para admins) */}
        {isAdmin && (
          <>
            <div className="my-1 border-t" style={{ borderColor: '#1a3a5c' }} />
            <button
              onClick={() => onPageChange('configuracoes')}
              className={`
                flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200
                ${currentPage === 'configuracoes' ? 'bg-green-500' : 'text-gray-300 hover:bg-gray-800'}
              `}
              style={{
                backgroundColor: currentPage === 'configuracoes' ? '#00DD00' : undefined,
                color: currentPage === 'configuracoes' ? '#001F3F' : undefined,
              }}
              title={!isExpanded ? 'Configurações' : ''}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">Configurações</span>
              )}
            </button>
          </>
        )}
      </nav>

      {/* Rodapé: login/logout */}
      <div className="p-4 border-t" style={{ borderColor: '#1a3a5c' }}>
        {user ? (
          <button
            onClick={() => logout.mutate()}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            title={!isExpanded ? 'Sair' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user.name || user.email}</p>
                <p className="text-[10px] text-gray-400">Sair</p>
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={() => window.location.href = getLoginUrl()}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            title={!isExpanded ? 'Entrar' : ''}
          >
            <LogIn className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="text-sm font-medium whitespace-nowrap">Entrar</span>
            )}
          </button>
        )}
        {isExpanded && (
          <p className="text-[10px] text-gray-500 text-center mt-2">v1.0.0</p>
        )}
      </div>
    </div>
  );
}
