import { LayoutDashboard, CheckSquare, Users, AlertCircle, TrendingDown, TrendingUp, Settings, LogIn, LogOut, Wrench, BarChart2, BarChart3, LayoutGrid, Phone, PieChart, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';

interface SideMenuProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

// Aba pública — visível para todos sem login
const PUBLIC_ITEMS = [
  { id: 'painel', label: 'Painel', icon: LayoutGrid },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
];

// Abas que requerem login e permissao
const PROTECTED_ITEMS = [
  { id: 'dashboard', label: "Evolução de UR's", icon: BarChart2 },
  { id: 'kpis', label: "KPI's de Gestão CS", icon: TrendingUp },
  { id: 'marcos', label: 'Marcos', icon: CheckSquare },
  { id: 'ongoing', label: 'Ongoing', icon: Users },
  { id: 'churns', label: 'CHURNs', icon: TrendingDown },
  { id: 'redflags', label: 'Red Flags', icon: AlertCircle },
  { id: 'apppersonalizado', label: 'App Personalizado', icon: Smartphone },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
];

// Abas apenas para admin
const ADMIN_ONLY_ITEMS = [
  { id: 'atendimentos', label: 'Atendimentos', icon: Phone },
  { id: 'estatisticas', label: 'Estatísticas', icon: PieChart },
];

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
  const isLoggedIn = !!user;
  const isAllowed = myPerms?.isAllowed === true;

  // Reset diário automático dos checklists
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem('checklist_last_date');
    const today = getTodayBRT();
    if (stored !== today) {
      localStorage.setItem('checklist_last_date', today);
      utils.checklists.list.invalidate();
    }
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
  // Abas protegidas visíveis para o usuário logado
  const visibleProtectedItems = (() => {
    if (!isLoggedIn || !isAllowed) return [];
    // Se o usuário tem onlyAppKanban, mostrar apenas App Personalizado
    if (myPerms?.onlyAppKanban) return PROTECTED_ITEMS.filter(item => item.id === 'apppersonalizado');
    if (myPerms?.allowedPages === null) return PROTECTED_ITEMS; // acesso total
    return PROTECTED_ITEMS.filter(item => myPerms?.allowedPages?.includes(item.id));
  })();

  // Ábas públicas visíveis (Home só para autenticados)
  const visiblePublicItems = (() => {
    if (!isLoggedIn) return []; // Esconder Home para não-autenticados
    return PUBLIC_ITEMS;
  })();

  // Abas apenas para admin
  const visibleAdminItems = (() => {
    if (!isAdmin) return [];
    return ADMIN_ONLY_ITEMS;
  })();

  const renderItem = (item: { id: string; label: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onPageChange(item.id)}
        className="flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 w-full"
        style={{
          backgroundColor: isActive ? '#00DD00' : undefined,
          color: isActive ? '#001F3F' : '#D1D5DB',
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
        title={!isExpanded ? item.label : ''}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {isExpanded && (
          <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
        )}
      </button>
    );
  };

  return (
    <div
      className="fixed left-0 top-0 h-screen z-50 transition-all duration-300 hidden md:flex md:flex-col"
      style={{ width: isExpanded ? '200px' : '80px', backgroundColor: '#001F3F' }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="px-3 py-3 border-b flex items-center justify-center" style={{ borderColor: '#1a3a5c', minHeight: '72px' }}>
        {isExpanded ? (
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663388902916/m4JthXh6fRtQzx9KxAa8P4/systemsat_logo_674d294f.jpg"
            alt="Systemsat" className="w-full object-contain rounded" style={{ maxHeight: '56px' }}
          />
        ) : (
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663388902916/m4JthXh6fRtQzx9KxAa8P4/favicon_df62fb09.png"
            alt="Systemsat" className="object-contain rounded" style={{ width: '44px', height: '44px' }}
          />
        )}
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
        {/* Ába pública — apenas para autenticados */}
        {visiblePublicItems.map(renderItem)}

        {/* Separador se houver abas protegidas visíveis */}
        {visibleProtectedItems.length > 0 && (
          <div className="my-1 border-t" style={{ borderColor: '#1a3a5c' }} />
        )}

        {/* Abas protegidas */}
        {visibleProtectedItems.map(renderItem)}

        {/* Separador + abas admin */}
        {(isAdmin || visibleAdminItems.length > 0) && (
          <>
            <div className="my-1 border-t" style={{ borderColor: '#1a3a5c' }} />
            {visibleAdminItems.map(renderItem)}
            {isAdmin && (
              <>
                {renderItem({ id: 'configuracoes', label: 'Configurações', icon: Settings })}
              </>
            )}
          </>
        )}
      </nav>

      {/* Rodapé login/logout */}
      <div className="p-3 border-t" style={{ borderColor: '#1a3a5c' }}>
        {user ? (
          <button
            onClick={() => logout.mutate()}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors"
            style={{ color: '#D1D5DB' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
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
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors"
            style={{ color: '#D1D5DB' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
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
