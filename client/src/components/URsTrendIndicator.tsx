import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useURsEvolution } from '@/hooks/useURsEvolution';

interface URsTrendIndicatorProps {
  codigoCliente: string;
  startDate: Date | null;
  endDate: Date | null;
}

export default function URsTrendIndicator({
  codigoCliente,
  startDate,
  endDate,
}: URsTrendIndicatorProps) {
  const { data: allData } = useURsEvolution(codigoCliente);

  if (!allData || allData.length === 0 || !startDate || !endDate) {
    return null;
  }

  // Filtrar dados dentro do período
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  const periodData = allData.filter(
    item => item.timestamp >= startTime && item.timestamp <= endTime
  );

  if (periodData.length < 2) {
    return null;
  }

  // Ordenar por data
  const sorted = [...periodData].sort((a, b) => a.timestamp - b.timestamp);
  const firstEntry = sorted[0];
  const lastEntry = sorted[sorted.length - 1];

  const startQty = firstEntry.quantity;
  const endQty = lastEntry.quantity;
  const change = endQty - startQty;
  const percentChange = startQty !== 0 ? (change / startQty) * 100 : 0;

  if (change === 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
        <Minus className="w-3 h-3 text-gray-600" />
        <span className="text-xs font-semibold text-gray-600">Estável</span>
      </div>
    );
  }

  if (change > 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-md">
        <TrendingUp className="w-3 h-3 text-green-600" />
        <span className="text-xs font-semibold text-green-600">
          +{change} ({percentChange.toFixed(1)}%)
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-md">
      <TrendingDown className="w-3 h-3 text-red-600" />
      <span className="text-xs font-semibold text-red-600">
        {change} ({percentChange.toFixed(1)}%)
      </span>
    </div>
  );
}
