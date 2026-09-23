import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

interface DateFilterCompactProps {
  onDateChange: (startDate: Date | null, endDate: Date | null) => void;
  compact?: boolean;
}

export default function DateFilterCompact({
  onDateChange,
  compact = false,
}: DateFilterCompactProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Calcular datas para presets
  const getPresetDates = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
  };

  // O construtor new Date("YYYY-MM-DD") interpreta a data como UTC e pode
  // deslocá-la para o dia anterior em fusos como o de Brasília.
  const parseDateInput = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Aplicar preset
  const applyPreset = (days: number) => {
    const { start, end } = getPresetDates(days);
    setActivePreset(`${days}d`);
    setShowCustom(false);
    setStartDate("");
    setEndDate("");
    onDateChange(start, end);
  };

  // Aplicar filtro customizado
  const applyCustom = () => {
    if (!startDate || !endDate) {
      alert("Por favor, selecione data inicial e final");
      return;
    }

    const start = parseDateInput(startDate);
    const end = parseDateInput(endDate);

    if (start > end) {
      alert("Data inicial não pode ser maior que data final");
      return;
    }

    setActivePreset(null);
    onDateChange(start, end);
    setShowCustom(false);
  };

  // Limpar filtro
  const clearFilter = () => {
    setActivePreset(null);
    setShowCustom(false);
    setStartDate("");
    setEndDate("");
    onDateChange(null, null);
  };

  // Obter label do preset ativo
  const getPresetLabel = () => {
    if (activePreset === "7d") return "Últimos 7d";
    if (activePreset === "30d") return "Últimos 30d";
    if (activePreset === "60d") return "Últimos 60d";
    if (activePreset === "90d") return "Últimos 90d";
    if (activePreset === "7d-contract") return "7+ dias";
    if (activePreset === "30d-contract") return "30+ dias";
    if (activePreset === "60d-contract") return "60+ dias";
    if (activePreset === "90d-contract") return "90+ dias";
    if (startDate && endDate) {
      const start = parseDateInput(startDate).toLocaleDateString("pt-BR", {
        month: "2-digit",
        day: "2-digit",
      });
      const end = parseDateInput(endDate).toLocaleDateString("pt-BR", {
        month: "2-digit",
        day: "2-digit",
      });
      return `${start} - ${end}`;
    }
    return "Data";
  };

  return (
    <div className="relative">
      {/* Botão Principal */}
      <button
        onClick={() => setShowCustom(!showCustom)}
        className={`flex items-center justify-center gap-1 rounded-md font-semibold transition-all whitespace-nowrap ${
          compact ? "h-7 min-w-[76px] px-2 text-xs" : "gap-2 px-3 py-2 text-sm"
        } ${
          activePreset || startDate || endDate
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
        }`}
      >
        <Calendar className={compact ? "w-3 h-3" : "w-4 h-4"} />
        {getPresetLabel()}
        <ChevronDown className={compact ? "w-3 h-3" : "w-4 h-4"} />
      </button>

      {/* Menu Dropdown */}
      {showCustom &&
        typeof document !== "undefined" &&
        createPortal(
        <div className="fixed right-2 top-12 z-[200] max-h-[calc(100vh-4rem)] min-w-72 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-2xl">
          {/* Filtro 1 */}
          <div className="p-3 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2 px-2">
              Filtro 1
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => applyPreset(7)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left ${
                  activePreset === "7d"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Últimos 7 dias
              </button>

              <button
                onClick={() => applyPreset(30)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left ${
                  activePreset === "30d"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Últimos 30 dias
              </button>

              <button
                onClick={() => applyPreset(60)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left ${
                  activePreset === "60d"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Últimos 60 dias
              </button>

              <button
                onClick={() => applyPreset(90)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left ${
                  activePreset === "90d"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Últimos 90 dias
              </button>
            </div>
          </div>

          {/* Filtro 2 */}
          <div className="p-3 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2 px-2">
              Filtro 2
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const start7 = new Date();
                  start7.setDate(start7.getDate() - 7);
                  setActivePreset("7d-contract");
                  setShowCustom(false);
                  onDateChange(new Date(0), start7);
                }}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left ${
                  activePreset === "7d-contract"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                7+ dias de contrato
              </button>

              <button
                onClick={() => {
                  const start30 = new Date();
                  start30.setDate(start30.getDate() - 30);
                  setActivePreset("30d-contract");
                  setShowCustom(false);
                  onDateChange(new Date(0), start30);
                }}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left ${
                  activePreset === "30d-contract"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                30+ dias de contrato
              </button>

              <button
                onClick={() => {
                  const today = new Date();
                  const start60 = new Date();
                  start60.setDate(start60.getDate() - 60);
                  setActivePreset("60d-contract");
                  setShowCustom(false);
                  onDateChange(new Date(0), start60);
                }}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left ${
                  activePreset === "60d-contract"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                60+ dias de contrato
              </button>

              <button
                onClick={() => {
                  const today = new Date();
                  const start90 = new Date();
                  start90.setDate(start90.getDate() - 90);
                  setActivePreset("90d-contract");
                  setShowCustom(false);
                  onDateChange(new Date(0), start90);
                }}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors text-left ${
                  activePreset === "90d-contract"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                90+ dias de contrato
              </button>
            </div>
          </div>

          {/* Período Customizado */}
          <div className="p-3 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2 px-2">
              Período Customizado
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Data Inicial"
              />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Data Final"
              />
              <button
                onClick={applyCustom}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-sm transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Botão Limpar */}
          {(activePreset || startDate || endDate) && (
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={clearFilter}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Limpar Filtro
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
