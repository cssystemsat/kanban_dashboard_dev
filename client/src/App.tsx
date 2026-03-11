import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";
import SideMenu from "./components/SideMenu";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Ongoing from "./pages/Ongoing";
import Churns from './pages/Churns';
import Configuracoes from './pages/Configuracoes';
import Ferramentas from './pages/Ferramentas';
import Estatisticas from './pages/Estatisticas';
import Painel from './pages/Painel';
import ChecklistPanel from './components/ChecklistPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from "./contexts/ThemeContext";
import { trpc } from "@/lib/trpc";

function AppInner() {
  const [currentPage, setCurrentPage] = useState('painel');
  const sessionIdRef = useRef<number | null>(null);

  const { data: user } = trpc.auth.me.useQuery();

  const startSession = trpc.tracking.startSession.useMutation();
  const endSession = trpc.tracking.endSession.useMutation();
  const heartbeat = trpc.tracking.heartbeat.useMutation();
  const trackPage = trpc.tracking.trackPage.useMutation();
  const trackAction = trpc.tracking.trackAction.useMutation();

  // Iniciar sessão quando o usuário logar
  useEffect(() => {
    if (!user?.email) return;
    if (sessionIdRef.current !== null) return; // já tem sessão ativa

    startSession.mutate(
      { userAgent: navigator.userAgent },
      {
        onSuccess: (data) => {
          if (data.sessionId) {
            sessionIdRef.current = data.sessionId;
            trackAction.mutate({
              actionType: 'login',
              description: `Login de ${user.name ?? user.email}`,
              sessionId: data.sessionId,
            });
          }
        },
      }
    );
  }, [user?.email]);

  // Heartbeat a cada 2 minutos para manter duração atualizada
  useEffect(() => {
    if (!user?.email) return;
    const interval = setInterval(() => {
      if (sessionIdRef.current !== null) {
        heartbeat.mutate({ sessionId: sessionIdRef.current });
      }
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.email]);

  // Fechar sessão ao fechar/recarregar a página
  useEffect(() => {
    const handleUnload = () => {
      if (sessionIdRef.current !== null) {
        // Usar sendBeacon para garantir que a requisição seja enviada mesmo ao fechar
        const body = JSON.stringify({ sessionId: sessionIdRef.current });
        navigator.sendBeacon?.('/api/trpc/tracking.endSession', body);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // Rastrear mudança de página
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    if (user?.email) {
      trackPage.mutate({ page, sessionId: sessionIdRef.current });
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'painel':
        return <Painel />;
      case 'dashboard':
        return <Dashboard />;
      case 'marcos':
        return <Home />;
      case 'ongoing':
        return <Ongoing />;
      case 'churns':
        return <Churns />;
      case 'configuracoes':
        return <Configuracoes />;
      case 'ferramentas':
        return <Ferramentas />;
      case 'estatisticas':
        return (
          <div className="ml-20" style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
            <Estatisticas />
          </div>
        );
      case 'migracao':
        return (
          <div className="ml-20 p-8" style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold" style={{ color: '#001F3F' }}>Migração</h1>
                <p className="text-gray-600 mt-2">Página de Migração (em construção)</p>
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
      case 'redflags':
        return (
          <div className="ml-20 p-8" style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold" style={{ color: '#001F3F' }}>Red Flags</h1>
                <p className="text-gray-600 mt-2">Página de Red Flags (em construção)</p>
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
      default:
        return <Painel />;
    }
  };

  return (
    <>
      <Toaster />
      <SideMenu currentPage={currentPage} onPageChange={handlePageChange} />
      {renderPage()}
      {user && currentPage !== 'painel' && <ChecklistPanel />}
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
