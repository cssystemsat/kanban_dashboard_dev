import { LayoutDashboard, CheckSquare, Users, AlertCircle, TrendingDown } from 'lucide-react';
import { useState } from 'react';

interface SideMenuProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function SideMenu({ currentPage, onPageChange }: SideMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
      <div className="p-4 border-b" style={{ borderColor: '#E0E8F0' }}>
        <div className="flex items-center justify-center h-16">
          {isExpanded && (
            <span className="text-white font-bold text-lg">Menu</span>
          )}
        </div>
      </div>

      {/* Itens do Menu */}
      <nav className="flex flex-col gap-2 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`
                flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200
                ${
                  isActive
                    ? 'bg-green-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }
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
      </nav>

      {/* Rodapé do Menu */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: '#E0E8F0' }}>
        <div className="flex items-center justify-center">
          {isExpanded && (
            <span className="text-xs text-gray-400 text-center">
              v1.0.0
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
