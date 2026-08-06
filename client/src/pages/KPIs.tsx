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
    { label: 'Clientes ativos', value: 168, status: 'good', trend: 'up', trendValue: '+3' },
    { label: 'Concluídos', value: 6, status: 'good', trend: 'down', trendValue: '-2' },
    { label: 'Dentro do prazo', value: '82%', status: 'warning', trend: 'down', trendValue: '-5%' },
    { label: 'Tempo médio', value: '13.7d', status: 'warning', trend: 'up', trendValue: '+1.2d' },
    { label: 'Parados/Atrasados', value: 5, status: 'warning', trend: 'up', trendValue: '+2' },
    { label: 'Taxa ativação', value: '89%', status: 'good', trend: 'down', trendValue: '-3%' },
    { label: 'Tempo 1º valor', value: '4.7d', status: 'good', trend: 'up', trendValue: '+0.5d' },
    { label: 'Cancelamentos', value: 2, status: 'warning', trend: 'up', trendValue: '+1' },
  ];

  const onboardingPassada: KPICard[] = [
    { label: 'Clientes ativos', value: onboardingData?.clientesAtivos || 172, status: 'good', trend: 'up', trendValue: '+4' },
    { label: 'Concluídos', value: onboardingData?.concluidos || 8, status: 'good', trend: 'up', trendValue: '+2' },
    { label: 'Dentro do prazo', value: '87%', status: 'good', trend: 'up', trendValue: '+5%' },
    { label: 'Tempo médio', value: onboardingData?.tempoMedio ? `${onboardingData.tempoMedio}d` : '12.5d', status: 'warning', trend: 'down', trendValue: '-1.2d' },
    { label: 'Parados/Atrasados', value: 3, status: 'warning', trend: 'down', trendValue: '-2' },
    { label: 'Taxa ativação', value: onboardingData?.taxaAtivacao ? `${onboardingData.taxaAtivacao}%` : '92%', status: 'good', trend: 'up', trendValue: '+3%' },
    { label: 'Tempo 1º valor', value: onboardingData?.tempoValor ? `${onboardingData.tempoValor}d` : '4.2d', status: 'good', trend: 'down', trendValue: '-0.5d' },
    { label: 'Cancelamentos', value: 1, status: 'good', trend: 'down', trendValue: '-1' },
  ];

  // Dados de Ongoing
  const ongoingRetrasada: KPICard[] = [
    { label: 'Críticos', value: 7, status: 'critical', trend: 'up', trendValue: '+2' },
    { label: 'Sem contato 30+', value: 9, status: 'warning', trend: 'down', trendValue: '-3' },
    { label: 'Cancelamentos', value: 2, status: 'warning', trend: 'neutral', trendValue: '0' },
    { label: 'Recuperados MRR', value: '₹37.6k', status: 'good', trend: 'down', trendValue: '-₹8.2k' },
    { label: 'Churn clientes', value: '2.4%', status: 'warning', trend: 'up', trendValue: '+0.3%' },
    { label: 'Churn receita', value: '2.0%', status: 'warning', trend: 'up', trendValue: '+0.2%' },
    { label: 'Risco principal', value: '-', status: 'warning' },
    { label: 'Expansão', value: 6, status: 'good', trend: 'down', trendValue: '-2' },
  ];

  const ongoingPassada: KPICard[] = [
    { label: 'Críticos', value: 5, status: 'critical', trend: 'down', trendValue: '-2' },
    { label: 'Sem contato 30+', value: 12, status: 'warning', trend: 'up', trendValue: '+3' },
    { label: 'Cancelamentos', value: 2, status: 'warning', trend: 'neutral', trendValue: '0' },
    { label: 'Recuperados MRR', value: '₹45.8k', status: 'good', trend: 'up', trendValue: '+₹8.2k' },
    { label: 'Churn clientes', value: '2.1%', status: 'good', trend: 'down', trendValue: '-0.3%' },
    { label: 'Churn receita', value: '1.8%', status: 'good', trend: 'down', trendValue: '-0.2%' },
    { label: 'Risco principal', value: '-', status: 'warning' },
    { label: 'Expansão', value: 8, status: 'good', trend: 'up', trendValue: '+2' },
  ];

  // Dados de Migração
  const migracaoRetrasada: KPICard[] = [
    { label: 'Em andamento', value: 6, status: 'good', trend: 'neutral', trendValue: '0' },
    { label: 'Concluído', value: '56%', status: 'warning', trend: 'down', trendValue: '-12%' },
    { label: 'Atrasadas', value: 3, status: 'warning', trend: 'up', trendValue: '+1' },
    { label: 'Tempo médio', value: '9.4d', status: 'warning', trend: 'up', trendValue: '+1.1d' },
    { label: 'Erros', value: 2, status: 'warning', trend: 'up', trendValue: '+1' },
    { label: 'Bloqueados', value: 1, status: 'warning', trend: 'up', trendValue: '+1' },
    { label: 'Tickets pós', value: 6, status: 'warning', trend: 'up', trendValue: '+2' },
    { label: 'CSAT', value: '4.4/5', status: 'good', trend: 'down', trendValue: '-0.2' },
  ];

  const migracaoPassada: KPICard[] = [
    { label: 'Em andamento', value: 6, status: 'good', trend: 'neutral', trendValue: '0' },
    { label: 'Concluído', value: '68%', status: 'good', trend: 'up', trendValue: '+12%' },
    { label: 'Atrasadas', value: 2, status: 'warning', trend: 'down', trendValue: '-1' },
    { label: 'Tempo médio', value: '8.3d', status: 'good', trend: 'down', trendValue: '-1.1d' },
    { label: 'Erros', value: 1, status: 'good', trend: 'down', trendValue: '-1' },
    { label: 'Bloqueados', value: 0, status: 'good', trend: 'down', trendValue: '-1' },
    { label: 'Tickets pós', value: 4, status: 'good', trend: 'down', trendValue: '-2' },
    { label: 'CSAT', value: '4.6/5', status: 'good', trend: 'up', trendValue: '+0.2' },
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
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-600" />;
    return null;
  };

  const renderKPIRow = (kpiPassada: KPICard, kpiRetrasada: KPICard) => (
    <div className="flex gap-1 mb-1">
      {/* Semana Passada */}
      <div className={`flex-1 p-1.5 rounded border text-xs ${getStatusColor(kpiPassada.status)}`}>
        <p className="font-medium text-gray-700 truncate text-xs">{kpiPassada.label}</p>
        <div className="flex items-center justify-between mt-0.5">
          <span className={`font-bold text-xs ${getStatusTextColor(kpiPassada.status)}`}>
            {kpiPassada.value}
          </span>
          {kpiPassada.trend && <div className="flex items-center gap-0.5">{getTrendIcon(kpiPassada.trend)} <span className="text-xs text-gray-600">{kpiPassada.trendValue}</span></div>}
        </div>
      </div>

      {/* Semana Retrasada */}
      <div className={`flex-1 p-1.5 rounded border text-xs ${getStatusColor(kpiRetrasada.status)}`}>
        <p className="font-medium text-gray-700 truncate text-xs">{kpiRetrasada.label}</p>
        <div className="flex items-center justify-between mt-0.5">
          <span className={`font-bold text-xs ${getStatusTextColor(kpiRetrasada.status)}`}>
            {kpiRetrasada.value}
          </span>
          {kpiRetrasada.trend && <div className="flex items-center gap-0.5">{getTrendIcon(kpiRetrasada.trend)} <span className="text-xs text-gray-600">{kpiRetrasada.trendValue}</span></div>}
        </div>
      </div>
    </div>
  );

  const renderCategory = (categoryTitle: string, icon: string, passada: KPICard[], retrasada: KPICard[], borderColor: string) => (
    <div className="flex-1">
      <h2 className={`text-sm font-bold text-gray-900 mb-2 pb-1 border-b-2 ${borderColor}`}>{icon} {categoryTitle}</h2>
      
      {/* Headers das colunas */}
      <div className="flex gap-1 mb-1">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-700">Semana Passada</p>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-700">Semana Retrasada</p>
        </div>
      </div>

      {/* KPI Rows */}
      {passada.map((kpi, idx) => renderKPIRow(kpi, retrasada[idx]))}
    </div>
  );

  return (
    <div className="ml-20 p-3" style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
      <div className="flex gap-3 w-full">
        {renderCategory('Onboarding', '🚀', onboardingPassada, onboardingRetrasada, 'border-blue-500')}
        <div className="border-l-2 border-gray-300"></div>
        {renderCategory('Ongoing', '📈', ongoingPassada, ongoingRetrasada, 'border-purple-500')}
        <div className="border-l-2 border-gray-300"></div>
        {renderCategory('Migração', '🔄', migracaoPassada, migracaoRetrasada, 'border-teal-500')}
      </div>
    </div>
  );
}
