import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useState } from "react";
import SideMenu from "./components/SideMenu";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Ongoing from "./pages/Ongoing";
import Churns from './pages/Churns';
import Configuracoes from './pages/Configuracoes';
import Ferramentas from './pages/Ferramentas';
import ChecklistPanel from './components/ChecklistPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from "./contexts/ThemeContext";

/**
 * App.tsx - Roteamento Principal
 * Design: SystemSat
 * - Menu lateral com navegação
 * - Páginas: Dashboard, Marcos, Ongoing, Migração, Red Flags
 */
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
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
      case 'migracao':
        return (
          <div className="ml-20 p-8" style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold" style={{ color: '#001F3F' }}>
                  Migração
                </h1>
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
                <h1 className="text-4xl font-bold" style={{ color: '#001F3F' }}>
                  Red Flags
                </h1>
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
        return <Home />;
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <SideMenu currentPage={currentPage} onPageChange={setCurrentPage} />
          {renderPage()}
          <ChecklistPanel />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
