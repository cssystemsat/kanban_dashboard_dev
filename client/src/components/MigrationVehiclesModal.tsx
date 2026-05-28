import { useState, useCallback } from 'react';
import { X, Send, Plus, Trash2, CheckSquare, Square } from 'lucide-react';

interface Vehicle {
  id: number;
  migrationId: number;
  status: 'enviar' | 'enviado' | 'aguardando' | 'comunicou';
  clientName: string;
  vehicleName: string;
  model?: string;
  vehicleId: string;
  apn?: string;
  apnLogin?: string;
  apnPassword?: string;
  command?: string;
  lineNumber?: string;
  sentAt?: Date;
  communicatedAt?: Date;
  notes?: string;
}

interface MigrationVehiclesModalProps {
  migrationId: number;
  migrationTitle: string;
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onVehiclesChange: (vehicles: Vehicle[]) => void;
}

const STATUS_CONFIG = {
  enviar: { label: 'Enviar', color: '#E0E8F0', textColor: '#4A5F7F' },
  enviado: { label: 'Enviado', color: '#D1FAE5', textColor: '#065F46' },
  aguardando: { label: 'Aguardando', color: '#FEF08A', textColor: '#92400E' },
  comunicou: { label: 'Comunicou', color: '#DBEAFE', textColor: '#0C4A6E' },
};

export default function MigrationVehiclesModal({
  migrationId,
  migrationTitle,
  isOpen,
  onClose,
  vehicles,
  onVehiclesChange,
}: MigrationVehiclesModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddVehicle = () => {
    const newVehicle: Vehicle = {
      id: Math.max(...vehicles.map(v => v.id), 0) + 1,
      migrationId,
      status: 'enviar',
      clientName: '',
      vehicleName: '',
      vehicleId: '',
    };
    onVehiclesChange([...vehicles, newVehicle]);
  };

  const handleDeleteVehicle = (id: number) => {
    onVehiclesChange(vehicles.filter(v => v.id !== id));
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    onVehiclesChange(vehicles.filter(v => !selectedIds.has(v.id)));
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    if (selectedIds.size === vehicles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vehicles.map(v => v.id)));
    }
  };

  const handleToggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleCellChange = (vehicleId: number, field: keyof Vehicle, value: any) => {
    onVehiclesChange(
      vehicles.map(v =>
        v.id === vehicleId ? { ...v, [field]: value } : v
      )
    );
  };

  const handleBulkStatusChange = (newStatus: Vehicle['status']) => {
    if (selectedIds.size === 0) return;
    onVehiclesChange(
      vehicles.map(v =>
        selectedIds.has(v.id) ? { ...v, status: newStatus } : v
      )
    );
  };

  const handleBulkSend = () => {
    if (selectedIds.size === 0) return;
    // Futuramente integrar com API de envio de SMS/comandos
    alert(`Enviando comandos para ${selectedIds.size} veículo(s)...`);
    onVehiclesChange(
      vehicles.map(v =>
        selectedIds.has(v.id)
          ? { ...v, status: 'enviado', sentAt: new Date() }
          : v
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full h-full max-h-screen max-w-7xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E0E8F0' }}>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#001F3F' }}>
              Veículos Migrados
            </h2>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
              {migrationTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b bg-gray-50" style={{ borderColor: '#E0E8F0' }}>
          <button
            onClick={handleAddVehicle}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#1D4ED8' }}
          >
            <Plus className="w-4 h-4" />
            Adicionar Veículo
          </button>

          {selectedIds.size > 0 && (
            <>
              <div className="h-6 w-px" style={{ backgroundColor: '#E0E8F0' }} />
              <span className="text-sm font-semibold" style={{ color: '#4A5F7F' }}>
                {selectedIds.size} selecionado(s)
              </span>

              <select
                onChange={(e) => handleBulkStatusChange(e.target.value as Vehicle['status'])}
                className="px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
              >
                <option value="">Mudar Status</option>
                <option value="enviar">Enviar</option>
                <option value="enviado">Enviado</option>
                <option value="aguardando">Aguardando</option>
                <option value="comunicou">Comunicou</option>
              </select>

              <button
                onClick={handleBulkSend}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#059669' }}
              >
                <Send className="w-4 h-4" />
                Enviar ({selectedIds.size})
              </button>

              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#DC2626' }}
              >
                <Trash2 className="w-4 h-4" />
                Deletar ({selectedIds.size})
              </button>
            </>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid #E0E8F0' }}>
                <th className="p-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {selectedIds.size === vehicles.length && vehicles.length > 0 ? (
                      <CheckSquare className="w-5 h-5" style={{ color: '#1D4ED8' }} />
                    ) : (
                      <Square className="w-5 h-5" style={{ color: '#9CA3AF' }} />
                    )}
                  </button>
                </th>
                <th className="p-3 text-left text-xs font-bold" style={{ color: '#4A5F7F' }}>Status</th>
                <th className="p-3 text-left text-xs font-bold" style={{ color: '#4A5F7F' }}>Cliente</th>
                <th className="p-3 text-left text-xs font-bold" style={{ color: '#4A5F7F' }}>Veículo</th>
                <th className="p-3 text-left text-xs font-bold" style={{ color: '#4A5F7F' }}>Modelo</th>
                <th className="p-3 text-left text-xs font-bold" style={{ color: '#4A5F7F' }}>ID</th>
                <th className="p-3 text-left text-xs font-bold" style={{ color: '#4A5F7F' }}>APN</th>
                <th className="p-3 text-left text-xs font-bold" style={{ color: '#4A5F7F' }}>Login APN</th>
                <th className="p-3 text-left text-xs font-bold" style={{ color: '#4A5F7F' }}>Senha APN</th>
                <th className="p-3 text-left text-xs font-bold" style={{ color: '#4A5F7F' }}>Comando</th>
                <th className="p-3 text-left text-xs font-bold" style={{ color: '#4A5F7F' }}>Nº Linha</th>
                <th className="p-3 text-left text-xs font-bold" style={{ color: '#4A5F7F' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-6 text-center">
                    <p style={{ color: '#9CA3AF' }}>Nenhum veículo adicionado</p>
                  </td>
                </tr>
              ) : (
                vehicles.map(vehicle => (
                  <tr
                    key={vehicle.id}
                    style={{
                      backgroundColor: selectedIds.has(vehicle.id) ? '#EFF6FF' : 'white',
                      borderBottom: '1px solid #E0E8F0',
                    }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleSelect(vehicle.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {selectedIds.has(vehicle.id) ? (
                          <CheckSquare className="w-5 h-5" style={{ color: '#1D4ED8' }} />
                        ) : (
                          <Square className="w-5 h-5" style={{ color: '#9CA3AF' }} />
                        )}
                      </button>
                    </td>
                    <td className="p-3">
                      <select
                        value={vehicle.status}
                        onChange={(e) => handleCellChange(vehicle.id, 'status', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        style={{ borderColor: '#E0E8F0', backgroundColor: STATUS_CONFIG[vehicle.status].color }}
                      >
                        <option value="enviar">Enviar</option>
                        <option value="enviado">Enviado</option>
                        <option value="aguardando">Aguardando</option>
                        <option value="comunicou">Comunicou</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={vehicle.clientName}
                        onChange={(e) => handleCellChange(vehicle.id, 'clientName', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        style={{ borderColor: '#E0E8F0' }}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={vehicle.vehicleName}
                        onChange={(e) => handleCellChange(vehicle.id, 'vehicleName', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        style={{ borderColor: '#E0E8F0' }}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={vehicle.model || ''}
                        onChange={(e) => handleCellChange(vehicle.id, 'model', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        style={{ borderColor: '#E0E8F0' }}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={vehicle.vehicleId}
                        onChange={(e) => handleCellChange(vehicle.id, 'vehicleId', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        style={{ borderColor: '#E0E8F0' }}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={vehicle.apn || ''}
                        onChange={(e) => handleCellChange(vehicle.id, 'apn', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        style={{ borderColor: '#E0E8F0' }}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={vehicle.apnLogin || ''}
                        onChange={(e) => handleCellChange(vehicle.id, 'apnLogin', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        style={{ borderColor: '#E0E8F0' }}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="password"
                        value={vehicle.apnPassword || ''}
                        onChange={(e) => handleCellChange(vehicle.id, 'apnPassword', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        style={{ borderColor: '#E0E8F0' }}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={vehicle.command || ''}
                        onChange={(e) => handleCellChange(vehicle.id, 'command', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        style={{ borderColor: '#E0E8F0' }}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={vehicle.lineNumber || ''}
                        onChange={(e) => handleCellChange(vehicle.id, 'lineNumber', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                        style={{ borderColor: '#E0E8F0' }}
                      />
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => {
                          // Futuramente integrar com API de envio
                          alert(`Enviando comando para ${vehicle.vehicleName}...`);
                          handleCellChange(vehicle.id, 'status', 'enviado');
                          handleCellChange(vehicle.id, 'sentAt', new Date());
                        }}
                        className="p-1.5 rounded hover:bg-blue-100 transition-colors"
                        title="Enviar comando"
                      >
                        <Send className="w-4 h-4" style={{ color: '#1D4ED8' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="p-1.5 rounded hover:bg-red-100 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: '#E0E8F0' }}>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Total: <span className="font-bold" style={{ color: '#001F3F' }}>{vehicles.length}</span> veículo(s)
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: '#E0E8F0', color: '#001F3F' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
