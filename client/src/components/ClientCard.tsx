import { ClientData } from '@/hooks/useKanbanData';
import { Calendar, Truck, AlertCircle, DollarSign, Flag, User, Briefcase, Heart, MessageCircle, TrendingUp, TrendingDown, X, Headphones, Star, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { useAgendaData, isAgendaOutdated, getDaysSinceUpdate } from '@/hooks/useAgendaData';

interface ClientCardProps {
  client: ClientData;
  onAtendimento?: (client: ClientData) => void;
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

export default function ClientCard({ client, onAtendimento }: ClientCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isOverdue = client.marcoStatus === 'atrasado';
  const { entry: agendaEntry, loading: agendaLoading } = useAgendaData(client.nome);
  const semAtualizacao = isAgendaOutdated(agendaEntry, agendaLoading);
  const diasSemAtualizar = getDaysSinceUpdate(agendaEntry);

  const flagColor = getFlagColor(client.flag);
  const hasFlag = !!flagColor;

  // Verificar se cliente tem >60 dias e <30 placas
  const diasCorridos = parseInt(String(client.diasCorridos || 0));
  const urs = parseInt(String(client.urs || 0));
  const shouldHighlightRedBorder = diasCorridos > 60 && urs < 30;

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.whatsapp) {
      const phone = client.whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  const handleWhatsAppGrupo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.whatsappGrupo) {
      window.open(client.whatsappGrupo, '_blank');
    }
  };

  return (
    <div className="relative">
      <div
        className="bg-white rounded-lg border p-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-1 shadow-sm cursor-pointer"
        style={{ borderColor: shouldHighlightRedBorder ? '#DC2626' : '#E0E8F0', borderWidth: shouldHighlightRedBorder ? '2px' : '1px' }}
      >
        {/* Linha 1: nome (sem truncate, quebra linha) */}
        <div className="flex items-start gap-1">
          {/* Nome — quebra linha, não trunca, alinhado à esquerda */}
          <h3 className="font-bold text-xs leading-snug flex-1 text-left" style={{ color: '#001F3F', wordBreak: 'break-word' }}>
            {client.nome}
          </h3>

          {/* Ganho e Perda de URs — canto superior direito */}
          {(client.ganhoUrs || client.perdaUrs) && (
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              {client.ganhoUrs && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold leading-none" style={{ color: '#10B981' }}>
                  <TrendingUp className="w-3 h-3" />
                  +{client.ganhoUrs}
                </span>
              )}
              {client.perdaUrs && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold leading-none" style={{ color: '#EF4444' }}>
                  <TrendingDown className="w-3 h-3" />
                  -{client.perdaUrs}
                </span>
              )}
            </div>
          )}
        </div>

          {/* Linha 2: bandeira + nome da flag + No prazo/Atrasado */}
        <div className="flex items-center gap-0.5 flex-wrap">
          {/* Estrela — só se houver flag */}
          {hasFlag && client.estrela && (
            <span title="Destaque">
              <Star className="w-3 h-3 fill-current" style={{ color: '#F59E0B' }} />
            </span>
          )}

          {/* Bandeira + nome da flag */}
          {hasFlag && (
            <span className="flex items-center gap-0.5">
              <Flag className="w-3 h-3 fill-current flex-shrink-0" style={{ color: flagColor! }} />
              <span className="text-[10px] font-semibold leading-none" style={{ color: flagColor! }}>
                {client.flag}
              </span>
            </span>
          )}

          {/* No prazo / Atrasado */}
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none"
            style={{
              backgroundColor: isOverdue ? '#FEE2E2' : '#D1FAE5',
              color: isOverdue ? '#DC2626' : '#059669',
            }}
          >
            {isOverdue ? 'Atrasado' : 'No prazo'}
          </span>
        </div>

        {/* Entrada com dias corridos */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: '#00DD00' }} />
          <span style={{ color: '#4A5F7F' }}>
            <span className="font-600" style={{ color: '#001F3F' }}>{client.entrada}</span>
            <span className="ml-1" style={{ color: '#9CA3AF' }}>({client.diasCorridos}d)</span>
          </span>
        </div>

        {/* Cidade/Estado */}
        {(client.cidade || client.estado) && (
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            {client.cidade}{client.cidade && client.estado ? '/' : ''}{client.estado}
          </div>
        )}

        {/* Quantidade de placas + % Desatualizado na mesma linha */}
        <div className="flex items-center gap-2 text-xs">
          <Truck className="w-3 h-3 flex-shrink-0" style={{ color: '#00DD00' }} />
          <span className="font-600" style={{ color: '#001F3F' }}>{client.urs}</span>
          <span style={{ color: '#9CA3AF' }}>|</span>
          <span
            className="font-600"
            style={{ color: (client.percentualDesatualizado || 0) > 30 ? '#FF6B6B' : '#4A5F7F' }}
          >
            {((client.percentualDesatualizado || 0).toFixed(1))}%
          </span>
          <span style={{ color: '#9CA3AF' }}>desatualizadas</span>
        </div>

        {/* Último contato em dias */}
        {client.diasUltimoContato !== undefined && client.diasUltimoContato >= 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: '#4A5F7F' }} />
            <span style={{ color: '#4A5F7F' }}>
              <span className="font-600" style={{ color: '#001F3F' }}>{client.diasUltimoContato}d</span>
              <span className="ml-1" style={{ color: '#9CA3AF' }}>desde último contato</span>
            </span>
          </div>
        )}
        {/* Informações de Boleto */}
        {(client.ultimoBoleto || client.consumo || client.deltaConsumo) && (
          <div className="flex flex-col gap-0 text-xs">            {client.ultimoBoleto && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 flex-shrink-0" style={{ color: '#00DD00' }} />
                <span style={{ color: '#4A5F7F' }}>
                  <span className="font-600" style={{ color: '#001F3F' }}>Boleto:</span>
                  <span className="ml-1">{client.ultimoBoleto}</span>
                </span>
              </div>
            )}
            {client.consumo && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 flex-shrink-0" style={{ color: '#00DD00' }} />
                <span style={{ color: '#4A5F7F' }}>
                  <span className="font-600" style={{ color: '#001F3F' }}>Consumo:</span>
                  <span className="ml-1">{client.consumo}</span>
                </span>
              </div>
            )}
            {client.deltaConsumo && (
              <div className="flex items-center gap-2">
                <DollarSign
                  className="w-3 h-3 flex-shrink-0"
                  style={{ color: client.deltaConsumo.startsWith('-') ? '#EF4444' : '#10B981' }}
                />
                <span style={{
                  color: client.deltaConsumo.startsWith('-') ? '#EF4444' : '#10B981',
                  fontWeight: '600'
                }}>
                  Diferenca: {client.deltaConsumo}
                </span>
              </div>
            )}
          </div>
        )}



        {/* Botões de Ação */}
        <div className="flex items-center gap-1.5 mt-1">
          {/* Botão WhatsApp */}
          {client.whatsappGrupo ? (
            <button
              onClick={handleWhatsAppGrupo}
              className="flex-1 flex items-center justify-center p-1.5 rounded transition-all hover:opacity-90 hover:shadow-sm active:scale-95"
              style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
              title="Abrir grupo do WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          ) : client.whatsapp ? (
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center p-1.5 rounded transition-all hover:opacity-90 hover:shadow-sm active:scale-95"
              style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
              title="Enviar WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          ) : null}
          
          {/* Botão Atendimento */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAtendimento?.(client);
            }}
            className="flex-1 flex items-center justify-center p-1.5 rounded transition-all hover:opacity-90 hover:shadow-sm active:scale-95"
            style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
            title="Registrar atendimento"
          >
            <Headphones className="w-4 h-4" />
          </button>
          
          {/* Botão Dashboard */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Ação do dashboard será implementada depois
            }}
            className="flex-1 flex items-center justify-center p-1.5 rounded transition-all hover:opacity-90 hover:shadow-sm active:scale-95"
            style={{ backgroundColor: '#6B7280', color: '#FFFFFF' }}
            title="Dashboard"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tooltip desabilitado */}
      {false && showTooltip && (
        <div
          className="absolute left-0 right-0 top-0 z-50 rounded-lg p-3 text-xs shadow-lg border"
          style={{ backgroundColor: '#001F3F', borderColor: '#00DD00', color: '#FFFFFF' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => setShowTooltip(false)} className="absolute top-2 right-2 p-1 hover:opacity-70 transition-opacity">
            <X className="w-4 h-4" />
          </button>
          {client.atendente && (
            <div className="flex items-start gap-2 mb-2">
              <User className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#00DD00' }} />
              <div>
                <p className="font-600" style={{ color: '#E0E8F0' }}>CSM</p>
                <p style={{ color: '#FFFFFF' }}>{client.atendente}</p>
              </div>
            </div>
          )}
          {hasFlag && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,107,107,0.2)' }}>
              <Flag className="w-3 h-3 flex-shrink-0 fill-current" style={{ color: flagColor! }} />
              <span className="font-600" style={{ color: flagColor! }}>{client.flag}</span>
            </div>
          )}
          {client.comercial && (
            <div className="flex items-start gap-2 mb-2">
              <Briefcase className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#00DD00' }} />
              <div>
                <p className="font-600" style={{ color: '#E0E8F0' }}>Comercial</p>
                <p style={{ color: '#FFFFFF' }}>{client.comercial}</p>
              </div>
            </div>
          )}
          {client.saude && (
            <div className="flex items-start gap-2 mb-2">
              <Heart className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#00DD00' }} />
              <div>
                <p className="font-600" style={{ color: '#E0E8F0' }}>Saúde</p>
                <p style={{ color: '#FFFFFF' }}>{client.saude}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
