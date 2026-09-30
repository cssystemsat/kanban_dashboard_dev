import { Button } from "@/components/ui/button";
import { parseBrazilianCurrency, useChurnsData, type ChurnData } from "@/hooks/useChurnsData";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Calendar,
  Download,
  FileSpreadsheet,
  Pencil,
  RotateCw,
  Sparkles,
  TrendingDown,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { trpc } from "@/lib/trpc";

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];
const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];
type ChurnMotivoField = "motivoCliente" | "motivoCsm" | "motivoFinanceiro" | "motivoComercial" | "ultimoBoleto";
type MotivoDialogState = { churn: ChurnData; field: ChurnMotivoField; label: string } | null;

function formatCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toAnalysisRecord(churn: ChurnData) {
  return {
    cliente: churn.nome,
    tipo: churn.tipo,
    persona: churn.persona,
    entrada: churn.dataEntrada,
    saida: churn.dataSaida,
    meses: churn.mesesCasa,
    csm: churn.atendente,
    vendedor: churn.vendedor,
    motivo: churn.motivoCancelamento,
    motivoCliente: churn.motivoCliente,
    motivoCsm: churn.motivoCsm,
    motivoFinanceiro: churn.motivoFinanceiro,
    motivoComercial: churn.motivoComercial,
    boleto: churn.boletoValor,
    somaPerdas: churn.somaPerdas,
  };
}

export default function Churns() {
  const { data, loading, error, fetchData } = useChurnsData();
  const [searchCliente, setSearchCliente] = useState("");
  const [selectedCsm, setSelectedCsm] = useState("");
  const [selectedVendedor, setSelectedVendedor] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(
    new Set(MONTHS.map((_, index) => index + 1))
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAllYears, setShowAllYears] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [motivoDialog, setMotivoDialog] = useState<MotivoDialogState>(null);
  const [motivoText, setMotivoText] = useState("");
  const analysisMutation = trpc.churns.generateAnalysis.useMutation();
  const updateMotivoMutation = trpc.churns.updateMotivo.useMutation();
  const { data: myPermissions } = trpc.config.myPermissions.useQuery();
  const allMonthsSelected = selectedMonths.size === MONTHS.length;
  const canAddChurnMotivo = myPermissions?.canAddChurnMotivo === true;

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const years = useMemo(() => {
    const values = new Set<number>();
    data.forEach(churn => churn.dataSaidaParsed && values.add(churn.dataSaidaParsed.getFullYear()));
    return Array.from(values).sort((a, b) => b - a);
  }, [data]);

  const csms = useMemo(
    () => Array.from(new Set(data.map(item => item.atendente).filter(Boolean))).sort(),
    [data]
  );
  const vendedores = useMemo(
    () => Array.from(new Set(data.map(item => item.vendedor).filter(Boolean))).sort(),
    [data]
  );
  const tipos = useMemo(
    () => Array.from(new Set(data.map(item => item.tipo).filter(Boolean))).sort(),
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter(churn => {
      if (!churn.dataSaidaParsed) return false;
      const month = churn.dataSaidaParsed.getMonth() + 1;
      const year = churn.dataSaidaParsed.getFullYear();
      if (!showAllYears && year !== selectedYear) return false;
      if (!showAllYears && !allMonthsSelected && !selectedMonths.has(month)) return false;
      if (searchCliente.trim() && !churn.nome.toLowerCase().includes(searchCliente.toLowerCase())) return false;
      if (selectedCsm && churn.atendente !== selectedCsm) return false;
      if (selectedVendedor && churn.vendedor !== selectedVendedor) return false;
      return true;
    }).sort((a, b) => {
      const byExitDate = (b.dataSaidaParsed?.getTime() ?? 0) - (a.dataSaidaParsed?.getTime() ?? 0);
      return byExitDate || b.sheetRow - a.sheetRow;
    });
  }, [data, searchCliente, selectedCsm, selectedVendedor, selectedMonths, selectedYear, allMonthsSelected, showAllYears]);

  const periodLabel = showAllYears
    ? "Todos os anos"
    : allMonthsSelected
      ? `Todos os meses de ${selectedYear}`
      : selectedMonths.size === 1
        ? `${MONTHS[Array.from(selectedMonths)[0] - 1]} de ${selectedYear}`
        : `${selectedMonths.size} meses de ${selectedYear}`;

  const totalBoleto = filteredData.reduce((sum, item) => sum + (item.boletoValor ?? 0), 0);
  const mediaTemposCasa = filteredData.length
    ? Math.round(filteredData.reduce((sum, item) => sum + item.mesesCasa, 0) / filteredData.length)
    : 0;
  const clienteMaisAntigo = filteredData.reduce<ChurnData | null>(
    (max, item) => (!max || item.mesesCasa > max.mesesCasa ? item : max),
    null
  );

  const porTempo = useMemo(() => {
    const ranges = [
      ["0–3 meses", 0, 3], ["3–6 meses", 3, 6], ["6–12 meses", 6, 12],
      ["12–24 meses", 12, 24], ["24+ meses", 24, Infinity],
    ] as const;
    return ranges.map(([name, min, max]) => ({
      name,
      quantidade: filteredData.filter(item => item.mesesCasa >= min && item.mesesCasa < max).length,
    }));
  }, [filteredData]);

  const porTipo = useMemo(() => {
    const counts = new Map<string, number>();
    filteredData.forEach(item => counts.set(item.tipo || "Sem tipo", (counts.get(item.tipo || "Sem tipo") ?? 0) + 1));
    return Array.from(counts, ([name, quantidade]) => ({ name, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
  }, [filteredData]);

  const toggleMonth = (month: number) => {
    const next = allMonthsSelected
      ? new Set(MONTHS.map((_, index) => index + 1).filter(value => value !== month))
      : new Set(selectedMonths);
    if (!allMonthsSelected) {
      if (next.has(month)) next.delete(month); else next.add(month);
    }
    setSelectedMonths(next);
    setShowAllYears(false);
  };

  const openMotivoDialog = (churn: ChurnData, field: ChurnMotivoField, label: string) => {
    setMotivoDialog({ churn, field, label });
    setMotivoText("");
  };

  const registerMotivo = async () => {
    if (!motivoDialog || !motivoText.trim()) return;
    try {
      await updateMotivoMutation.mutateAsync({
        row: motivoDialog.churn.sheetRow,
        expectedClient: motivoDialog.churn.nome,
        field: motivoDialog.field,
        text: motivoText.trim(),
      });
      setMotivoDialog(null);
      setMotivoText("");
      await fetchData();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Não foi possível cadastrar o motivo.");
    }
  };

  const exportToExcel = () => {
    const rows = filteredData.map(item => ({
      Cliente: item.nome,
      Tipo: item.tipo,
      Persona: item.persona,
      Entrada: item.dataEntrada,
      Saída: item.dataSaida,
      "Tempo (meses)": item.mesesCasa,
      "Motivo Cliente": item.motivoCliente,
      "Motivo CSM": item.motivoCsm,
      "Motivo Financeiro": item.motivoFinanceiro,
      "Motivo Comercial": item.motivoComercial,
      "Boleto": item.boletoValor ?? "",
      "Soma das perdas": item.somaPerdas ?? "",
      CSM: item.atendente,
      Vendedor: item.vendedor,
    }));
    if (!rows.length) return;
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Churns");
    XLSX.writeFile(workbook, `churns_${periodLabel.replace(/\s+/g, "_")}.xlsx`);
  };

  const generateAnalysis = async () => {
    setAnalysisOpen(true);
    setAnalysisText("");
    try {
      const result = await analysisMutation.mutateAsync({
        period: periodLabel,
        records: filteredData.map(toAnalysisRecord),
      });
      setAnalysisText(result.analysis);
    } catch (err) {
      setAnalysisText(err instanceof Error ? err.message : "Não foi possível gerar a análise.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] md:ml-20">
      <header className="sticky top-0 z-40 border-b bg-[#001f3f] border-[#1f4668] shadow-sm">
        <div className="px-4 py-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">Mês</label>
              <div className="flex gap-1">
                <button onClick={() => { setShowAllYears(false); setSelectedMonths(new Set(MONTHS.map((_, index) => index + 1))); }} className={`h-8 rounded px-2 text-xs font-semibold ${allMonthsSelected ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}>Todos</button>
                {MONTHS.map((month, index) => (
                  <button key={month} onClick={() => toggleMonth(index + 1)} className={`h-8 rounded px-1.5 text-[10px] font-semibold ${selectedMonths.has(index + 1) ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}>{month}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">Ano</label>
              <div className="flex gap-1">
                <button onClick={() => setShowAllYears(value => !value)} className={`h-8 rounded px-2 text-xs font-semibold ${showAllYears ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}>Todos</button>
                <select value={selectedYear} onChange={event => { setSelectedYear(Number(event.target.value)); setShowAllYears(false); }} disabled={showAllYears} className="h-8 rounded bg-white px-2 text-xs text-gray-700">
                  {(years.length ? years : [new Date().getFullYear()]).map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">Cliente</label><input value={searchCliente} onChange={event => setSearchCliente(event.target.value)} placeholder="Buscar cliente" className="h-8 w-36 rounded bg-white px-2 text-xs text-gray-700" /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">CSM</label><select value={selectedCsm} onChange={event => setSelectedCsm(event.target.value)} className="h-8 w-32 rounded bg-white px-2 text-xs text-gray-700"><option value="">Todos</option>{csms.map(csm => <option key={csm} value={csm}>{csm}</option>)}</select></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">Vendedor</label><select value={selectedVendedor} onChange={event => setSelectedVendedor(event.target.value)} className="h-8 w-32 rounded bg-white px-2 text-xs text-gray-700"><option value="">Todos</option>{vendedores.map(vendedor => <option key={vendedor} value={vendedor}>{vendedor}</option>)}</select></div>
            <div className="ml-auto flex gap-2">
              <Button onClick={() => void fetchData()} disabled={loading} size="sm" className="gap-1 bg-white text-[#001f3f] hover:bg-gray-100"><RotateCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />Atualizar</Button>
              <Button onClick={() => void generateAnalysis()} disabled={analysisMutation.isPending || filteredData.length === 0} size="sm" className="gap-1 bg-violet-500 text-white hover:bg-violet-600"><Sparkles className="h-4 w-4" />{analysisMutation.isPending ? "Analisando..." : "Gerar análise"}</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-4 p-4">
        {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">Erro ao carregar dados: {error}</div>}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi icon={<TrendingDown className="h-4 w-4" />} label={`Cancelamentos · ${periodLabel}`} value={String(filteredData.length)} color="text-red-600" />
          <Kpi icon={<Calendar className="h-4 w-4" />} label="Média de tempo" value={`${mediaTemposCasa} meses`} color="text-blue-700" />
          <Kpi icon={<Users className="h-4 w-4" />} label="Cliente mais antigo" value={clienteMaisAntigo ? `${clienteMaisAntigo.mesesCasa} meses` : "—"} detail={clienteMaisAntigo?.nome} color="text-emerald-600" />
          <Kpi icon={<Wallet className="h-4 w-4" />} label="Valor total dos boletos" value={formatCurrency(totalBoleto)} color="text-orange-600" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard title="Cancelamento por tempo de casa"><ResponsiveContainer width="100%" height={250}><BarChart data={porTempo}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="quantidade" fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
          <ChartCard title="Cancelamento por tipo"><ResponsiveContainer width="100%" height={250}><BarChart data={porTipo} layout="vertical" margin={{ left: 20, right: 20 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={110} fontSize={11} /><Tooltip /><Bar dataKey="quantidade" fill="#7c3aed" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        </div>

        <section className="overflow-hidden rounded-lg border border-[#e0e8f0] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0e8f0] p-3"><div><h2 className="font-bold text-[#001f3f]">Clientes cancelados</h2><p className="text-xs text-gray-500">{filteredData.length} registro(s) · {periodLabel}</p></div><Button onClick={exportToExcel} disabled={!filteredData.length} size="sm" className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"><FileSpreadsheet className="h-4 w-4" />Exportar Excel</Button></div>
          <div className="overflow-x-auto"><table className="min-w-[1720px] w-full border-collapse text-sm"><thead className="bg-[#f5f7fa]"><tr>{["Cliente", "Tipo", "Persona", "Entrada", "Saída", "Tempo (meses)", "Motivo Cliente", "Motivo CSM", "Motivo Financeiro", "Motivo Comercial", "Boleto", "Soma das perdas"].map(header => <th key={header} className="whitespace-nowrap border-b px-3 py-2 text-left text-xs font-bold text-[#001f3f]">{header}</th>)}</tr></thead><tbody>{filteredData.length ? filteredData.map((churn, index) => <tr key={churn.id} className={index % 2 ? "bg-gray-50" : "bg-white"}><td className="max-w-52 px-3 py-2 font-semibold text-[#001f3f]">{churn.nome}</td><td className="px-3 py-2 text-gray-600">{churn.tipo || "—"}</td><td className="px-3 py-2 text-gray-600">{churn.persona || "—"}</td><td className="px-3 py-2 text-gray-600">{churn.dataEntrada || "—"}</td><td className="px-3 py-2 text-gray-600">{churn.dataSaida || "—"}</td><td className="px-3 py-2 text-gray-600">{churn.mesesCasa}</td><td className="max-w-64 whitespace-normal px-3 py-2 text-gray-600"><MotivoCell value={churn.motivoCliente} canAdd={canAddChurnMotivo} onAdd={() => openMotivoDialog(churn, "motivoCliente", "Motivo Cliente")} /></td><td className="max-w-64 whitespace-normal px-3 py-2 text-gray-600"><MotivoCell value={churn.motivoCsm} canAdd={canAddChurnMotivo} onAdd={() => openMotivoDialog(churn, "motivoCsm", "Motivo CSM")} /></td><td className="max-w-64 whitespace-normal px-3 py-2 text-gray-600"><MotivoCell value={churn.motivoFinanceiro} canAdd={canAddChurnMotivo} onAdd={() => openMotivoDialog(churn, "motivoFinanceiro", "Motivo Financeiro")} /></td><td className="max-w-64 whitespace-normal px-3 py-2 text-gray-600"><MotivoCell value={churn.motivoComercial} canAdd={canAddChurnMotivo} onAdd={() => openMotivoDialog(churn, "motivoComercial", "Motivo Comercial")} /></td><td className="whitespace-nowrap px-3 py-2 font-semibold text-orange-700"><BoletoCell value={churn.ultimoBoleto} canAdd={canAddChurnMotivo} onAdd={() => openMotivoDialog(churn, "ultimoBoleto", "Boleto")} /></td><td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-500">—</td></tr>) : <tr><td colSpan={12} className="px-4 py-10 text-center text-gray-500">Nenhum cancelamento encontrado para os filtros atuais.</td></tr>}</tbody></table></div>
        </section>
      </main>

      {analysisOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setAnalysisOpen(false)}><div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={event => event.stopPropagation()}><div className="flex items-center justify-between border-b p-4"><div><h2 className="flex items-center gap-2 text-lg font-bold text-[#001f3f]"><Sparkles className="h-5 w-5 text-violet-600" />Análise dos Churns</h2><p className="text-xs text-gray-500">Base: {filteredData.length} registro(s) filtrado(s)</p></div><button onClick={() => setAnalysisOpen(false)} className="rounded p-1 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button></div><div className="max-h-[70vh] overflow-y-auto p-5">{analysisMutation.isPending ? <div className="flex items-center gap-3 py-12 text-gray-600"><Sparkles className="h-5 w-5 animate-pulse text-violet-600" />Gerando análise...</div> : <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-gray-700">{analysisText}</pre>}</div></div></div>}
      {motivoDialog && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4" onClick={() => !updateMotivoMutation.isPending && setMotivoDialog(null)}><div className="w-full max-w-lg rounded-xl bg-white shadow-2xl" onClick={event => event.stopPropagation()}><div className="flex items-start justify-between border-b p-4"><div><h2 className="flex items-center gap-2 text-lg font-bold text-[#001f3f]"><Pencil className="h-5 w-5 text-blue-600" />Cadastrar {motivoDialog.field === "ultimoBoleto" ? "boleto" : "motivo"}</h2><p className="mt-1 text-sm text-gray-600">{motivoDialog.churn.nome}</p><p className="text-xs text-gray-500">Campo: {motivoDialog.label} · linha {motivoDialog.churn.sheetRow}</p></div><button onClick={() => setMotivoDialog(null)} disabled={updateMotivoMutation.isPending} className="rounded p-1 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button></div><div className="space-y-3 p-4"><label className="text-sm font-semibold text-gray-700">{motivoDialog.field === "ultimoBoleto" ? "Valor do boleto" : "Motivo"}</label><textarea value={motivoText} onChange={event => setMotivoText(event.target.value)} autoFocus rows={motivoDialog.field === "ultimoBoleto" ? 2 : 6} maxLength={5000} placeholder={motivoDialog.field === "ultimoBoleto" ? "Ex.: R$ 1.250,00" : "Digite o motivo..."} className="w-full resize-y rounded-lg border border-gray-300 p-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setMotivoDialog(null)} disabled={updateMotivoMutation.isPending}>Cancelar</Button><Button onClick={() => void registerMotivo()} disabled={!motivoText.trim() || updateMotivoMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">{updateMotivoMutation.isPending ? "Cadastrando..." : "Cadastrar"}</Button></div></div></div></div>}
    </div>
  );
}

function Kpi({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail?: string; color: string }) {
  return <div className="rounded-lg border border-[#e0e8f0] bg-white p-3 shadow-sm"><div className={`mb-1 flex items-center gap-2 text-xs font-semibold ${color}`}>{icon}{label}</div><div className={`text-2xl font-bold ${color}`}>{value}</div>{detail && <div className="mt-1 truncate text-xs text-gray-500" title={detail}>{detail}</div>}</div>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-[#e0e8f0] bg-white p-3 shadow-sm"><h2 className="mb-2 font-bold text-[#001f3f]">{title}</h2>{children}</section>;
}

function MotivoCell({ value, canAdd, onAdd }: { value: string; canAdd: boolean; onAdd: () => void }) {
  if (value.trim()) return <span className="whitespace-pre-wrap">{value}</span>;
  if (!canAdd) return <span className="text-gray-400">—</span>;
  return <button onClick={onAdd} className="inline-flex items-center gap-1 rounded border border-dashed border-blue-300 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Pencil className="h-3 w-3" />Cadastrar motivo</button>;
}

function BoletoCell({ value, canAdd, onAdd }: { value: string; canAdd: boolean; onAdd: () => void }) {
  if (value.trim()) return <span>{formatCurrency(parseBrazilianCurrency(value))}</span>;
  if (!canAdd) return <span className="text-gray-400">—</span>;
  return <button onClick={onAdd} className="inline-flex items-center gap-1 rounded border border-dashed border-orange-300 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"><Pencil className="h-3 w-3" />Cadastrar boleto</button>;
}
