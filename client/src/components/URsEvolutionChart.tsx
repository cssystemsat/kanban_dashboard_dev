import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useURsEvolution } from '@/hooks/useURsEvolution';

interface URsEvolutionChartProps {
  codigoCliente: string;
}

export default function URsEvolutionChart({ codigoCliente }: URsEvolutionChartProps) {
  const { data, loading } = useURsEvolution(codigoCliente);
  
  if (loading) {
    return (
      <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E0E8F0' }}>
        <h4 className="text-sm font-semibold mb-3" style={{ color: '#001F3F' }}>
          Evolução de URs
        </h4>
        <div className="h-[200px] bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return null;
  }

  // Preparar dados para o gráfico
  const chartData = data.map(item => ({
    date: item.date,
    quantity: item.quantity,
    timestamp: item.timestamp,
  }));

  return (
    <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E0E8F0' }}>
      <h4 className="text-sm font-semibold mb-3" style={{ color: '#001F3F' }}>
        Evolução de URs
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E8F0" />
          <XAxis
            dataKey="date"
            stroke="#666"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#666' }}
          />
          <YAxis
            stroke="#666"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#666' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E8F0',
              borderRadius: '4px',
              padding: '8px',
            }}
            formatter={(value) => [`${value} placas`, 'Quantidade']}
            labelStyle={{ color: '#001F3F' }}
          />
          <Line
            type="monotone"
            dataKey="quantity"
            stroke="#10B981"
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
            strokeWidth={2}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
