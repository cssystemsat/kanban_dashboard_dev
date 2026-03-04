import { ClientData } from '@/hooks/useKanbanData';
import { Calendar, Truck, AlertCircle, DollarSign, Flag, User, Briefcase, Heart, MessageCircle, TrendingUp, TrendingDown, X } from 'lucide-react';
import { useState } from 'react';
import { useAgendaData, isAgendaOutdated, getDaysSinceUpdate } from '@/hooks/useAgendaData';

interface ClientCardProps {
  client: ClientData;
}

export default function ClientCard({ client }: ClientCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isOverdue = client.marcoStatus === 'atrasado';
  const { entry: agendaEntry, loading: agendaLoading } = useAgendaData(client.nome);
  const semAtualizacao = isAgendaOutdated(agendaEntry, agendaLoading);
  const diasSemAtualizar = getDaysSinceUpdate(agendaEntry);

  const badgeColor = isOverdue
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-green-50 border-green-200 text-green-700';

  const badgeText = isOverdue ? 'Atrasado' : 'No prazo';

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

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Não abrir tooltip - deixar o parent (KanbanColumn) lidar com o clique
  };

  return (
    <div
      className="relative"
    >
      <div
        className={`
          bg-white rounded-lg border p-3 
          transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
          flex flex-col gap-2 shadow-sm cursor-pointer
        `}
        style={{ borderColor: '#E0E8F0' }}
      >
        {/* Header com ícone WhatsApp, nome e badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            {/* Ícone WhatsApp pequeno na frente do nome */}
            {client.whatsappGrupo && (
              <button
                onClick={handleWhatsAppGrupo}
                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all hover:opacity-80 hover:scale-110"
                style={{ backgroundColor: '#25D366' }}
                title="Abrir grupo do WhatsApp"
              >
                <MessageCircle className="w-3 h-3 text-white" />
              </button>
            )}
            {!client.whatsappGrupo && client.whatsapp && (
              <button
                onClick={handleWhatsApp}
                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all hover:opacity-80 hover:scale-110"
                style={{ backgroundColor: '#25D366' }}
                title="Enviar WhatsApp"
              >
                <MessageCircle className="w-3 h-3 text-white" />
              </button>
            )}
            {!client.whatsappGrupo && !client.whatsapp && (
              <div className="flex-shrink-0 w-5 h-5" />
            )}
            
            {/* Nome do cliente */}
            <h3 className="font-bold text-xs flex-1 leading-tight" style={{ color: '#001F3F' }}>
              {client.nome}
            </h3>
          </div>
          
          {/* Badge de status */}
          <div
            className={`
              px-2 py-0.5 rounded text-xs font-600 border whitespace-nowrap flex-shrink-0
              ${badgeColor}
            `}
          >
            {badgeText}
          </div>
        </div>

        {/* Entrada com dias corridos */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: '#00DD00' }} />
          <span style={{ color: '#4A5F7F' }}>
            <span className="font-600" style={{ color: '#001F3F' }}>{client.entrada}</span>
            <span className="ml-1" style={{ color: '#9CA3AF' }}>({client.diasCorridos}d)</span>
          </span>
        </div>

        {/* Quantidade de placas */}
        <div className="flex items-center gap-2 text-xs">
          <Truck className="w-3 h-3 flex-shrink-0" style={{ color: '#00DD00' }} />
          <span style={{ color: '#4A5F7F' }}>
            <span className="font-600" style={{ color: '#001F3F' }}>{client.urs}</span>
            <span className="ml-1" style={{ color: '#9CA3AF' }}>placas</span>
          </span>
        </div>

        {/* % Desatualizado */}
        {client.percentualDesatualizado && client.percentualDesatualizado > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle
              className="w-3 h-3 flex-shrink-0"
              style={{ color: client.percentualDesatualizado > 30 ? '#FF6B6B' : '#9CA3AF' }}
            />
            <span style={{ color: '#4A5F7F' }}>
              <span
                className="font-600"
                style={{ color: client.percentualDesatualizado > 30 ? '#FF6B6B' : '#4A5F7F' }}
              >
                {client.percentualDesatualizado.toFixed(1)}%
              </span>
              <span className="ml-1" style={{ color: '#9CA3AF' }}>desatualizados</span>
            </span>
          </div>
        )}

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

        {/* Informacoes de Boleto */}
        {(client.ultimoBoleto || client.consumo || client.deltaConsumo) && (
          <div className="flex flex-col gap-1 text-xs">
            {client.ultimoBoleto && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 flex-shrink-0" style={{ color: '#00DD00' }} />
                <span style={{ color: '#4A5F7F' }}>
                  <span className="font-600" style={{ color: '#001F3F' }}>Boleto:</span>
                  <span className="ml-1" style={{ color: '#4A5F7F' }}>{client.ultimoBoleto}</span>
                </span>
              </div>
            )}
            {client.consumo && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 flex-shrink-0" style={{ color: '#00DD00' }} />
                <span style={{ color: '#4A5F7F' }}>
                  <span className="font-600" style={{ color: '#001F3F' }}>Consumo:</span>
                  <span className="ml-1" style={{ color: '#4A5F7F' }}>{client.consumo}</span>
                </span>
              </div>
            )}
            {client.deltaConsumo && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 flex-shrink-0" style={{ color: client.deltaConsumo.startsWith('-') ? '#EF4444' : '#10B981' }} />
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

        {/* Alerta: sem atualização operacional há mais de 30 dias */}
        {!agendaLoading && semAtualizacao && (
          <div
            className="flex items-center gap-2 text-xs px-2 py-1 rounded"
            style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}
            title={agendaEntry ? `Última atualização há ${diasSemAtualizar} dias` : 'Sem registro na aba Agendas'}
          >
            <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: '#F97316' }} />
            <span style={{ color: '#9A3412' }}>
              {agendaEntry
                ? `Sem atualiz. há ${diasSemAtualizar}d`
                : 'Sem registro operacional'}
            </span>
          </div>
        )}

        {/* Ganho e Perda de URs */}
        <div className="flex gap-2 text-xs">
          {client.ganhoUrs && (
            <div className="flex items-center gap-1 flex-1">
              <TrendingUp className="w-3 h-3 flex-shrink-0" style={{ color: '#10B981' }} />
              <span style={{ color: '#10B981' }}>+{client.ganhoUrs}</span>
            </div>
          )}
          {client.perdaUrs && (
            <div className="flex items-center gap-1 flex-1">
              <TrendingDown className="w-3 h-3 flex-shrink-0" style={{ color: '#EF4444' }} />
              <span style={{ color: '#EF4444' }}>-{client.perdaUrs}</span>
            </div>
          )}
        </div>


      </div>

      {/* Tooltip desabilitado - usar modal em vez disso */}
      {false && (
        <div 
          className="absolute left-0 right-0 top-0 z-50 rounded-lg p-3 text-xs shadow-lg border" 
          style={{ backgroundColor: '#001F3F', borderColor: '#00DD00', color: '#FFFFFF' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botão Fechar */}
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 p-1 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>

          {/* CSM */}
          {client.atendente && (
            <div className="flex items-start gap-2 mb-2">
              <User className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#00DD00' }} />
              <div>
                <p className="font-600" style={{ color: '#E0E8F0' }}>CSM</p>
                <p style={{ color: '#FFFFFF' }}>{client.atendente}</p>
              </div>
            </div>
          )}

          {/* Red Flag */}
          {client.redFlag && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 107, 107, 0.2)' }}>
              <Flag className="w-3 h-3 flex-shrink-0" style={{ color: '#FF6B6B' }} />
              <span className="font-600" style={{ color: '#FF6B6B' }}>Red Flag Ativa</span>
            </div>
          )}

          {/* Comercial */}
          {client.comercial && (
            <div className="flex items-start gap-2 mb-2">
              <Briefcase className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#00DD00' }} />
              <div>
                <p className="font-600" style={{ color: '#E0E8F0' }}>Comercial</p>
                <p style={{ color: '#FFFFFF' }}>{client.comercial}</p>
              </div>
            </div>
          )}

          {/* Saúde do Cliente */}
          {client.saude && (
            <div className="flex items-start gap-2 mb-2">
              <Heart className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#00DD00' }} />
              <div>
                <p className="font-600" style={{ color: '#E0E8F0' }}>Saúde</p>
                <p style={{ color: '#FFFFFF' }}>{client.saude}</p>
              </div>
            </div>
          )}

          {/* Decisor */}
          {client.decisor && (
            <div className="flex items-start gap-2 mb-2">
              <User className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#00DD00' }} />
              <div>
                <p className="font-600" style={{ color: '#E0E8F0' }}>Decisor</p>
                <p style={{ color: '#FFFFFF' }}>{client.decisor}</p>
              </div>
            </div>
          )}

          {/* Botão WhatsApp do Decisor (se houver) */}
          {client.whatsapp && (
            <button
              onClick={handleWhatsApp}
              className="w-full mt-2 px-2 py-1 rounded text-xs font-600 transition-colors hover:opacity-80 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp Decisor
            </button>
          )}

          {/* Botão Grupo WhatsApp */}
          {client.whatsappGrupo && (
            <button
              onClick={handleWhatsAppGrupo}
              className="w-full mt-2 px-2 py-1 rounded text-xs font-600 transition-colors hover:opacity-80 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
            >
              <MessageCircle className="w-3 h-3" />
              Grupo WhatsApp
            </button>
          )}

          {/* Botão Bitrix */}
          {client.bitrixLink && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(client.bitrixLink, '_blank');
              }}
              className="w-full mt-2 px-2 py-1 rounded text-xs font-600 transition-colors hover:opacity-80"
              style={{ backgroundColor: '#00DD00', color: '#001F3F' }}
            >
              Bitrix
            </button>
          )}
        </div>
      )}
    </div>
  );
}
