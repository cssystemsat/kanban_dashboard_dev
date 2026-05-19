import { ClienteMarcoDetalhado } from '@/hooks/usePainelData';

interface MarcosCardProps {
  client: ClienteMarcoDetalhado;
}

export default function MarcosCard({ client }: MarcosCardProps) {
  const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626'];
  const color = colors[(client.marco - 1) % colors.length];

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
      style={{ borderColor: '#E0E8F0' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{client.nome}</h3>
          <p className="text-xs text-gray-500">{client.csm}</p>
        </div>
        <div className="inline-flex items-center justify-center font-bold text-xs w-6 h-6 rounded-full shrink-0 ml-2"
          style={{ backgroundColor: color + '20', color }}>
          M{client.marco}
        </div>
      </div>

      <div className="space-y-2 flex-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">URs</span>
          <span className="font-bold text-sm" style={{ color }}>{client.quantidadeURs}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Boleto</span>
          <span className="font-semibold text-xs text-gray-700">R$ {client.ultimoBoleto.toLocaleString('pt-BR')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Contato</span>
          <span className="text-xs text-gray-600">{client.ultimoContato}</span>
        </div>
      </div>

      {client.flag && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F0F4F8' }}>
          <span className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              backgroundColor: client.flag === 'Red Flag' ? '#FEE2E2' : client.flag === 'Yellow Flag' ? '#FEF3C7' : '#F3F4F6',
              color: client.flag === 'Red Flag' ? '#991B1B' : client.flag === 'Yellow Flag' ? '#92400E' : '#1F2937'
            }}>
            {client.flag}
          </span>
        </div>
      )}
    </div>
  );
}
