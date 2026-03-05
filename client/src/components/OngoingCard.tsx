import { OngoingClientData } from '@/hooks/useOngoingData';
import { MessageCircle, Headphones, Star, Flag } from 'lucide-react';

interface OngoingCardProps {
  client: OngoingClientData;
  onAtendimento?: (client: OngoingClientData) => void;
}

/** Cor do ícone de bandeira para cada nível */
function getFlagColor(flag: string): string | null {
  switch (flag) {
    case 'Red Flag':    return '#DC2626';
    case 'Yellow Flag': return '#D97706';
    case 'Black Flag':  return '#1F2937';
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
  const flagColor = getFlagColor(client.flag);
  const hasFlag = !!flagColor;

  return (
    <div
      className="bg-white rounded-lg border-2 p-2 hover:shadow-lg transition-all cursor-pointer"
      style={{ borderColor: '#E0E8F0' }}
    >
      {/* Header: Nome (quebra linha) + ícones de status */}
      <div className="mb-2">
        {/* Linha de ícones de status: estrela + bandeira */}
        {hasFlag && (
          <div className="flex items-center gap-1 mb-1">
            {client.estrela && (
              <span title="Destaque">
                <Star className="w-3.5 h-3.5 fill-current" style={{ color: '#F59E0B' }} />
              </span>
            )}
            <span title={client.flag}>
              <Flag className="w-3.5 h-3.5 fill-current" style={{ color: flagColor! }} />
            </span>
          </div>
        )}

        {/* Nome — sem truncate, quebra linha */}
        <h3 className="font-bold text-xs leading-snug" style={{ color: '#001F3F', wordBreak: 'break-word' }}>
          {client.nome}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{client.codigoCliente}</p>
      </div>

      {/* Informações Principais em Grid */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        {/* Placas */}
        <div className="bg-gray-50 rounded p-1">
          <p className="text-xs text-gray-600">Placas</p>
          <p className="font-bold text-xs" style={{ color: '#001F3F' }}>{client.placas}</p>
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
          <p className="font-bold text-xs" style={{ color: '#001F3F' }}>{client.situacao || '-'}</p>
        </div>
      </div>

      {/* Contatos */}
      <div className="grid grid-cols-3 gap-1 mb-2 text-xs">
        <div>
          <p className="text-gray-600">CSM</p>
          <p className="font-semibold" style={{ color: '#001F3F' }}>{client.csm || '-'}</p>
        </div>
        <div>
          <p className="text-gray-600">Decisor</p>
          <p className="font-semibold" style={{ color: '#001F3F' }}>{client.decisor || '-'}</p>
        </div>
        <div>
          <p className="text-gray-600">Comercial</p>
          <p className="font-semibold" style={{ color: '#001F3F' }}>{client.comercial || '-'}</p>
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

      {/* Footer: WhatsApp + Atendimento */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={(e) => e.stopPropagation()}
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
