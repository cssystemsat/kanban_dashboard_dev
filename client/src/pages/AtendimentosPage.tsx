import { useEffect, useState } from 'react';
import { Atendimentos } from '@/components/Atendimentos';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAtendimentosData } from '@/hooks/useAtendimentosData';

export default function AtendimentosPage() {
  const { fetchData, loading } = useAtendimentosData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen md:ml-20" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: '#001F3F', borderColor: '#1a3a5c' }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Atendimentos</h1>
            <p className="text-xs text-gray-300 mt-1">Gestão e estatísticas de atendimentos</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="px-6 py-6">
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#E0E8F0' }}>
          <Atendimentos />
        </div>
      </main>
    </div>
  );
}
