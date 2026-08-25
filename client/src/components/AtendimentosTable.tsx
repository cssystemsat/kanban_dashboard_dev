import { useState, useMemo } from 'react';
import { Atendimento, useAtendimentosData } from '@/hooks/useAtendimentosData';
import { Card } from '@/components/ui/card';
import { ChevronUp, ChevronDown } from 'lucide-react';

type SortField = 'cliente' | 'origem' | 'tipo' | 'assunto' | 'tempo' | 'atendente' | 'dia';
type SortOrder = 'asc' | 'desc';

export function AtendimentosTable({ data }: { data: Atendimento[] }) {
  const [sortField, setSortField] = useState<SortField>('dia');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterOrigem, setFilterOrigem] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterAssunto, setFilterAssunto] = useState('');
  const [filterAtendente, setFilterAtendente] = useState('');


  // Filtrar dados
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchCliente = item.cliente.toLowerCase().includes(filterCliente.toLowerCase());
      const matchOrigem = item.origem.toLowerCase().includes(filterOrigem.toLowerCase());
      const matchTipo = item.tipo.toLowerCase().includes(filterTipo.toLowerCase());
      const matchAssunto = item.assunto.toLowerCase().includes(filterAssunto.toLowerCase());
      const matchAtendente = item.atendente.toLowerCase().includes(filterAtendente.toLowerCase());
      return matchCliente && matchOrigem && matchTipo && matchAssunto && matchAtendente;
    });
  }, [data, filterCliente, filterOrigem, filterTipo, filterAssunto, filterAtendente]);

  // Ordenar dados
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'tempo') {
        aVal = parseInt(String(aVal)) || 0;
        bVal = parseInt(String(bVal)) || 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortField, sortOrder]);

  // Obter valores únicos para filtros
  const uniqueClientes = Array.from(new Set(data.map(d => d.cliente))).sort();
  const uniqueOrigens = Array.from(new Set(data.map(d => d.origem))).sort();
  const uniqueTipos = Array.from(new Set(data.map(d => d.tipo))).sort();
  const uniqueAssuntos = Array.from(new Set(data.map(d => d.assunto))).sort();
  const uniqueAtendentes = Array.from(new Set(data.map(d => d.atendente))).sort();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-600">Cliente</label>
          <input
            type="text"
            placeholder="Filtrar cliente..."
            value={filterCliente}
            onChange={(e) => setFilterCliente(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-600">Origem</label>
          <select
            value={filterOrigem}
            onChange={(e) => setFilterOrigem(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {uniqueOrigens.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-600">Tipo</label>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {uniqueTipos.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-600">Assunto</label>
          <select
            value={filterAssunto}
            onChange={(e) => setFilterAssunto(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {uniqueAssuntos.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-600">Atendente</label>
          <select
            value={filterAtendente}
            onChange={(e) => setFilterAtendente(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {uniqueAtendentes.map(at => (
              <option key={at} value={at}>{at}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('dia')}
                >
                  Data <SortIcon field="dia" />
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('cliente')}
                >
                  Cliente <SortIcon field="cliente" />
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('origem')}
                >
                  Origem <SortIcon field="origem" />
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('tipo')}
                >
                  Tipo <SortIcon field="tipo" />
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('assunto')}
                >
                  Assunto <SortIcon field="assunto" />
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('tempo')}
                >
                  Tempo (min) <SortIcon field="tempo" />
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('atendente')}
                >
                  Atendente <SortIcon field="atendente" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-blue-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-700">{item.dia}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700 font-medium">{item.cliente}</div>
                    {item.detalhes && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-semibold">Detalhes:</span> {item.detalhes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.origem}</td>
                  <td className="px-4 py-3 text-gray-700">{item.tipo}</td>
                  <td className="px-4 py-3 text-gray-700">{item.assunto}</td>
                  <td className="px-4 py-3 text-gray-700 font-semibold text-blue-600">{item.tempo}</td>
                  <td className="px-4 py-3 text-gray-700">{item.atendente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>



      {/* Resumo */}
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-semibold">{sortedData.length}</span> de{' '}
        <span className="font-semibold">{data.length}</span> atendimentos
      </div>
    </div>
  );
}
