import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";
import SideMenu from "./components/SideMenu";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Ongoing from "./pages/Ongoing";
import Churns from "./pages/Churns";
import Configuracoes from "./pages/Configuracoes";
import Ferramentas from "./pages/Ferramentas";
import Estatisticas from "./pages/Estatisticas";
import Painel from "./pages/Painel";
import { Migracao } from "./pages/Migracao";
import Migration from "./pages/Migration";
import AtendimentosPage from "./pages/AtendimentosPage";
import AppPersonalizado from "./pages/AppPersonalizado";
import KPIs from "./pages/KPIs";
import Performance from "./pages/Performance";
import ChecklistPanel from "./components/ChecklistPanel";
import { DailyLossesAlert } from "./components/DailyLossesAlert";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "./const";

const VALID_PAGES = new Set([
  "painel",
  "performance",
  "dashboard",
  "marcos",
  "ongoing",
  "churns",
  "configuracoes",
  "ferramentas",
  "estatisticas",
  "migracao",
  "migracao2",
  "atendimentos",
  "redflags",
  "kpis",
  "apppersonalizado",
]);

function getPageFromUrl(): string {
  const requestedPage = new URLSearchParams(window.location.search).get("page");
  return requestedPage && VALID_PAGES.has(requestedPage)
    ? requestedPage
    : "painel";
}

function AccessRestrictedScreen() {
  const tryAnotherAccount = () => {
    window.location.assign(getLoginUrl());
  };

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border text-3xl">
          !
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Acesso restrito
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
          Este e-mail não está na lista de permissões do painel. Solicite ao
          administrador que inclua seu e-mail antes de tentar novamente.
        </p>
        <button
          type="button"
          onClick={tryAnotherAccount}
          className="mt-8 rounded-lg border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Tentar outra conta
        </button>
      </div>
    </main>
  );
}

function AppInner() {
  const [currentPage, setCurrentPage] = useState(getPageFromUrl);
  const [isSideMenuExpanded, setIsSideMenuExpanded] = useState(false);
  const sessionIdRef = useRef<number | null>(null);

  const {
    data: user,
    isLoading: authLoading,
    error: authError,
  } = trpc.auth.me.useQuery();
  const { data: accessStatus } = trpc.auth.accessStatus.useQuery();
  const restrictedRedirect =
    new URLSearchParams(window.location.search).get("access") === "restricted";
  const accessRestricted = Boolean(
    accessStatus?.accessRestricted || restrictedRedirect
  );
  const { data: myPerms } = trpc.config.myPermissions.useQuery(undefined, {
    enabled: !!user,
  });

  // Debug: log auth errors
  useEffect(() => {
    if (authError) {
      console.error("[Auth] Error fetching user:", authError);
    }
  }, [authError]);

  const startSession = trpc.tracking.startSession.useMutation();
  const endSession = trpc.tracking.endSession.useMutation();
  const trackPage = trpc.tracking.trackPage.useMutation();
  const trackAction = trpc.tracking.trackAction.useMutation();

  // Redirecionar usuários com onlyAppKanban para App Personalizado
  useEffect(() => {
    if (myPerms?.onlyAppKanban && currentPage !== "apppersonalizado") {
      setCurrentPage("apppersonalizado");
    }
  }, [myPerms?.onlyAppKanban, currentPage]);

  // Iniciar sessão quando o usuário logar
  useEffect(() => {
    if (!user?.email) return;
    if (sessionIdRef.current !== null) return; // já tem sessão ativa

    console.log("[Session] Starting session for user:", user.email);
    startSession.mutate(
      { userAgent: navigator.userAgent },
      {
        onSuccess: data => {
          if (data.sessionId) {
            sessionIdRef.current = data.sessionId;
            console.log("[Session] Session started:", data.sessionId);
            trackAction.mutate({
              actionType: "login",
              description: `Login de ${user.name ?? user.email}`,
              sessionId: data.sessionId,
            });
          }
        },
        onError: error => {
          console.error("[Session] Failed to start session:", error);
        },
      }
    );
  }, [user?.email]);

  // Fechar sessão ao fechar/recarregar a página
  useEffect(() => {
    const handleUnload = () => {
      if (sessionIdRef.current !== null) {
        // Usar sendBeacon com formato tRPC correto
        try {
          const input = JSON.stringify({ sessionId: sessionIdRef.current });
          const encodedInput = encodeURIComponent(input);
          const url = `/api/trpc/tracking.endSession?input=${encodedInput}`;
          navigator.sendBeacon?.(url);
        } catch (error) {
          console.error("[Session] Failed to end session on unload:", error);
        }
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Rastrear mudança de página
  const handlePageChange = (page: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", page);
    window.history.pushState({ page }, "", url);
    setCurrentPage(page);
    if (user?.email) {
      trackPage.mutate({ page, sessionId: sessionIdRef.current });
    }
  };

  useEffect(() => {
    const handlePopState = () => setCurrentPage(getPageFromUrl());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const renderPage = () => {
    // Se não está autenticado e tenta acessar Home (marcos), redirecionar para Painel
    if (!user && currentPage === "marcos") {
      return <Painel />;
    }

    switch (currentPage) {
      case "painel":
        return <Painel />;
      case "performance":
        return <Performance />;
      case "dashboard":
        return <Dashboard />;
      case "marcos":
        return <Home />;
      case "ongoing":
        return <Ongoing />;
      case "churns":
        return <Churns />;
      case "configuracoes":
        return <Configuracoes />;
      case "ferramentas":
        return <Ferramentas />;
      case "estatisticas":
        return (
          <div
            className="ml-20"
            style={{ backgroundColor: "#F5F7FA", minHeight: "100vh" }}
          >
            <Estatisticas />
          </div>
        );
      case "migracao":
        return (
          <div
            className="ml-20"
            style={{ backgroundColor: "#F5F7FA", minHeight: "100vh" }}
          >
            <Migracao />
          </div>
        );
      case "migracao2":
        return (
          <div
            className="ml-20"
            style={{ backgroundColor: "#F5F7FA", minHeight: "100vh" }}
          >
            <Migration />
          </div>
        );
      case "atendimentos":
        return <AtendimentosPage />;
      case "redflags":
        return (
          <div
            className="ml-20 p-8"
            style={{ backgroundColor: "#F5F7FA", minHeight: "100vh" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "#001F3F" }}>
                  Red Flags
                </h1>
                <p className="text-gray-600 mt-2">
                  Página de Red Flags (em construção)
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
              >
                Atualizar
              </button>
            </div>
          </div>
        );
      case "kpis":
        return <KPIs sidebarExpanded={isSideMenuExpanded} />;
      case "apppersonalizado":
        return <AppPersonalizado />;
      default:
        return <Painel />;
    }
  };

  if (!authLoading && accessRestricted) {
    return <AccessRestrictedScreen />;
  }

  return (
    <>
      <Toaster />
      <DailyLossesAlert />
      <SideMenu
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onExpandedChange={setIsSideMenuExpanded}
      />
      {renderPage()}
      {user && currentPage !== "painel" && currentPage !== "performance" && (
        <ChecklistPanel />
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AppInner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
