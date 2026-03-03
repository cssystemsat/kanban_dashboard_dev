import { Calendar, X } from 'lucide-react';
import { useState } from 'react';

interface DateFilterProps {
  onDateChange: (startDate: Date | null, endDate: Date | null) => void;
  onPresetChange?: (preset: string) => void;
}

export default function DateFilter({ onDateChange, onPresetChange }: DateFilterProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  // Calcular datas para presets
  const getPresetDates = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
  };

  // Aplicar preset
  const applyPreset = (days: number) => {
    const { start, end } = getPresetDates(days);
    setActivePreset(`${days}d`);
    setShowCustom(false);
    setStartDate('');
    setEndDate('');
    onDateChange(start, end);
    onPresetChange?.(`${days}d`);
  };

  // Aplicar filtro customizado
  const applyCustom = () => {
    if (!startDate || !endDate) {
      alert('Por favor, selecione data inicial e final');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      alert('Data inicial não pode ser maior que data final');
      return;
    }

    setActivePreset(null);
    onDateChange(start, end);
  };

  // Limpar filtro
  const clearFilter = () => {
    setActivePreset(null);
    setShowCustom(false);
    setStartDate('');
    setEndDate('');
    onDateChange(null, null);
  };

  // Formatar data para display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white rounded-lg p-6 border shadow-sm mb-6" style={{ borderColor: '#E0E8F0' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: '#00DD00' }} />
          <h3 className="text-lg font-bold" style={{ color: '#001F3F' }}>
            Filtro por Data de Entrada
          </h3>
        </div>
        {activePreset || startDate || endDate ? (
          <button
            onClick={clearFilter}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        ) : null}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => applyPreset(7)}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activePreset === '7d'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          Últimos 7 dias
        </button>

        <button
          onClick={() => applyPreset(30)}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activePreset === '30d'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          Últimos 30 dias
        </button>

        <button
          onClick={() => applyPreset(90)}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activePreset === '90d'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          Últimos 90 dias
        </button>

        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            showCustom
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          Período Customizado
        </button>
      </div>

      {/* Seletor Customizado */}
      {showCustom && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E0E8F0' }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E0E8F0' }}
              />
            </div>
          </div>

          <button
            onClick={applyCustom}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Aplicar Filtro
          </button>
        </div>
      )}

      {/* Resumo do Filtro Ativo */}
      {(activePreset || startDate || endDate) && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold" style={{ color: '#001F3F' }}>Filtro Ativo:</span>
            {activePreset === '7d' && ' Últimos 7 dias'}
            {activePreset === '30d' && ' Últimos 30 dias'}
            {activePreset === '90d' && ' Últimos 90 dias'}
            {startDate && endDate && !activePreset && ` ${formatDate(new Date(startDate))} até ${formatDate(new Date(endDate))}`}
          </p>
        </div>
      )}
    </div>
  );
}
