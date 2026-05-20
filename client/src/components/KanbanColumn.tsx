import { ClientData } from '@/hooks/useKanbanData';
import ClientCard from './ClientCard';
import URsTrendIndicator from './URsTrendIndicator';

interface KanbanColumnProps {
  marcoNumber: number;
  marcoName?: string;
  clients: ClientData[];
  onClientClick?: (client: ClientData) => void;
  onAtendimento?: (client: ClientData) => void;
  trendStartDate?: Date | null;
  trendEndDate?: Date | null;
}

export default function KanbanColumn({ marcoNumber, marcoName, clients, onClientClick, onAtendimento, trendStartDate, trendEndDate }: KanbanColumnProps) {
  // Para a coluna 100% Implantados (marcoNumber === 6), mostrar todos os clientes com isComplete
  const columnClients = marcoNumber === 6 
    ? clients.filter(c => c.isComplete)
    : clients.filter(c => c.marco === marcoNumber);

  return (
    <div className="flex flex-col gap-3 bg-white rounded-lg border p-3 md:p-4" style={{ borderColor: '#E0E8F0', height: '700px' }}>
      {/* Header da coluna */}
      <div className="flex-shrink-0">
        <h2 className="font-bold text-lg" style={{ color: '#001F3F' }}>
          {marcoName || (marcoNumber === 6 ? '100% Implantados' : `Marco ${marcoNumber}`)}
        </h2>
        <p className="text-xs mt-1" style={{ color: '#4A5F7F' }}>
          {columnClients.length} {columnClients.length === 1 ? 'cliente' : 'clientes'}
        </p>
      </div>

      {/* Cards dos clientes com scroll vertical */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 pr-2">
          {columnClients.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center">
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Nenhum cliente neste marco</p>
            </div>
          ) : (
            columnClients.map(client => (
              <div key={client.id} className="space-y-2">
                {trendStartDate && trendEndDate && (
                  <URsTrendIndicator
                    codigoCliente={client.nome}
                    startDate={trendStartDate}
                    endDate={trendEndDate}
                  />
                )}
                <div onClick={() => onClientClick?.(client)} className="cursor-pointer">
                  <ClientCard client={client} onAtendimento={onAtendimento} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
