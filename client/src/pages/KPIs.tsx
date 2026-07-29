import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface KPICard {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: 'good' | 'warning' | 'critical';
  description?: string;
}

interface KPIColumn {
  title: string;
  icon: string;
  kpis: KPICard[];
}

export default function KPIs() {
  const [selectedWeek, setSelectedWeek] = useState<'anterior' | 'retrasada'>('anterior');

  // Dados placeholder - serão substituídos por dados reais
  const onboardingKPIs: KPICard[] = [
    { label: 'Clientes ativos no onboarding', value: 24, status: 'good', trend: 'up', trendValue: '+3' },
    { label: 'Concluídos na semana', value: 8, status: 'good', trend: 'up', trendValue: '+2' },
    { label: 'Percentual dentro do prazo', value: '87%', status: 'good', trend: 'up', trendValue: '+5%' },
    { label: 'Tempo médio de onboarding', value: '12.5', unit: 'dias', status: 'warning', trend: 'down', trendValue: '-1.2d' },
    { label: 'Clientes parados ou atrasados', value: 3, status: 'warning', trend: 'neutral', trendValue: '0' },
    { label: 'Taxa de ativação', value: '92%', status: 'good', trend: 'up', trendValue: '+3%' },
    { label: 'Tempo até o primeiro valor', value: '4.2', unit: 'dias', status: 'good', trend: 'down', trendValue: '-0.5d' },
    { label: 'Cancelamentos ou riscos', value: 1, status: 'good', trend: 'neutral', trendValue: '0' },
    { label: 'Taxa de sucesso', value: '96%', status: 'good', trend: 'up', trendValue: '+2%' },
  ];

  const ongoingKPIs: KPICard[] = [
    { label: 'Clientes críticos', value: 5, status: 'critical', trend: 'down', trendValue: '-2' },
    { label: 'Carteira sem contato há 30+ dias', value: 12, status: 'warning', trend: 'up', trendValue: '+3' },
    { label: 'Pedidos de cancelamento', value: 2, status: 'warning', trend: 'neutral', trendValue: '0' },
    { label: 'Clientes recuperados e MRR salvo', value: '₹ 45.8k', status: 'good', trend: 'up', trendValue: '+₹8.2k' },
    { label: 'Churn de clientes', value: '2.1%', status: 'good', trend: 'down', trendValue: '-0.3%' },
    { label: 'Churn de receita', value: '1.8%', status: 'good', trend: 'down', trendValue: '-0.2%' },
    { label: 'Principais motivos de risco', value: 'Preço', status: 'warning', description: 'Falta de ROI' },
    { label: 'Oportunidades de expansão', value: 8, status: 'good', trend: 'up', trendValue: '+2' },
  ];

  const migracaoKPIs: KPICard[] = [
    { label: 'Migrações em andamento', value: 6, status: 'good', trend: 'neutral', trendValue: '0' },
    { label: 'Percentual concluído', value: '68%', status: 'good', trend: 'up', trendValue: '+12%' },
    { label: 'Migrações atrasadas', value: 2, status: 'warning', trend: 'down', trendValue: '-1' },
    { label: 'Tempo médio de migração', value: '8.3', unit: 'dias', status: 'good', trend: 'down', trendValue: '-1.1d' },
    { label: 'Erros ou retrabalho', value: 1, status: 'good', trend: 'down', trendValue: '-1' },
    { label: 'Clientes bloqueados', value: 0, status: 'good', trend: 'neutral', trendValue: '0' },
    { label: 'Tickets pós-migração', value: 4, status: 'good', trend: 'down', trendValue: '-2' },
    { label: 'CSAT da migração', value: '4.6/5', status: 'good', trend: 'up', trendValue: '+0.2' },
  ];

  const columns: KPIColumn[] = [
    { title: 'Onboarding', icon: '🚀', kpis: onboardingKPIs },
    { title: 'Ongoing', icon: '📈', kpis: ongoingKPIs },
    { title: 'Migração', icon: '🔄', kpis: migracaoKPIs },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusTextColor = (status?: string) => {
    switch (status) {
      case 'good':
        return 'text-green-700';
      case 'warning':
        return 'text-yellow-700';
      case 'critical':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <div className="ml-20 p-8" style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">KPI's de Gestão CS</h1>
        <p className="text-gray-600">Acompanhamento de indicadores de Onboarding, Ongoing e Migração</p>
      </div>

      {/* Seletor de Semana */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={() => setSelectedWeek('anterior')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            selectedWeek === 'anterior'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Semana Anterior
        </button>
        <button
          onClick={() => setSelectedWeek('retrasada')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            selectedWeek === 'retrasada'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Semana Retrasada
        </button>
      </div>

      {/* Grid de 3 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="space-y-4">
            {/* Header da Coluna */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{column.icon}</span>
                <h2 className="text-xl font-bold text-gray-900">{column.title}</h2>
              </div>
              <p className="text-sm text-gray-600">
                {column.kpis.length} indicadores
              </p>
            </div>

            {/* Cards de KPI */}
            <div className="space-y-3">
              {column.kpis.map((kpi, kpiIndex) => (
                <div
                  key={kpiIndex}
                  className={`rounded-lg border-2 p-4 transition-all hover:shadow-md ${getStatusColor(
                    kpi.status
                  )}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex-1">{kpi.label}</label>
                    {kpi.status === 'critical' && (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 ml-2" />
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-2xl font-bold ${getStatusTextColor(kpi.status)}`}>
                      {kpi.value}
                    </span>
                    {kpi.unit && <span className="text-sm text-gray-600">{kpi.unit}</span>}
                  </div>

                  {kpi.trend && kpi.trendValue && (
                    <div className="flex items-center gap-1 text-xs">
                      {getTrendIcon(kpi.trend)}
                      <span
                        className={
                          kpi.trend === 'up'
                            ? 'text-green-600'
                            : kpi.trend === 'down'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }
                      >
                        {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'} {kpi.trendValue}
                      </span>
                    </div>
                  )}

                  {kpi.description && (
                    <p className="text-xs text-gray-600 mt-2 italic">{kpi.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Nota sobre dados */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p>
          <strong>Nota:</strong> Os dados exibidos são placeholders. Eles serão substituídos por dados reais
          conforme a integração com as fontes de dados for implementada.
        </p>
      </div>
    </div>
  );
}
