import { useMemo } from 'react';
import { ClientData } from '@/hooks/useKanbanData';

interface BrazilMapVisualProps {
  clients: ClientData[];
}

export default function BrazilMapVisual({ clients }: BrazilMapVisualProps) {
  // Contar clientes por estado
  const clientsByState = useMemo(() => {
    const counts: Record<string, number> = {};
    
    clients.forEach(client => {
      if (client.estado) {
        counts[client.estado] = (counts[client.estado] || 0) + 1;
      }
    });
    
    return counts;
  }, [clients]);

  const totalClients = clients.length;
  const statesWithClients = Object.keys(clientsByState).length;
  const maxClients = Math.max(...Object.values(clientsByState), 1);

  // Ranking de estados
  const stateRanking = useMemo(() => {
    return Object.entries(clientsByState)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24);
  }, [clientsByState]);

  return (
    <div className="w-full flex flex-col gap-6 bg-white rounded-lg p-6 border" style={{ borderColor: '#E0E8F0' }}>
      <h2 className="text-xl font-bold" style={{ color: '#001F3F' }}>
        Distribuição de Clientes por Estado
      </h2>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-sm text-gray-600 mb-1">Total de Clientes</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>{totalClients}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-sm text-gray-600 mb-1">Estados com Clientes</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>{statesWithClients}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-sm text-gray-600 mb-1">Maior Concentração</p>
          <p className="text-2xl font-bold" style={{ color: '#001F3F' }}>
            {stateRanking[0]?.[0] || '—'}
          </p>
        </div>
      </div>

      {/* Mapa do Brasil */}
      <div className="flex justify-center">
        <img 
          src="https://private-us-east-1.manuscdn.com/sessionFile/qIN3XO1hRZMZhD9fFDUrap/sandbox/FSTgVDKw1fLp01jau3dbcD-img-1_1772152530000_na1fn_bWFwYS1icmFzaWwtY2xpZW50ZXM.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvcUlOM1hPMWhSWk1aaEQ5ZkZEVXJhcC9zYW5kYm94L0ZTVGdWREt3MWZMcDAxamF1M2RiY0QtaW1nLTFfMTc3MjE1MjUzMDAwMF9uYTFmbl9iV0Z3WVMxaWNtRnphV3d0WTJ4cFpXNTBaWE0ucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=GulO6xkO3I75YDFU1qWNxfsizzFKNM5u0cxy~m66pwrWpuYaQmmINsrd~YJ-2yP1hkA3O7W1pt3vAalFXF7DCqzNUFx1zbzP6WP4mtEDJ-BS-GwXSgPwqLDW3T86RyfNT7Xeefhh4NwO4cc034R6ai0aFmeeOlvC2PlEwHW4oOJKzUfLchcE0UZLRoqMPUg~qI39b~JD0kiisqlB8KfQu6QDaljgrfuNfNVkzW47-R~DXx2sDtfL1iJIK8T8r3PTCIcQXnS0ssOsxcXnj2k2yXaZI4-sBfOR8cm2Vn~ND9B5fqFzqpioEaK8pHVqKRz30QwDaZOzS5iZHcPpaXvP1w__" 
          alt="Mapa do Brasil com distribuição de clientes"
          className="max-w-2xl h-auto rounded-lg"
        />
      </div>

      {/* Ranking de Estados */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#001F3F' }}>
          Ranking de Estados
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '2px solid #E0E8F0' }}>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: '#001F3F' }}>Posição</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: '#001F3F' }}>Estado</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: '#001F3F' }}>Quantidade</th>
                <th className="text-right py-2 px-3 font-semibold" style={{ color: '#001F3F' }}>Percentual</th>
              </tr>
            </thead>
            <tbody>
              {stateRanking.map((entry, index) => {
                const [state, count] = entry;
                const percentage = ((count / totalClients) * 100).toFixed(1);
                return (
                  <tr key={state} style={{ borderBottom: '1px solid #E0E8F0' }}>
                    <td className="py-2 px-3">#{index + 1}</td>
                    <td className="py-2 px-3 font-semibold">{state}</td>
                    <td className="py-2 px-3 text-right">{count}</td>
                    <td className="py-2 px-3 text-right">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
