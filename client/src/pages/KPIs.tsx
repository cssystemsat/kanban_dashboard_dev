'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface KPICard {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: 'good' | 'warning' | 'critical';
}

export default function KPIs() {
  const { data: onboardingData } = trpc.kpis.getOnboardingKpis.useQuery();

  // Dados de Onboarding
  const onboardingRetrasada: KPICard[] = [
    { label: 'Clientes ativos no onboarding', value: 168, status: 'good', trend: 'up', trendValue: '+3' },
    { label: 'Concluídos na semana', value: 6, status: 'good', trend: 'down', trendValue: '-2' },
    { label: 'Percentual dentro do prazo', value: '82%', status: 'warning', trend: 'down', trendValue: '-5%' },
    { label: 'Tempo médio de onboarding', value: '13.7', unit: 'dias', status: 'warning', trend: 'up', trendValue: '+1.2d' },
    { label: 'Clientes parados ou atrasados', value: 5, status: 'warning', trend: 'up', trendValue: '+2' },
    { label: 'Taxa de ativação', value: '89%', status: 'good', trend: 'down', trendValue: '-3%' },
    { label: 'Tempo até o primeiro valor', value: '4.7', unit: 'dias', status: 'good', trend: 'up', trendValue: '+0.5d' },
    { label: 'Cancelamentos ou riscos', value: 2, status: 'warning', trend: 'up', trendValue: '+1' },
  ];

  const onboardingPassada: KPICard[] = [
    { label: 'Clientes ativos no onboarding', value: onboardingData?.clientesAtivos || 172, status: 'good', trend: 'up', trendValue: '+4' },
    { label: 'Concluídos na semana', value: onboardingData?.concluidos || 8, status: 'good', trend: 'up', trendValue: '+2' },
    { label: 'Percentual dentro do prazo', value: '87%', status: 'good', trend: 'up', trendValue: '+5%' },
    { label: 'Tempo médio de onboarding', value: onboardingData?.tempoMedio || 12.5, unit: 'dias', status: 'warning', trend: 'down', trendValue: '-1.2d' },
    { label: 'Clientes parados ou atrasados', value: 3, status: 'warning', trend: 'down', trendValue: '-2' },
    { label: 'Taxa de ativação', value: onboardingData?.taxaAtivacao ? `${onboardingData.taxaAtivacao}%` : '92%', status: 'good', trend: 'up', trendValue: '+3%' },
    { label: 'Tempo até o primeiro valor', value: onboardingData?.tempoValor || 4.2, unit: 'dias', status: 'good', trend: 'down', trendValue: '-0.5d' },
    { label: 'Cancelamentos ou riscos', value: 1, status: 'good', trend: 'down', trendValue: '-1' },
  ];

  // Dados de Ongoing
  const ongoingRetrasada: KPICard[] = [
    { label: 'Clientes críticos', value: 7, status: 'critical', trend: 'up', trendValue: '+2' },
    { label: 'Carteira sem contato há 30+ dias', value: 9, status: 'warning', trend: 'down', trendValue: '-3' },
    { label: 'Pedidos de cancelamento', value: 2, status: 'warning', trend: 'neutral', trendValue: '0' },
    { label: 'Clientes recuperados e MRR salvo', value: '₹ 37.6k', status: 'good', trend: 'down', trendValue: '-₹8.2k' },
    { label: 'Churn de clientes', value: '2.4%', status: 'warning', trend: 'up', trendValue: '+0.3%' },
    { label: 'Churn de receita', value: '2.0%', status: 'warning', trend: 'up', trendValue: '+0.2%' },
    { label: 'Principais motivos de risco', value: 'Preço', status: 'warning', trendValue: 'Falta de ROI' },
    { label: 'Oportunidades de expansão', value: 6, status: 'good', trend: 'down', trendValue: '-2' },
  ];

  const ongoingPassada: KPICard[] = [
    { label: 'Clientes críticos', value: 5, status: 'critical', trend: 'down', trendValue: '-2' },
    { label: 'Carteira sem contato há 30+ dias', value: 12, status: 'warning', trend: 'up', trendValue: '+3' },
    { label: 'Pedidos de cancelamento', value: 2, status: 'warning', trend: 'neutral', trendValue: '0' },
    { label: 'Clientes recuperados e MRR salvo', value: '₹ 45.8k', status: 'good', trend: 'up', trendValue: '+₹8.2k' },
    { label: 'Churn de clientes', value: '2.1%', status: 'good', trend: 'down', trendValue: '-0.3%' },
    { label: 'Churn de receita', value: '1.8%', status: 'good', trend: 'down', trendValue: '-0.2%' },
    { label: 'Principais motivos de risco', value: 'Preço', status: 'warning', trendValue: 'Falta de ROI' },
    { label: 'Oportunidades de expansão', value: 8, status: 'good', trend: 'up', trendValue: '+2' },
  ];

  // Dados de Migração
  const migracaoRetrasada: KPICard[] = [
    { label: 'Migrações em andamento', value: 6, status: 'good', trend: 'neutral', trendValue: '0' },
    { label: 'Percentual concluído', value: '56%', status: 'warning', trend: 'down', trendValue: '-12%' },
    { label: 'Migrações atrasadas', value: 3, status: 'warning', trend: 'up', trendValue: '+1' },
    { label: 'Tempo médio de migração', value: '9.4', unit: 'dias', status: 'warning', trend: 'up', trendValue: '+1.1d' },
    { label: 'Erros ou retrabalho', value: 2, status: 'warning', trend: 'up', trendValue: '+1' },
    { label: 'Clientes bloqueados', value: 1, status: 'warning', trend: 'up', trendValue: '+1' },
    { label: 'Tickets pós-migração', value: 6, status: 'warning', trend: 'up', trendValue: '+2' },
    { label: 'CSAT da migração', value: '4.4/5', status: 'good', trend: 'down', trendValue: '-0.2' },
  ];

  const migracaoPassada: KPICard[] = [
    { label: 'Migrações em andamento', value: 6, status: 'good', trend: 'neutral', trendValue: '0' },
    { label: 'Percentual concluído', value: '68%', status: 'good', trend: 'up', trendValue: '+12%' },
    { label: 'Migrações atrasadas', value: 2, status: 'warning', trend: 'down', trendValue: '-1' },
    { label: 'Tempo médio de migração', value: '8.3', unit: 'dias', status: 'good', trend: 'down', trendValue: '-1.1d' },
    { label: 'Erros ou retrabalho', value: 1, status: 'good', trend: 'down', trendValue: '-1' },
    { label: 'Clientes bloqueados', value: 0, status: 'good', trend: 'down', trendValue: '-1' },
    { label: 'Tickets pós-migração', value: 4, status: 'good', trend: 'down', trendValue: '-2' },
    { label: 'CSAT da migração', value: '4.6/5', status: 'good', trend: 'up', trendValue: '+0.2' },
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

  const renderKPICard = (kpi: KPICard) => (
    <div className={`p-3 rounded border ${getStatusColor(kpi.status)}`}>
      <p className="text-xs font-medium text-gray-700">{kpi.label}</p>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-lg font-bold ${getStatusTextColor(kpi.status)}`}>
          {kpi.value}{kpi.unit && ` ${kpi.unit}`}
        </span>
        {kpi.trend && <div className="flex items-center gap-1">{getTrendIcon(kpi.trend)} <span className="text-xs text-gray-600">{kpi.trendValue}</span></div>}
      </div>
    </div>
  );

  const renderWeekRow = (title: string, kpis: KPICard[]) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="grid grid-cols-4 gap-3">
        {kpis.map((kpi, idx) => (
          <div key={idx}>{renderKPICard(kpi)}</div>
        ))}
      </div>
    </div>
  );

  const renderCategory = (categoryTitle: string, icon: string, retrasada: KPICard[], passada: KPICard[], borderColor: string) => (
    <div className="mb-12">
      <h2 className={`text-lg font-bold text-gray-900 mb-6 pb-3 border-b-4 ${borderColor}`}>{icon} {categoryTitle}</h2>
      {renderWeekRow('Semana Retrasada (19/07 a 25/07)', retrasada)}
      {renderWeekRow('Semana Passada (26/07 a 01/08)', passada)}
    </div>
  );

  return (
    <div className="ml-20 p-6" style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
      {renderCategory('Onboarding', '🚀', onboardingRetrasada, onboardingPassada, 'border-blue-500')}
      {renderCategory('Ongoing', '📈', ongoingRetrasada, ongoingPassada, 'border-purple-500')}
      {renderCategory('Migração', '🔄', migracaoRetrasada, migracaoPassada, 'border-teal-500')}
    </div>
  );
}
