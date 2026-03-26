import { useState, useRef, useEffect } from 'react';
import { Flag } from 'lucide-react';

// ─── Tipos ──────────────────────────────────────────────────────────────

type FlagTipo = 'Red Flag' | 'Yellow Flag' | 'Black Flag';

interface ClienteContatado {
  codigo: string;
  nome: string;
  flag?: FlagTipo;
}

interface CoberturaCSM {
  csm: string;
  contatosSemana: number;
  clientesContatados: ClienteContatado[];
}

// ─── Cores das Flags ────────────────────────────────────────────────────

const FLAG_COLORS: Record<FlagTipo, { dot: string; text: string }> = {
  'Red Flag': { dot: '#EF4444', text: '#DC2626' },
  'Yellow Flag': { dot: '#FBBF24', text: '#D97706' },
  'Black Flag': { dot: '#1F2937', text: '#111827' },
};

// ─── TooltipClientes ────────────────────────────────────────────────────

function TooltipClientes({ clientes }: { clientes: ClienteContatado[] }) {
  return (
    <div className="space-y-1">
      {clientes.map((c) => (
        <div key={c.codigo || c.nome} className="text-xs text-gray-700 py-1 px-1">
          <span className="font-medium">{c.codigo || c.nome}</span>
          {c.codigo && <span className="text-gray-500 ml-1">({c.nome})</span>}
          {c.flag && (
            <span className="ml-2 text-xs" style={{ color: FLAG_COLORS[c.flag].text }}>
              {c.flag}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── ContatosCell (Modal ao clicar) ─────────────────────────────────────

function ContatosCell({ row }: { row: CoberturaCSM }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!btnRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors px-1 rounded text-2xl leading-none"
        onClick={() => setOpen(true)}
      >
        {row.contatosSemana}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 99998 }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-96 bg-white rounded-xl shadow-2xl border max-h-96 flex flex-col"
            style={{ borderColor: '#E0E8F0' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: '#E0E8F0', backgroundColor: '#F8FAFC' }}
            >
              <span className="text-sm font-bold text-gray-700">{row.csm}</span>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            {row.clientesContatados.some((c) => c.flag) && (
              <div
                className="px-4 py-2 border-b flex items-center gap-3 flex-wrap"
                style={{ borderColor: '#F0F4F8', backgroundColor: '#FAFBFC' }}
              >
                {(['Red Flag', 'Yellow Flag', 'Black Flag'] as FlagTipo[]).map((f) => {
                  const count = row.clientesContatados.filter((c) => c.flag === f).length;
                  if (count === 0) return null;
                  const colors = FLAG_COLORS[f];
                  return (
                    <span key={f} className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: colors.text }}>
                      <Flag className="w-2.5 h-2.5" fill={colors.dot} style={{ color: colors.dot }} />
                      {count} {f}
                    </span>
                  );
                })}
              </div>
            )}
            <div className="px-4 py-2 overflow-y-auto flex-1">
              <TooltipClientes clientes={row.clientesContatados} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Tabela de Cobertura ─────────────────────────────────────────────── */

function TabelaCobertura({ dados }: { dados: CoberturaCSM[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-700 w-24">CSM</th>
            <th className="border border-gray-200 px-2 py-1 text-center font-semibold text-gray-700 w-20">CONT. TOTAL</th>
            <th className="border border-gray-200 px-2 py-1 text-center font-semibold text-gray-700 w-16">% SEM.</th>
            <th className="border border-gray-200 px-2 py-1 text-center font-semibold text-gray-700 w-24">META 25%</th>
            <th className="border border-gray-200 px-2 py-1 text-center font-semibold text-gray-700 w-16">% MÊS</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((row) => (
            <tr key={row.csm} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-2 py-1 font-medium text-gray-700">{row.csm}</td>
              <td className="border border-gray-200 px-2 py-1 text-center">
                <ContatosCell row={row} />
              </td>
              <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">-</td>
              <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">-</td>
              <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">-</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Página Painel principal (será preenchida com dados reais)
export default function Painel() {
  return <div>Painel</div>;
}

export { TabelaCobertura, ContatosCell, type CoberturaCSM };
