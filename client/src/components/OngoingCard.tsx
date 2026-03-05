import { OngoingClientData } from '@/hooks/useOngoingData';
import { MessageCircle, Headphones, Star } from 'lucide-react';

interface OngoingCardProps {
  client: OngoingClientData;
  onAtendimento?: (client: OngoingClientData) => void;
}

/** Retorna cor e bg para cada nível de flag */
function getFlagStyle(flag: string): { color: string; bg: string } | null {
  switch (flag) {
    case 'Red Flag':    return { color: '#DC2626', bg: '#FEE2E2' };
    case 'Yellow Flag': return { color: '#D97706', bg: '#FEF3C7' };
    case 'Black Flag':  return { color: '#1F2937', bg: '#F3F4F6' };
    default:            return null;
  }
}

export default function OngoingCard({ client, onAtendimento }: OngoingCardProps) {
  const getDeltaColor = (delta: number) => {
    if (delta > 0) return { bg: '#D1FAE5', text: '#059669' };
    if (delta < 0) return { bg: '#FEE2E2', text: '#DC2626' };
    return { bg: '#F3F4F6', text: '#6B7280' };
  };

  const deltaColor = getDeltaColor(client.deltaConsumo);
  const flagStyle = getFlagStyle(client.flag);
  const hasFlag = !!flagStyle;

  return (
    <div
      className="bg-white rounded-lg border-2 p-2 hover:shadow-lg transition-all cursor-pointer"
      style={{ borderColor: '#E0E8F0' }}
    >
      {/* Header com Nome + [estrela | flag] */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs truncate" style={{ color: '#001F3F' }}>
            {client.nome}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{client.codigoCliente}</p>
        </div>

        {/* Canto superior direito: estrela + flag */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasFlag && client.estrela && (
            <span title="Destaque">
              <Star
                className="w-3.5 h-3.5 fill-current"
                style={{ color: '#F59E0B' }}
              />
            </span>
          )}
          {hasFlag && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded leading-none"
              style={{ backgroundColor: flagStyle!.bg, color: flagStyle!.color }}
              title={client.flag}
            >
              {client.flag}
            </span>
          )}
        </div>
      </div>

      {/* Informações Principais em Grid */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        {/* Placas */}
        <div className="bg-gray-50 rounded p-1">
          <p className="text-xs text-gray-600">Placas</p>
          <p className="font-bold text-xs" style={{ color: '#001F3F' }}>
            {client.placas}
          </p>
        </div>

        {/* Último Boleto */}
        <div className="bg-gray-50 rounded p-1">
          <p className="text-xs text-gray-600">Último Boleto</p>
          <p className="font-bold text-xs" style={{ color: '#001F3F' }}>
            R$ {client.ultimoBoleto.toFixed(2)}
          </p>
        </div>

        {/* Delta Consumo */}
        <div className="rounded p-1" style={{ backgroundColor: deltaColor.bg }}>
          <p className="text-xs" style={{ color: deltaColor.text }}>Delta Consumo</p>
          <p className="font-bold text-xs" style={{ color: deltaColor.text }}>
            R$ {client.deltaConsumo.toFixed(2)}
          </p>
        </div>

        {/* Situação */}
        <div className="bg-gray-50 rounded p-1">
          <p className="text-xs text-gray-600">Situação</p>
          <p className="font-bold text-xs" style={{ color: '#001F3F' }}>
            {client.situacao || '-'}
          </p>
        </div>
      </div>

      {/* Contatos */}
      <div className="grid grid-cols-3 gap-1 mb-2 text-xs">
        <div>
          <p className="text-gray-600">CSM</p>
          <p className="font-semibold" style={{ color: '#001F3F' }}>
            {client.csm || '-'}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Decisor</p>
          <p className="font-semibold" style={{ color: '#001F3F' }}>
            {client.decisor || '-'}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Comercial</p>
          <p className="font-semibold" style={{ color: '#001F3F' }}>
            {client.comercial || '-'}
          </p>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="space-y-1 text-xs mb-2 pb-2 border-b" style={{ borderColor: '#E0E8F0' }}>
        {client.valorMedioPorPlaca > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Valor Médio/Placa:</span>
            <span className="font-medium">R$ {client.valorMedioPorPlaca.toFixed(2)}</span>
          </div>
        )}
        {client.percentualDesatualizado > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">% Desatualizado:</span>
            <span className="font-medium">{client.percentualDesatualizado.toFixed(2)}%</span>
          </div>
        )}
        {client.unidadesDesatualizadas > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Unidades Desatualizadas:</span>
            <span className="font-medium">{client.unidadesDesatualizadas}</span>
          </div>
        )}
        {client.ultimoContato && (
          <div className="flex justify-between">
            <span className="text-gray-600">Último Contato:</span>
            <span className="font-medium">{client.ultimoContato}</span>
          </div>
        )}
      </div>

      {/* Footer com WhatsApp + Atendimento */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded py-2 flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          title="Enviar WhatsApp"
        >
          <MessageCircle size={16} />
          WhatsApp
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAtendimento?.(client);
          }}
          className="flex-1 text-white rounded py-2 flex items-center justify-center gap-2 transition-colors text-sm font-medium hover:opacity-90"
          style={{ backgroundColor: '#1D4ED8' }}
          title="Registrar Atendimento"
        >
          <Headphones size={16} />
          Atendimento
        </button>
      </div>
    </div>
  );
}
