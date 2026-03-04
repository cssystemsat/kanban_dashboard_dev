import { ClientData } from '@/hooks/useKanbanData';
import { X, Calendar, Truck, AlertCircle, DollarSign, Flag, User, Briefcase, Heart, MessageCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useMemo } from 'react';
import URsEvolutionChart from './URsEvolutionChart';
import { useURsEvolution } from '@/hooks/useURsEvolution';
import { useAgendaData } from '@/hooks/useAgendaData';

interface ClientDetailsModalProps {
  client: ClientData;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientDetailsModal({ client, isOpen, onClose }: ClientDetailsModalProps) {
  if (!isOpen) return null;

  const { data: clientEvolutionData } = useURsEvolution(client.codigoCliente);
  const { entry: agendaEntry, loading: agendaLoading } = useAgendaData(client.nome);

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

  const handleBitrix = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.bitrixLink) {
      window.open(client.bitrixLink, '_blank');
    }
  };

  return (
    <>
      {/* Overlay - Removido para deixar transparente */}

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4"
          style={{ borderColor: '#0066CC' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="sticky top-0 flex items-center justify-between p-6 border-b"
            style={{ backgroundColor: '#001F3F', borderColor: '#00DD00' }}
          >
            <div className="flex items-center gap-3 flex-1">
              {client.whatsappGrupo && (
                <button
                  onClick={handleWhatsAppGrupo}
                  className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center transition-all hover:opacity-80 hover:scale-110"
                  style={{ backgroundColor: '#25D366' }}
                  title="Abrir grupo do WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                </button>
              )}
              {!client.whatsappGrupo && client.whatsapp && (
                <button
                  onClick={handleWhatsApp}
                  className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center transition-all hover:opacity-80 hover:scale-110"
                  style={{ backgroundColor: '#25D366' }}
                  title="Enviar WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                </button>
              )}
              <h2 className="text-xl font-bold text-white">{client.nome}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:opacity-70 transition-opacity text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <div
                className={`
                  px-3 py-1 rounded-full text-sm font-600
                  ${client.marcoStatus === 'atrasado' 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                  }
                `}
              >
                {client.marcoStatus === 'atrasado' ? 'Atrasado' : 'No prazo'}
              </div>
              {client.redFlag && (
                <div className="px-3 py-1 rounded-full text-sm font-600 bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
                  <Flag className="w-3 h-3" />
                  Red Flag
                </div>
              )}
            </div>

            {/* Grid de Informações - Entrada, Placas, Marco, Desatualizados */}
            <div className="grid grid-cols-2 gap-4">
              {/* Entrada */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" style={{ color: '#00DD00' }} />
                  <p className="text-xs font-semibold text-gray-600">Data de Entrada</p>
                </div>
                <p className="text-sm font-bold" style={{ color: '#001F3F' }}>{client.entrada}</p>
                <p className="text-xs text-gray-500 mt-1">{client.diasCorridos} dias</p>
              </div>

              {/* URs */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4" style={{ color: '#00DD00' }} />
                  <p className="text-xs font-semibold text-gray-600">Placas (URs)</p>
                </div>
                <p className="text-sm font-bold" style={{ color: '#001F3F' }}>{client.urs}</p>
              </div>

              {/* Marco Atual */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" style={{ color: '#00DD00' }} />
                  <p className="text-xs font-semibold text-gray-600">Marco Atual</p>
                </div>
                <p className="text-sm font-bold" style={{ color: '#001F3F' }}>Marco {client.marco}</p>
                {client.marcoData && <p className="text-xs text-gray-500 mt-1">{client.marcoData}</p>}
              </div>

              {/* Rastreadores */}
              {client.rastreadores && client.rastreadores !== '0' && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-xs font-semibold text-gray-600">Desatualizados</p>
                  </div>
                  <p className="text-sm font-bold text-red-600">{client.rastreadores}</p>
                </div>
              )}

              {/* Ganho/Perda URs */}
              {(client.ganhoUrs || client.perdaUrs) && (
                <>
                  {client.ganhoUrs && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#F0FFF4' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4" style={{ color: '#10B981' }} />
                        <p className="text-xs font-semibold text-gray-600">Ganho URs</p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: '#10B981' }}>+{client.ganhoUrs}</p>
                    </div>
                  )}
                  {client.perdaUrs && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <p className="text-xs font-semibold text-gray-600">Perda URs</p>
                      </div>
                      <p className="text-sm font-bold text-red-600">-{client.perdaUrs}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Informações em Grid Horizontal - CSM, Decisor, Comercial, Último Boleto */}
            <div className="grid grid-cols-4 gap-3 border-t pt-4" style={{ borderColor: '#E0E8F0' }}>
              {client.atendente && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" style={{ color: '#00DD00' }} />
                    <p className="text-xs font-semibold text-gray-600">CSM</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: '#001F3F' }}>{client.atendente}</p>
                </div>
              )}

              {client.decisor && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" style={{ color: '#00DD00' }} />
                    <p className="text-xs font-semibold text-gray-600">Decisor</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: '#001F3F' }}>{client.decisor}</p>
                </div>
              )}

              {client.comercial && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4" style={{ color: '#00DD00' }} />
                    <p className="text-xs font-semibold text-gray-600">Comercial</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: '#001F3F' }}>{client.comercial}</p>
                </div>
              )}

              {client.ultimoBoleto && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4" style={{ color: '#00DD00' }} />
                    <p className="text-xs font-semibold text-gray-600">Último Boleto</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: '#001F3F' }}>{client.ultimoBoleto}</p>
                </div>
              )}
            </div>

            {/* Saúde - Linha separada se existir */}
            {client.saude && (
              <div className="flex items-start gap-3 border-t pt-4" style={{ borderColor: '#E0E8F0' }}>
                <Heart className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#00DD00' }} />
                <div>
                  <p className="text-xs font-semibold text-gray-600">Saúde</p>
                  <p className="text-sm" style={{ color: '#001F3F' }}>{client.saude}</p>
                </div>
              </div>
            )}

            {/* Objetivos (Tags) */}
            {client.tags && Array.isArray(client.tags) && client.tags.length > 0 && (
              <div className="flex items-start gap-3 border-t pt-4" style={{ borderColor: '#E0E8F0' }}>
                <Briefcase className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#00DD00' }} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Objetivos (Tags)</p>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: '#E0F2FE', color: '#001F3F', border: '1px solid #00DD00' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Informações Adicionais - Tipo de Cliente, Persona, Tags, Cidade */}
            {(client.tipoCliente || client.persona || client.tagsCliente || client.cidade) && (
              <div className="grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: '#E0E8F0' }}>
                {client.tipoCliente && (
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Tipo de Cliente</p>
                    <p className="text-sm font-bold" style={{ color: '#001F3F' }}>{client.tipoCliente}</p>
                  </div>
                )}
                {client.persona && (
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Persona</p>
                    <p className="text-sm font-bold" style={{ color: '#001F3F' }}>{client.persona}</p>
                  </div>
                )}
                {client.tagsCliente && (
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Tags</p>
                    <p className="text-sm font-bold" style={{ color: '#001F3F' }}>{client.tagsCliente}</p>
                  </div>
                )}
                {client.cidade && (
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#F5F7FA' }}>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Cidade</p>
                    <p className="text-sm font-bold" style={{ color: '#001F3F' }}>{client.cidade}</p>
                  </div>
                )}
              </div>
            )}

            {/* Última Atualização Operacional (Agendas) */}
            {!agendaLoading && agendaEntry && (
              <div className="flex items-start gap-3 border-t pt-4" style={{ borderColor: '#E0E8F0' }}>
                <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#00DD00' }} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600">
                    Última atualização operacional ({agendaEntry.data})
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#001F3F' }}>{agendaEntry.status}</p>
                </div>
              </div>
            )}

            {/* Gráfico de Evolução de URs */}
            {clientEvolutionData.length > 0 && (
              <div className="border-t pt-4" style={{ borderColor: '#E0E8F0' }}>
                <URsEvolutionChart codigoCliente={client.codigoCliente} />
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-2 border-t pt-4" style={{ borderColor: '#E0E8F0' }}>
              {client.whatsapp && (
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-600 transition-colors hover:opacity-80 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Decisor
                </button>
              )}

              {client.whatsappGrupo && (
                <button
                  onClick={handleWhatsAppGrupo}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-600 transition-colors hover:opacity-80 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Grupo WhatsApp
                </button>
              )}

              {client.bitrixLink && (
                <button
                  onClick={handleBitrix}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-600 transition-colors hover:opacity-80"
                  style={{ backgroundColor: '#00DD00', color: '#001F3F' }}
                >
                  Bitrix
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
