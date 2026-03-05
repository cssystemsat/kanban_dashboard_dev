import { OngoingClientData } from '@/hooks/useOngoingData';
import { useURsEvolution } from '@/hooks/useURsEvolution';
import URsEvolutionChart from './URsEvolutionChart';
import { X, MessageCircle } from 'lucide-react';

interface OngoingClientModalProps {
  client: OngoingClientData;
  isOpen: boolean;
  onClose: () => void;
}

export default function OngoingClientModal({
  client,
  isOpen,
  onClose,
}: OngoingClientModalProps) {


  if (!isOpen) return null;

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return { bg: '#D1FAE5', text: '#059669' };
    if (delta < 0) return { bg: '#FEE2E2', text: '#DC2626' };
    return { bg: '#F3F4F6', text: '#6B7280' };
  };

  const deltaColor = getDeltaColor(client.deltaConsumo);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ border: '2px solid #001F3F', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b sticky top-0 z-10"
          style={{ backgroundColor: '#001F3F', borderColor: '#E0E8F0' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
              style={{ backgroundColor: '#00DD00' }}
            >
              {client.nome.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-white">{client.nome}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Informações Principais em Grid 4 Colunas */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {/* CSM */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">CSM</p>
              <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>
                {client.csm || '-'}
              </p>
            </div>

            {/* Decisor */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Decisor</p>
              <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>
                {client.decisor || '-'}
              </p>
            </div>

            {/* Comercial */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Comercial</p>
              <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>
                {client.comercial || '-'}
              </p>
            </div>

            {/* Último Boleto */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Último Boleto</p>
              <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>
                R$ {client.ultimoBoleto.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Informações Secundárias */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {/* Placas */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Placas</p>
              <p className="font-bold text-lg" style={{ color: '#001F3F' }}>
                {client.placas}
              </p>
            </div>

            {/* Delta Consumo */}
            <div className="rounded-lg p-3" style={{ backgroundColor: deltaColor.bg }}>
              <p className="text-xs mb-1" style={{ color: deltaColor.text }}>
                Delta Consumo
              </p>
              <p className="font-bold text-lg" style={{ color: deltaColor.text }}>
                R$ {client.deltaConsumo.toFixed(2)}
              </p>
            </div>

            {/* Situação */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Situação</p>
              <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>
                {client.situacao || '-'}
              </p>
            </div>

            {/* Data de Entrada */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Data de Entrada</p>
              <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>
                {client.entrada || '-'}
              </p>
            </div>

            {/* Código Cliente */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Código</p>
              <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>
                {client.codigoCliente}
              </p>
            </div>

            {/* Red Flag */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Flag</p>
              <p className="font-semibold text-sm" style={{ color: client.flag ? '#DC2626' : '#059669' }}>
                {client.flag || 'Nenhuma'}
              </p>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {client.valorMedioPorPlaca > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Valor Médio/Placa</p>
                <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>
                  R$ {client.valorMedioPorPlaca.toFixed(2)}
                </p>
              </div>
            )}
            {client.percentualDesatualizado > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">% Desatualizado</p>
                <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>
                  {client.percentualDesatualizado.toFixed(2)}%
                </p>
              </div>
            )}
            {client.unidadesDesatualizadas > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Unidades Desatualizadas</p>
                <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>
                  {client.unidadesDesatualizadas}
                </p>
              </div>
            )}
            {client.ultimoContato && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Último Contato</p>
                <p className="font-semibold text-sm" style={{ color: '#001F3F' }}>
                  {client.ultimoContato}
                </p>
              </div>
            )}
          </div>

          {/* Gráfico de Evolução de URs */}
          <div className="mb-6">
            <URsEvolutionChart codigoCliente={client.codigoCliente} />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 mt-6 pt-6 border-t" style={{ borderColor: '#E0E8F0' }}>
            <button
              onClick={() => {
                // Implementar ação de WhatsApp
                window.open(`https://wa.me/?text=Olá%20${client.nome}`, '_blank');
              }}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              Enviar WhatsApp
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
