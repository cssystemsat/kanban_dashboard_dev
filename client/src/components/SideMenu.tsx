import {
  LayoutDashboard,
  CheckSquare,
  Users,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Settings,
  LogIn,
  LogOut,
  Wrench,
  BarChart2,
  BarChart3,
  LayoutGrid,
  Phone,
  PieChart,
  Smartphone,
  UserRound,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { APP_VERSION } from "@/lib/appVersion";
import CompletionAuditBadge from "@/components/CompletionAuditBadge";

interface SideMenuProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

// Aba pública — visível para todos sem login
const PUBLIC_ITEMS = [{ id: "painel", label: "Painel", icon: LayoutGrid }];

// Segundo item do menu, visível somente para administradores.
const ADMIN_TOP_ITEMS = [
  { id: "performance", label: "Performance", icon: BarChart3 },
];

// Abas que requerem login e permissao
const SYSTEMSAT_LOGO_WEBDEV =
  "/manus-storage/systemsat-logo-transparent_6314d1c3.png";
const SYSTEMSAT_LOGO_FALLBACK =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663388902916/sMtZFYeYnVwpyXZR.png";

const PROTECTED_ITEMS = [
  { id: "dashboard", label: "Evolução de UR's", icon: BarChart2 },
  { id: "kpis", label: "KPI's de Gestão CS", icon: TrendingUp },
  { id: "marcos", label: "Marcos", icon: CheckSquare },
  { id: "timeline", label: "Timeline", icon: UserRound },
  { id: "ongoing", label: "Ongoing", icon: Users },
  { id: "problemas", label: "Problemas", icon: AlertTriangle },
  { id: "bi", label: "BI", icon: BarChart3, adminOnly: true },
  { id: "churns", label: "CHURNs", icon: TrendingDown },
  {
    id: "migracao-externa",
    label: "Migração",
    icon: AlertCircle,
    href: "https://migracao-web.onrender.com/",
  },
  { id: "apppersonalizado", label: "App Personalizado", icon: Smartphone },
  { id: "ferramentas", label: "Ferramentas", icon: Wrench },
];

// Abas apenas para admin
const ADMIN_ONLY_ITEMS = [
  { id: "atendimentos", label: "Atendimentos", icon: Phone },
  { id: "estatisticas", label: "Estatísticas", icon: PieChart },
];

function getTodayBRT(): string {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo",
  });
}

export default function SideMenu({
  currentPage,
  onPageChange,
  onExpandedChange,
}: SideMenuProps) {
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

  // Reset diário acionado ao abrir ou retornar à aplicação.
  useEffect(() => {
    if (!user) return;

    const refreshDailyChecklist = () => {
      const stored = localStorage.getItem("checklist_last_date");
      const today = getTodayBRT();
      if (stored !== today) {
        localStorage.setItem("checklist_last_date", today);
        void utils.checklists.list.invalidate();
      }
    };

    refreshDailyChecklist();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshDailyChecklist();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, utils]);
  // Abas protegidas visíveis para o usuário logado
  const visibleProtectedItems = (() => {
    if (!isLoggedIn || !isAllowed) return [];
    if (myPerms?.allowedPages === null) {
      return PROTECTED_ITEMS.filter(item => !item.adminOnly || isAdmin);
    }
    return PROTECTED_ITEMS.filter(
      item =>
        item.adminOnly
          ? isAdmin
          : myPerms?.allowedPages?.includes(item.id)
    );
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

  const renderItem = (item: {
    id: string;
    label: string;
    icon: React.ElementType;
    href?: string;
  }) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    const itemStyle = {
      backgroundColor: isActive ? "#00DD00" : undefined,
      color: isActive ? "#001F3F" : "#D1D5DB",
    };

    if (item.href) {
      return (
        <div key={item.id} className="relative">
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 w-full"
            style={itemStyle}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "";
            }}
            title={!isExpanded ? item.label : ""}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="text-sm font-medium whitespace-nowrap">
                {item.label}
              </span>
            )}
          </a>
        </div>
      );
    }

    return (
      <div key={item.id} className="relative">
        <button
          onClick={() => onPageChange(item.id)}
          className="flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 w-full"
          style={itemStyle}
          onMouseEnter={e => {
            if (!isActive)
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "rgba(255,255,255,0.08)";
          }}
          onMouseLeave={e => {
            if (!isActive)
              (e.currentTarget as HTMLElement).style.backgroundColor = "";
          }}
          title={!isExpanded ? item.label : ""}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {isExpanded && (
            <span className="text-sm font-medium whitespace-nowrap">
              {item.label}
            </span>
          )}
        </button>
        {(item.id === "marcos" || item.id === "ongoing") && (
          <CompletionAuditBadge
            area={item.id as "marcos" | "ongoing"}
            enabled={isActive}
          />
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed left-0 top-0 h-screen z-50 transition-all duration-300 hidden md:flex md:flex-col"
      style={{
        width: isExpanded ? "200px" : "80px",
        backgroundColor: "#001F3F",
      }}
      onMouseEnter={() => {
        setIsExpanded(true);
        onExpandedChange?.(true);
      }}
      onMouseLeave={() => {
        setIsExpanded(false);
        onExpandedChange?.(false);
      }}
    >
      {/* Logo SYSTEMSAT */}
      <div
        className="flex items-center justify-center border-b px-2 py-3"
        style={{ borderColor: "#1a3a5c", minHeight: "72px" }}
      >
        {isExpanded ? (
          <div
            className="flex h-12 w-full items-center justify-center rounded-lg bg-white px-2"
            aria-label="Systemsat"
          >
            <img
              src={SYSTEMSAT_LOGO_WEBDEV}
              alt="SYSTEMSAT"
              onError={event => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = SYSTEMSAT_LOGO_FALLBACK;
              }}
              className="h-auto max-h-9 w-full object-contain"
            />
          </div>
        ) : (
          <div
            className="flex h-11 w-14 items-center justify-center rounded-lg bg-white px-1"
            aria-label="Systemsat"
            title="SYSTEMSAT"
          >
            <img
              src={SYSTEMSAT_LOGO_WEBDEV}
              alt="SYSTEMSAT"
              onError={event => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = SYSTEMSAT_LOGO_FALLBACK;
              }}
              className="h-auto max-h-8 w-full object-contain"
            />
          </div>
        )}
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
        {/* Ába pública — apenas para autenticados */}
        {visiblePublicItems.map(renderItem)}

        {/* Performance fica logo após Painel e somente para administradores */}
        {isAdmin && ADMIN_TOP_ITEMS.map(renderItem)}

        {/* Separador se houver abas protegidas visíveis */}
        {visibleProtectedItems.length > 0 && (
          <div className="my-1 border-t" style={{ borderColor: "#1a3a5c" }} />
        )}

        {/* Abas protegidas */}
        {visibleProtectedItems.map(renderItem)}

        {/* Separador + abas admin */}
        {(isAdmin || visibleAdminItems.length > 0) && (
          <>
            <div className="my-1 border-t" style={{ borderColor: "#1a3a5c" }} />
            {visibleAdminItems.map(renderItem)}
            {isAdmin && (
              <>
                {renderItem({
                  id: "configuracoes",
                  label: "Configurações",
                  icon: Settings,
                })}
              </>
            )}
          </>
        )}
      </nav>

      {/* Rodapé login/logout */}
      <div className="p-3 border-t" style={{ borderColor: "#1a3a5c" }}>
        {user ? (
          <button
            onClick={() => logout.mutate()}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors"
            style={{ color: "#D1D5DB" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "";
            }}
            title={!isExpanded ? "Sair" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {user.name || user.email}
                </p>
                <p className="text-[10px] text-gray-400">Sair</p>
                <p className="text-[10px] text-gray-500">
                  Versão {APP_VERSION}
                </p>
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={() => (window.location.href = getLoginUrl())}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors"
            style={{ color: "#D1D5DB" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "";
            }}
            title={!isExpanded ? "Entrar" : ""}
          >
            <LogIn className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="text-sm font-medium whitespace-nowrap">
                Entrar
              </span>
            )}
          </button>
        )}
        {isExpanded && !user && (
          <p className="text-[10px] text-gray-500 text-center mt-2">
            Versão {APP_VERSION}
          </p>
        )}
      </div>
    </div>
  );
}
