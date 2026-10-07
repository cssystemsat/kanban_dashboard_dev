import { OngoingClientData } from "@/hooks/useOngoingData";
import { MessageCircle, Headphones, Star, Flag } from "lucide-react";
import { useState } from "react";
import { WootricClientHistoryModal } from "./WootricClientHistoryModal";
import { WootricMark } from "./WootricMark";
import { calculateOngoingHealthScore } from "@/lib/criticality";

interface OngoingCardProps {
  client: OngoingClientData;
  onAtendimento?: (client: OngoingClientData) => void;
}

/** Cor do ícone de bandeira para cada nível */
function getFlagColor(flag: string): string | null {
  switch (flag) {
    case "Red Flag":
      return "#DC2626";
    case "Yellow Flag":
      return "#D97706";
    case "Black Flag":
      return "#1F2937";
    default:
      return null;
  }
}

export default function OngoingCard({
  client,
  onAtendimento,
}: OngoingCardProps) {
  const [showWootricHistory, setShowWootricHistory] = useState(false);
  const [showScoreReasons, setShowScoreReasons] = useState(false);
  const getDeltaColor = (delta: number) => {
    if (delta > 0) return { bg: "#D1FAE5", text: "#059669" };
    if (delta < 0) return { bg: "#FEE2E2", text: "#DC2626" };
    return { bg: "#F3F4F6", text: "#6B7280" };
  };

  const deltaColor = getDeltaColor(client.deltaConsumo);
  const flagColor = getFlagColor(client.flag);
  const hasFlag = !!flagColor;
  const { score: healthScore, signals: healthSignals } =
    calculateOngoingHealthScore(client);
  const scoreTone =
    healthScore < 40
      ? { backgroundColor: "#FEE2E2", color: "#B91C1C" }
      : healthScore <= 80
        ? { backgroundColor: "#FEF3C7", color: "#92400E" }
        : { backgroundColor: "#DCFCE7", color: "#166534" };

  return (
    <div
      className="bg-white rounded-lg border-2 p-2 hover:shadow-lg transition-all cursor-pointer"
      style={{ borderColor: "#E0E8F0" }}
    >
      {/* Header: Nome (quebra linha) + bandeira + nome da flag */}
      <div className="relative mb-2">
        {/* Nome — sem truncate, quebra linha */}
        <h3
          className="pr-12 font-bold text-xs leading-snug"
          style={{ color: "#001F3F", wordBreak: "break-word" }}
        >
          {client.nome}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{client.codigoCliente}</p>
        {client.entrada && (
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="font-medium text-gray-500">Entrada:</span>{" "}
            {client.entrada}
          </p>
        )}
        {(client.cidade || client.estado) && (
          <p className="text-xs text-gray-500 mt-0.5">
            {client.cidade}
            {client.cidade && client.estado ? "/" : ""}
            {client.estado}
          </p>
        )}

        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            setShowScoreReasons(value => !value);
          }}
          className="absolute right-0 top-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-400"
          style={scoreTone}
          title="Ver motivos do Health Score"
          aria-label={`Ver motivos do Health Score ${healthScore}`}
        >
          {healthScore}
        </button>

        {/* Bandeira + nome da flag + estrela */}
        {hasFlag && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {client.estrela && (
              <span title="Destaque">
                <Star
                  className="w-3 h-3 fill-current"
                  style={{ color: "#F59E0B" }}
                />
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Flag
                className="w-3 h-3 fill-current flex-shrink-0"
                style={{ color: flagColor! }}
              />
              <span
                className="text-[10px] font-semibold leading-none"
                style={{ color: flagColor! }}
              >
                {client.flag}
              </span>
            </span>
          </div>
        )}
      </div>

      {showScoreReasons && (
        <div className="absolute right-2 top-10 z-20 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl">
          <p className="text-xs font-bold text-slate-800">Motivos do Health Score</p>
          <p className="mt-1 text-[10px] text-slate-500">Começa em 100 pontos.</p>
          {healthSignals.length === 0 ? (
            <p className="mt-2 text-xs text-emerald-700">Nenhum sinal de risco.</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {healthSignals.map(signal => (
                <div key={signal.label} className="flex items-start justify-between gap-2 text-[11px]">
                  <span className="text-slate-600">
                    {signal.label}
                    <br />
                    <span className="text-[10px] text-slate-400">{signal.value}</span>
                  </span>
                  <span className="shrink-0 font-bold text-red-600">−{signal.points.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Informações Principais em Grid */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        {/* Placas */}
        <div className="bg-gray-50 rounded p-1">
          <p className="text-xs text-gray-600">Placas</p>
          <p className="font-bold text-xs" style={{ color: "#001F3F" }}>
            {client.placas}
          </p>
        </div>

        {/* Último Boleto */}
        <div className="bg-gray-50 rounded p-1">
          <p className="text-xs text-gray-600">Último Boleto</p>
          <p className="font-bold text-xs" style={{ color: "#001F3F" }}>
            R$ {client.ultimoBoleto.toFixed(2)}
          </p>
        </div>

        {/* Delta Consumo */}
        <div className="rounded p-1" style={{ backgroundColor: deltaColor.bg }}>
          <p className="text-xs" style={{ color: deltaColor.text }}>
            Delta Consumo
          </p>
          <p className="font-bold text-xs" style={{ color: deltaColor.text }}>
            R$ {client.deltaConsumo.toFixed(2)}
          </p>
        </div>

        {/* Situação */}
        <div className="bg-gray-50 rounded p-1">
          <p className="text-xs text-gray-600">Situação</p>
          <p className="font-bold text-xs" style={{ color: "#001F3F" }}>
            {client.situacao || "-"}
          </p>
        </div>
      </div>

      {/* Contatos */}
      <div className="grid grid-cols-3 gap-1 mb-2 text-xs">
        <div>
          <p className="text-gray-600">CSM</p>
          <p className="font-semibold" style={{ color: "#001F3F" }}>
            {client.csm || "-"}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Decisor</p>
          <p className="font-semibold" style={{ color: "#001F3F" }}>
            {client.decisor || "-"}
          </p>
          {client.contatoDecissor && (
            <p className="text-[10px] text-blue-600 font-medium mt-0.5 truncate">
              {client.contatoDecissor}
            </p>
          )}
        </div>
        <div>
          <p className="text-gray-600">Comercial</p>
          <p className="font-semibold" style={{ color: "#001F3F" }}>
            {client.comercial || "-"}
          </p>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div
        className="space-y-1 text-xs mb-2 pb-2 border-b"
        style={{ borderColor: "#E0E8F0" }}
      >
        {client.valorMedioPorPlaca > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Valor Médio/Placa:</span>
            <span className="font-medium">
              R$ {client.valorMedioPorPlaca.toFixed(2)}
            </span>
          </div>
        )}
        {client.percentualDesatualizado > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">% Desatualizado:</span>
            <span className="font-medium">
              {client.percentualDesatualizado.toFixed(2)}%
            </span>
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

      {/* Footer: WhatsApp + Wootric + Atendimento */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={e => e.stopPropagation()}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded py-2 flex items-center justify-center gap-2 transition-colors text-sm font-medium"
          title="Enviar WhatsApp"
        >
          <MessageCircle size={16} />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            setShowWootricHistory(true);
          }}
          disabled={!client.centralId}
          className="shrink-0 rounded p-2 transition-all hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: "#EAF3FF" }}
          title={
            client.centralId
              ? "Ver avaliações Wootric"
              : "ID central não disponível para buscar avaliações"
          }
          aria-label={`Ver avaliações Wootric de ${client.nome}`}
        >
          <WootricMark className="h-5 w-5" />
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onAtendimento?.(client);
          }}
          className="flex-1 text-white rounded py-2 flex items-center justify-center gap-2 transition-colors text-sm font-medium hover:opacity-90"
          style={{ backgroundColor: "#1D4ED8" }}
          title="Registrar Atendimento"
        >
          <Headphones size={16} />
          Atendimento
        </button>
      </div>
      {showWootricHistory && (
        <WootricClientHistoryModal
          clientName={client.nome}
          centralId={client.centralId}
          open
          onClose={() => setShowWootricHistory(false)}
        />
      )}
    </div>
  );
}
