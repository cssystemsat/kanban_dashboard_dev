import { X } from 'lucide-react';

interface ClienteUrs {
  nome: string;
  valor: number;
  tipo: 'ganho' | 'perda';
}

interface URsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: ClienteUrs[];
  tipo: 'ganho' | 'perda';
}

export default function URsModal({ isOpen, onClose, clientes, tipo }: URsModalProps) {
  if (!isOpen) return null;

  const titulo = tipo === 'ganho' ? 'Clientes com Ganho de URs' : 'Clientes com Perda de URs';
  const corTitulo = tipo === 'ganho' ? '#10B981' : '#EF4444';
  const corValor = tipo === 'ganho' ? '#10B981' : '#EF4444';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'transparent' }}>
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E0E8F0' }}>
          <h2 className="text-xl font-bold" style={{ color: corTitulo }}>
            {titulo}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" style={{ color: '#001F3F' }} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {clientes.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              Nenhum cliente encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {clientes.map((cliente, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: '#F5F7FA' }}
                >
                  <span className="font-medium" style={{ color: '#001F3F' }}>
                    {cliente.nome}
                  </span>
                  <span
                    className="font-bold text-lg"
                    style={{ color: corValor }}
                  >
                    {tipo === 'ganho' ? '+' : '-'}{Math.abs(cliente.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-sm text-gray-600">
            Total: <span style={{ color: corValor, fontWeight: 'bold' }}>
              {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
            </span>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: '#F5F7FA',
              color: '#001F3F',
              border: '1px solid #E0E8F0'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
