import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { buildFinancialEvolution } from "@/lib/financialEvolution";

const FINANCIAL_GID = 202474765;

interface FinancialEvolutionChartProps {
  centralId?: string;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export default function FinancialEvolutionChart({
  centralId,
}: FinancialEvolutionChartProps) {
  const query = trpc.sheets.csv.useQuery(
    { source: "primary", gid: FINANCIAL_GID },
    { enabled: Boolean(centralId?.trim()), staleTime: 5 * 60_000 }
  );

  if (!centralId?.trim()) return null;

  if (query.isLoading) {
    return (
      <div className="mt-4 border-t pt-4" style={{ borderColor: "#E0E8F0" }}>
        <h4 className="mb-3 text-sm font-semibold" style={{ color: "#001F3F" }}>
          Evolução financeira
        </h4>
        <div className="h-[220px] animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  const data = query.data?.csv
    ? buildFinancialEvolution(query.data.csv, centralId)
    : [];

  if (data.length === 0) {
    return (
      <div className="mt-4 border-t pt-4" style={{ borderColor: "#E0E8F0" }}>
        <h4 className="mb-2 text-sm font-semibold" style={{ color: "#001F3F" }}>
          Evolução financeira
        </h4>
        <p className="text-xs text-gray-500">
          Não há boletos cadastrados para o ID Central deste cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t pt-4" style={{ borderColor: "#E0E8F0" }}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold" style={{ color: "#001F3F" }}>
          Evolução financeira
        </h4>
        <span className="text-[11px] text-gray-500">Boleto mensal × mínimo</span>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E8F0" />
          <XAxis dataKey="month" stroke="#666" tick={{ fill: "#666", fontSize: 11 }} />
          <YAxis
            stroke="#666"
            tick={{ fill: "#666", fontSize: 11 }}
            tickFormatter={value => formatCurrency(Number(value))}
            width={72}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E0E8F0",
              borderRadius: 4,
              padding: 8,
            }}
            formatter={(value, name) => [
              formatCurrency(Number(value)),
              name === "boleto" ? "Boleto" : "Mínimo",
            ]}
            labelStyle={{ color: "#001F3F" }}
          />
          <Legend
            formatter={value => (value === "boleto" ? "Boleto mensal" : "Valor mínimo")}
          />
          <Bar dataKey="boleto" fill="#2563EB" radius={[3, 3, 0, 0]} />
          <Line
            type="monotone"
            dataKey="minimo"
            stroke="#DC2626"
            strokeWidth={2}
            dot={{ fill: "#DC2626", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
