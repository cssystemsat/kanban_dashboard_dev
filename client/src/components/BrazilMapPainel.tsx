"use client";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { X } from "lucide-react";
import brazilMapSvg from "./brasil-estados.svg?raw";

interface ClienteEstado {
  nome: string;
  estado?: string;
  faturamento?: string;
  atendente?: string;
  comercial?: string;
}

interface BrazilMapPainelProps {
  title: string;
  clients: ClienteEstado[];
}

// Centros oficiais do SVG do mapa (convertidos para percentuais do viewBox 1000x912).
// Esses pontos vêm da camada label_points do próprio mapa, não de estimativas visuais.
const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
  AC: { x: 13.65, y: 37.88 },
  AL: { x: 80.06, y: 37.87 },
  AM: { x: 21.52, y: 25.56 },
  AP: { x: 49.27, y: 13.60 },
  BA: { x: 69.76, y: 43.61 },
  CE: { x: 74.10, y: 27.09 },
  DF: { x: 57.37, y: 51.46 },
  ES: { x: 72.42, y: 59.49 },
  GO: { x: 52.66, y: 53.49 },
  MA: { x: 62.29, y: 27.87 },
  MG: { x: 64.41, y: 57.79 },
  MS: { x: 43.02, y: 61.70 },
  MT: { x: 40.99, y: 46.03 },
  PA: { x: 46.13, y: 28.46 },
  PB: { x: 81.11, y: 31.98 },
  PE: { x: 75.99, y: 34.57 },
  PI: { x: 67.12, y: 34.10 },
  PR: { x: 48.98, y: 72.20 },
  RJ: { x: 68.03, y: 66.89 },
  RN: { x: 79.80, y: 28.94 },
  RO: { x: 25.98, y: 39.88 },
  RR: { x: 30.05, y: 11.07 },
  RS: { x: 46.11, y: 84.79 },
  SC: { x: 52.80, y: 78.78 },
  SE: { x: 78.48, y: 39.45 },
  SP: { x: 56.09, y: 66.34 },
  TO: { x: 56.21, y: 39.66 },
};

export default function BrazilMapPainel({
  title,
  clients,
}: BrazilMapPainelProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Contar clientes por estado
  const clientsByState = useMemo(() => {
    const counts: Record<string, ClienteEstado[]> = {};

    clients.forEach(client => {
      if (client.estado) {
        if (!counts[client.estado]) counts[client.estado] = [];
        counts[client.estado].push(client);
      }
    });

    return counts;
  }, [clients]);

  const totalClients = clients.length;
  const statesWithClients = Object.keys(clientsByState).length;

  // Ranking de estados - TODOS os estados (sem limitação de 10)
  const stateRanking = useMemo(() => {
    return Object.entries(clientsByState)
      .map(([state, clientes]) => ({ state, count: clientes.length }))
      .sort((a, b) => b.count - a.count);
  }, [clientsByState]);

  // Função para exportar tabela como CSV com clientes
  const exportToCSV = () => {
    const headers = [
      "Estado",
      "Cliente",
      "Faturamento",
      "Atendente",
      "Comercial",
    ];
    const rows: string[][] = [];

    // Agrupar clientes por estado
    stateRanking.forEach(({ state }) => {
      const stateClients = clientsByState[state] || [];
      stateClients.forEach(client => {
        rows.push([
          state,
          client.nome,
          client.faturamento || "—",
          client.atendente || "—",
          client.comercial || "—",
        ]);
      });
    });

    // Escapar aspas duplas e envolver campos em aspas
    const csvContent = [
      headers.join(","),
      ...rows.map(row =>
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `clientes_por_estado_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedStateClients = selectedState
    ? clientsByState[selectedState] || []
    : [];

  const handleStateClick = (state: string) => {
    if (clientsByState[state]) {
      setSelectedState(state);
    }
  };

  return (
    <div
      className="w-full flex flex-col gap-4 bg-white rounded-lg p-6 border"
      style={{ borderColor: "#E0E8F0" }}
    >
      <h2 className="text-lg font-bold" style={{ color: "#001F3F" }}>
        {title}
      </h2>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="bg-gray-50 rounded-lg p-3 border text-center"
          style={{ borderColor: "#E0E8F0" }}
        >
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold" style={{ color: "#001F3F" }}>
            {totalClients}
          </p>
        </div>
        <div
          className="bg-gray-50 rounded-lg p-3 border text-center"
          style={{ borderColor: "#E0E8F0" }}
        >
          <p className="text-xs text-gray-600 mb-1">Estados</p>
          <p className="text-2xl font-bold" style={{ color: "#001F3F" }}>
            {statesWithClients}
          </p>
        </div>
        <div
          className="bg-gray-50 rounded-lg p-3 border text-center"
          style={{ borderColor: "#E0E8F0" }}
        >
          <p className="text-xs text-gray-600 mb-1">Maior</p>
          <p className="text-2xl font-bold" style={{ color: "#001F3F" }}>
            {stateRanking[0]?.state || "—"}
          </p>
        </div>
      </div>

      {/* Mapa do Brasil com overlay interativo - Maior */}
      <div
        className="flex justify-center bg-white rounded-lg p-6 border"
        style={{ borderColor: "#E0E8F0" }}
      >
        <div
          className="relative w-full"
          style={{ maxWidth: "900px", aspectRatio: "1000/912" }}
        >
          {/* SVG incorporado no bundle: não depende de CDN, storage ou CORS. */}
          <div
            className="absolute inset-0 [&>svg]:block [&>svg]:w-full [&>svg]:h-full"
            role="img"
            aria-label="Mapa do Brasil"
            dangerouslySetInnerHTML={{ __html: brazilMapSvg }}
          />

          {/* Overlay com números em círculos com gradiente de cores + setas para estados pequenos */}
          <div className="absolute inset-0 pointer-events-none">
            {Object.entries(STATE_POSITIONS).map(([state, pos]) => {
              const count = clientsByState[state]?.length || 0;
              if (count === 0) return null;

              // Calcular cor baseada na densidade
              const maxCount = Math.max(
                ...Object.values(clientsByState).map(c => c.length)
              );
              const intensity = Math.min(count / maxCount, 1);

              // Gradiente: azul claro (poucos) -> azul escuro (muitos)
              const colors = [
                "#E3F2FD",
                "#BBDEFB",
                "#90CAF9",
                "#64B5F6",
                "#42A5F5",
                "#2196F3",
                "#1E88E5",
                "#1565C0",
                "#0D47A1",
              ];
              const colorIndex = Math.floor(intensity * (colors.length - 1));
              const bgColor = colors[colorIndex];
              const borderColor =
                colors[Math.min(colorIndex + 2, colors.length - 1)];

              // Os centros dos estados são exatos; círculos compactos evitam
              // sobreposição na faixa litorânea, onde as UFs são muito próximas.
              const compactStates = new Set([
                "AL",
                "CE",
                "DF",
                "ES",
                "PB",
                "PE",
                "RJ",
                "RN",
                "SE",
              ]);
              const circleSize = compactStates.has(state)
                ? 22
                : Math.min(34, Math.max(22, 19 + Math.log10(count + 1) * 5));

              return (
                <div key={state}>
                  {/* Círculo com número */}
                  <div
                    className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      width: `${circleSize}px`,
                      height: `${circleSize}px`,
                      backgroundColor: bgColor,
                      borderRadius: "50%",
                      border: `2px solid ${borderColor}`,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    }}
                    onClick={() => handleStateClick(state)}
                    title={`${state}: ${count} cliente(s)`}
                  >
                    <span
                      className="font-bold hover:font-black transition-all"
                      style={{
                        color: intensity > 0.5 ? "#FFFFFF" : "#0D47A1",
                        textShadow:
                          intensity > 0.5
                            ? "0 1px 2px rgba(0,0,0,0.3)"
                            : "none",
                        fontSize: count > 99 ? "11px" : count > 9 ? "10px" : "9px",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranking de Estados - Clicável */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-semibold" style={{ color: "#001F3F" }}>
          Todos os Estados ({stateRanking.length})
        </p>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: "#E0E8F0", color: "#001F3F" }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor = "#D0D8E0")
          }
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = "#E0E8F0")
          }
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{
                backgroundColor: "#F3F4F6",
                borderBottom: "2px solid #E0E8F0",
              }}
            >
              <th
                className="text-left py-2 px-2 font-semibold text-xs"
                style={{ color: "#001F3F" }}
              >
                Estado
              </th>
              <th
                className="text-right py-2 px-2 font-semibold text-xs"
                style={{ color: "#001F3F" }}
              >
                Qtd
              </th>
              <th
                className="text-right py-2 px-2 font-semibold text-xs"
                style={{ color: "#001F3F" }}
              >
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {stateRanking.map(({ state, count }) => {
              const percentage = ((count / totalClients) * 100).toFixed(0);
              return (
                <tr
                  key={state}
                  style={{
                    borderBottom: "1px solid #E0E8F0",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedState(state)}
                  className={
                    selectedState === state ? "bg-blue-50" : "hover:bg-gray-50"
                  }
                >
                  <td className="py-2 px-2 font-semibold">{state}</td>
                  <td
                    className="py-2 px-2 text-right font-bold"
                    style={{ color: "#0052CC" }}
                  >
                    {count}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-600">
                    {percentage}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal com clientes do estado selecionado */}
      {selectedState && selectedStateClients.length > 0 && (
        <div
          className="fixed inset-0 bg-transparent flex items-center justify-center z-50"
          onClick={() => setSelectedState(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold" style={{ color: "#001F3F" }}>
                Clientes em {selectedState}
              </h3>
              <button
                onClick={() => setSelectedState(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {selectedStateClients.map((client, i) => (
                <div
                  key={i}
                  className="p-3 border rounded-lg"
                  style={{ borderColor: "#E0E8F0" }}
                >
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "#001F3F" }}
                  >
                    {client.nome}
                  </p>
                  <p className="text-xs text-gray-600">
                    Fat: {client.faturamento || "—"}
                  </p>
                  <p className="text-xs text-gray-600">
                    Atend: {client.atendente || "—"}
                  </p>
                  <p className="text-xs text-gray-600">
                    Com: {client.comercial || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
