import { Button } from "@/components/ui/button";
import { useChurnsData } from "@/hooks/useChurnsData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Filter, RotateCw, TrendingDown, Users, Calendar, AlertCircle, Download } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

/**
 * Dashboard de CHURNS - Análise de Cancelamentos
 * Design: Corporate Tech (SystemSat)
 */
export default function Churns() {
  const { data, loading, error, fetchData } = useChurnsData();
  const [searchCliente, setSearchCliente] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);
  const [selectedMotivo, setSelectedMotivo] = useState<string | null>(null);
  
  // Filtro por mês e ano
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set([new Date().getMonth() + 1]));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showAllMonths, setShowAllMonths] = useState<boolean>(false);
  const [showAllYears, setShowAllYears] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Obter lista de meses e anos disponíveis
  const availableMonthsYears = useMemo(() => {
    const monthYears = new Set<string>();
    data.forEach(churn => {
      if (churn.dataSaidaParsed) {
        const month = churn.dataSaidaParsed.getMonth() + 1;
        const year = churn.dataSaidaParsed.getFullYear();
        monthYears.add(`${year}-${month}`);
      }
    });
    
    return Array.from(monthYears)
      .map(my => {
        const [year, month] = my.split('-').map(Number);
        return { year, month };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }, [data]);

  // Filtrar dados
  let filteredData = data;
  
  // Filtro por mês e ano
  filteredData = filteredData.filter(churn => {
    if (!churn.dataSaidaParsed) return false;
    const month = churn.dataSaidaParsed.getMonth() + 1;
    const year = churn.dataSaidaParsed.getFullYear();
    if (!showAllYears && year !== selectedYear) return false;
    if (showAllMonths || showAllYears) return true;
    return selectedMonths.has(month);
  });

  if (searchCliente.trim()) {
    filteredData = filteredData.filter(churn => 
      churn.nome.toLowerCase().includes(searchCliente.toLowerCase())
    );
  }
  if (selectedTipo) {
    filteredData = filteredData.filter(churn => churn.tipo === selectedTipo);
  }
  if (selectedMotivo) {
    filteredData = filteredData.filter(churn => churn.motivoCancelamento === selectedMotivo);
  }

  // Função para alternar seleção de mês
  const toggleMonth = (month: number) => {
    const newMonths = new Set(selectedMonths);
    if (newMonths.has(month)) {
      newMonths.delete(month);
    } else {
      newMonths.add(month);
    }
    setSelectedMonths(newMonths);
    setShowAllMonths(false);
  };

  // Obter listas únicas para filtros
  const tipos = Array.from(new Set(data.map(c => c.tipo).filter(Boolean))).sort();
  const motivos = Array.from(new Set(data.map(c => c.motivoCancelamento).filter(Boolean))).sort();

  // Calcular estatísticas
  const totalCancelamentos = filteredData.length;
  // Gerar label do período selecionado
  const periodLabel = showAllYears
    ? 'Todos os anos'
    : showAllMonths 
    ? `Todos os meses de ${selectedYear}`
    : selectedMonths.size === 1
    ? `${new Date(selectedYear, Array.from(selectedMonths)[0] - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`
    : `${selectedMonths.size} meses de ${selectedYear}`;

  const mediaTemposCasa = filteredData.length > 0 
    ? Math.round(filteredData.reduce((sum, c) => sum + c.mesesCasa, 0) / filteredData.length)
    : 0;

  // Calcular cliente com maior tempo de casa
  const clienteMaiorTempo = filteredData.length > 0
    ? filteredData.reduce((max, c) => c.mesesCasa > max.mesesCasa ? c : max)
    : null;

  // Dados para gráfico de cancelamentos por tempo de casa
  const churnsPorTempoCasa = useMemo(() => {
    const ranges = [
      { label: '0-3 meses', min: 0, max: 3 },
      { label: '3-6 meses', min: 3, max: 6 },
      { label: '6-12 meses', min: 6, max: 12 },
      { label: '12-24 meses', min: 12, max: 24 },
      { label: '24+ meses', min: 24, max: Infinity }
    ];

    return ranges.map(range => ({
      name: range.label,
      quantidade: filteredData.filter(c => c.mesesCasa >= range.min && c.mesesCasa < range.max).length
    })).filter(item => item.quantidade > 0);
  }, [filteredData]);

  // Dados para gráfico de motivos de cancelamento (com lista de clientes)
  const churnsPorMotivo = useMemo(() => {
    const motivoMap: { [key: string]: { count: number; clientes: string[] } } = {};
    filteredData.forEach(churn => {
      if (churn.motivoCancelamento) {
        if (!motivoMap[churn.motivoCancelamento]) {
          motivoMap[churn.motivoCancelamento] = { count: 0, clientes: [] };
        }
        motivoMap[churn.motivoCancelamento].count++;
        motivoMap[churn.motivoCancelamento].clientes.push(churn.nome);
      }
    });

    return Object.entries(motivoMap)
      .map(([motivo, data]) => ({
        name: motivo,
        value: data.count,
        clientes: data.clientes
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredData]);

  // Cores vivas e contrastantes para gráficos
  const COLORS = ['#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#3182CE', '#805AD5', '#D53F8C', '#319795'];

  // Formatar nome do mês
  const getMonthName = (month: number) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[month - 1];
  };
  // Função para exportar para Excel
  const exportToExcel = (dataToExport: typeof filteredData, period: string) => {
    if (dataToExport.length === 0) {
      alert("Nenhum dado para exportar");
      return;
    }

    const headers = ["Cliente", "Tipo", "Entrada", "Saída", "Tempo (meses)", "Motivo", "CSM"];
    const rows = dataToExport.map(churn => [
      churn.nome,
      churn.tipo,
      churn.dataEntrada,
      churn.dataSaida,
      churn.mesesCasa.toString(),
      churn.motivoCancelamento,
      churn.atendente
    ]);

    const csvContent = [
      [`Relatório de CHURNs - ${period}`],
      [`Data de Exportação: ${new Date().toLocaleDateString("pt-BR")}`],
      [`Total de Cancelamentos: ${dataToExport.length}`],
      [],
      headers,
      ...rows
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `churns_${period.replace(/\s+/g, "_")}_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen md:ml-20" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: '#001F3F', borderColor: '#E0E8F0' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard de CHURNS</h1>
              <p className="text-sm text-gray-300 mt-1">Análise de cancelamentos e dados de clientes inativos</p>
            </div>
            <Button
              onClick={fetchData}
              disabled={loading}
              className="gap-2 text-gray-900 bg-white hover:bg-gray-100 border border-gray-300"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>

          {/* Filtro por Período */}
          <div className="mb-3 p-3 bg-white/10 rounded-lg">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Mês</label>
                <div className="flex gap-1 items-center">
                  <button
                    onClick={() => setShowAllMonths(!showAllMonths)}
                    className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors ${
                      showAllMonths
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/90 text-gray-700 hover:bg-white'
                    }`}
                  >
                    Todos
                  </button>
                  <div className="flex flex-wrap gap-0.5">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <button
                        key={month}
                        onClick={() => toggleMonth(month)}
                        className={`h-7 px-1.5 rounded text-[10px] font-medium transition-colors ${
                          selectedMonths.has(month)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/90 text-gray-700 hover:bg-white'
                        }`}
                        disabled={showAllMonths}
                      >
                        {getMonthName(month).substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Ano</label>
                <div className="flex gap-1 items-center">
                  <button
                    onClick={() => setShowAllYears(!showAllYears)}
                    className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors ${
                      showAllYears
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/90 text-gray-700 hover:bg-white'
                    }`}
                  >
                    Todos
                  </button>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(parseInt(e.target.value));
                      setShowAllYears(false);
                    }}
                    disabled={showAllYears}
                    className="h-7 px-2 rounded-md text-xs text-gray-700 bg-white/90 border-0 focus:outline-none disabled:opacity-50"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <span className="text-xs text-gray-300 pb-1">
                {filteredData.length} cancelamento(s) em {periodLabel}
              </span>
            </div>
          </div>

          {/* Filtros Adicionais */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Cliente</label>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ width: '150px' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Tipo</label>
              <select
                value={selectedTipo || ''}
                onChange={(e) => setSelectedTipo(e.target.value || null)}
                className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Todos</option>
                {tipos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Motivo</label>
              <select
                value={selectedMotivo || ''}
                onChange={(e) => setSelectedMotivo(e.target.value || null)}
                className="h-8 px-2.5 rounded-md text-sm text-gray-700 bg-white/95 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Todos</option>
                {motivos.map(motivo => (
                  <option key={motivo} value={motivo}>{motivo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">Erro ao carregar dados: {error}</p>
          </div>
        )}

        {loading && data.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#00DD00' }}></div>
              <p className="text-gray-600">Carregando dados de CHURNS...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Estatísticas Principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-gray-600">Total de Cancelamentos</p>
                </div>
                <p className="text-3xl font-bold text-red-600">{totalCancelamentos}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" style={{ color: '#001F3F' }} />
                  <p className="text-sm text-gray-600">Média de Tempo</p>
                </div>
                <p className="text-3xl font-bold" style={{ color: '#001F3F' }}>{mediaTemposCasa}m</p>
              </div>

              <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" style={{ color: '#00DD00' }} />
                  <p className="text-sm text-gray-600">Cliente Mais Antigo</p>
                </div>
                <p className="text-3xl font-bold" style={{ color: '#00DD00' }}>
                  {clienteMaiorTempo ? `${clienteMaiorTempo.mesesCasa}m` : '—'}
                </p>
                {clienteMaiorTempo && <p className="text-xs text-gray-500 mt-1">{clienteMaiorTempo.nome}</p>}
              </div>

              <div className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <p className="text-sm text-gray-600">Filtros Ativos</p>
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  {(selectedTipo ? 1 : 0) + (selectedMotivo ? 1 : 0)}
                </p>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico de Cancelamentos por Tempo de Casa */}
              <div className="bg-white rounded-lg p-4 border shadow-sm" style={{ borderColor: '#E0E8F0' }}>
                <h3 className="font-bold mb-4" style={{ color: '#001F3F' }}>Cancelamentos por Tempo de Casa</h3>
                {churnsPorTempoCasa.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={churnsPorTempoCasa}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="quantidade" fill="#FF6B6B" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">Sem dados para este período</p>
                )}
              </div>

              {/* Gráfico de Motivos de Cancelamento - Barras Horizontais */}
              <div className="bg-white rounded-lg p-4 border shadow-sm" style={{ borderColor: '#E0E8F0' }}>
                <h3 className="font-bold mb-4" style={{ color: '#001F3F' }}>Top Motivos de Cancelamento</h3>
                {churnsPorMotivo.length > 0 ? (
                  <div className="space-y-2">
                    {churnsPorMotivo.map((motivo, index) => {
                      const maxValue = churnsPorMotivo[0].value;
                      const percentage = (motivo.value / maxValue) * 100;
                      return (
                        <div key={motivo.name} className="group relative">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600 min-w-max text-right pr-2" title={motivo.name}>
                              {motivo.name}
                            </span>
                            <div className="flex-1 h-8 bg-gray-100 rounded-md overflow-hidden relative cursor-pointer">
                              <div
                                className="h-full rounded-md flex items-center justify-end pr-2 transition-all duration-300"
                                style={{ width: `${Math.max(percentage, 8)}%`, backgroundColor: COLORS[index % COLORS.length] }}
                              >
                                <span className="text-xs font-bold text-white drop-shadow-sm">{motivo.value}</span>
                              </div>
                            </div>
                          </div>
                          {/* Tooltip com lista de clientes */}
                          <div className="absolute z-50 left-36 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-3 hidden group-hover:block">
                            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: COLORS[index % COLORS.length] }}>
                              {motivo.name} ({motivo.value})
                            </p>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {motivo.clientes.map((cliente, ci) => (
                                <div key={ci} className="text-xs text-gray-700 py-0.5 px-2 rounded hover:bg-gray-50 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                  {cliente}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Sem dados para este período</p>
                )}
              </div>
            </div>

            {/* Tabela de Cancelamentos */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: '#E0E8F0' }}>
              <div className="p-4 border-b" style={{ borderColor: '#E0E8F0' }}>
                <h3 className="font-bold" style={{ color: '#001F3F' }}>Detalhes dos Cancelamentos - {periodLabel}</h3>
              </div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#001F3F' }}>Detalhes dos Cancelamentos</h3>
              <button
                onClick={() => exportToExcel(filteredData, periodLabel)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: '#00DD00', color: '#FFFFFF' }}
              >
                <Download className="w-4 h-4" />
                Exportar para Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead style={{ backgroundColor: '#F5F7FA', borderBottom: '2px solid #E0E8F0' }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#001F3F' }}>Cliente</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#001F3F' }}>Tipo</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#001F3F' }}>Entrada</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#001F3F' }}>Saída</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#001F3F' }}>Tempo (meses)</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#001F3F' }}>Motivo</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#001F3F' }}>CSM</th>
                  </tr>
                </thead>
                  <tbody>
                    {filteredData.length > 0 ? (
                      filteredData.slice(0, 20).map((churn, idx) => (
                        <tr key={churn.id} style={{ borderBottom: '1px solid #E0E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                          <td className="px-4 py-3 font-semibold" style={{ color: '#001F3F' }}>{churn.nome}</td>
                          <td className="px-4 py-3 text-gray-600">{churn.tipo}</td>
                          <td className="px-4 py-3 text-gray-600">{churn.dataEntrada}</td>
                          <td className="px-4 py-3 text-gray-600">{churn.dataSaida}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: '#FFE5E5', color: '#FF6B6B' }}>
                              {churn.mesesCasa}m
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs">
                            <div className="relative group inline-block w-full">
                              <span className="truncate block cursor-help underline decoration-dotted decoration-gray-400 underline-offset-2">
                                {churn.motivoCancelamento || '-'}
                              </span>
                              {(churn.motivoDeclarado || churn.analiseInterna) && (
                                <div className="absolute z-50 left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-3 hidden group-hover:block text-left">
                                  {churn.motivoDeclarado && (
                                    <div className="mb-2">
                                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Motivo Declarado pelo Cliente</p>
                                      <p className="text-sm text-gray-800 leading-snug">{churn.motivoDeclarado}</p>
                                    </div>
                                  )}
                                  {churn.motivoDeclarado && churn.analiseInterna && (
                                    <hr className="my-2 border-gray-200" />
                                  )}
                                  {churn.analiseInterna && (
                                    <div>
                                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Análise Interna</p>
                                      <p className="text-sm text-gray-800 leading-snug">{churn.analiseInterna}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{churn.atendente}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Nenhum cancelamento encontrado para {periodLabel}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {filteredData.length > 20 && (
                <div className="px-4 py-3 text-center text-sm text-gray-600 border-t" style={{ borderColor: '#E0E8F0' }}>
                  Mostrando 20 de {filteredData.length} cancelamentos
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
