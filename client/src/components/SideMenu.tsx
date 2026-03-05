import { LayoutDashboard, CheckSquare, Users, AlertCircle, TrendingDown, Settings, LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';

interface SideMenuProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function SideMenu({ currentPage, onPageChange }: SideMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: permission } = trpc.atendimento.checkPermission.useQuery();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });

  const isAdmin = permission?.isAdmin === true;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'marcos', label: 'Marcos', icon: CheckSquare },
    { id: 'ongoing', label: 'Ongoing', icon: Users },
    { id: 'churns', label: 'CHURNs', icon: TrendingDown },
    { id: 'migracao', label: 'Migração', icon: AlertCircle },
    { id: 'redflags', label: 'Red Flags', icon: AlertCircle },
  ];

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
      <nav className="flex flex-col gap-2 p-4 flex-1">
        {menuItems.map((item) => {
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

        {/* Separador + Configurações (só para admins) */}
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

      {/* Rodapé: login/logout + versão */}
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
