import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface Equipment {
  id: number;
  model: string;
  port: string;
}

interface CreateMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    clientName: string;
    sourceSystem: string;
    sourceLogin: string;
    sourcePassword: string;
    equipment: Equipment[];
    ssxLogin: string;
    ssxPassword: string;
  }) => void;
}

export default function CreateMigrationModal({
  isOpen,
  onClose,
  onCreate,
}: CreateMigrationModalProps) {
  const [clientName, setClientName] = useState('');
  const [sourceSystem, setSourceSystem] = useState('');
  const [sourceLogin, setSourceLogin] = useState('');
  const [sourcePassword, setSourcePassword] = useState('');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [ssxLogin, setSsxLogin] = useState('');
  const [ssxPassword, setSsxPassword] = useState('');
  const [newEquipmentModel, setNewEquipmentModel] = useState('');
  const [newEquipmentPort, setNewEquipmentPort] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleAddEquipment = () => {
    if (!newEquipmentModel.trim() || !newEquipmentPort.trim()) {
      setErrors(['Modelo e porta são obrigatórios']);
      return;
    }

    const newEquipment: Equipment = {
      id: Math.max(...equipment.map(e => e.id), 0) + 1,
      model: newEquipmentModel,
      port: newEquipmentPort,
    };

    setEquipment([...equipment, newEquipment]);
    setNewEquipmentModel('');
    setNewEquipmentPort('');
    setErrors([]);
  };

  const handleRemoveEquipment = (id: number) => {
    setEquipment(equipment.filter(e => e.id !== id));
  };

  const handleSubmit = () => {
    const newErrors: string[] = [];

    if (!clientName.trim()) newErrors.push('Nome do cliente é obrigatório');
    if (!sourceSystem.trim()) newErrors.push('Plataforma de origem é obrigatória');
    if (!sourceLogin.trim()) newErrors.push('Login do sistema antigo é obrigatório');
    if (!sourcePassword.trim()) newErrors.push('Senha do sistema antigo é obrigatória');
    if (equipment.length === 0) newErrors.push('Adicione pelo menos um modelo de equipamento');
    if (!ssxLogin.trim()) newErrors.push('Login SSX é obrigatório');
    if (!ssxPassword.trim()) newErrors.push('Senha SSX é obrigatória');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    onCreate({
      clientName,
      sourceSystem,
      sourceLogin,
      sourcePassword,
      equipment,
      ssxLogin,
      ssxPassword,
    });

    // Reset form
    setClientName('');
    setSourceSystem('');
    setSourceLogin('');
    setSourcePassword('');
    setEquipment([]);
    setSsxLogin('');
    setSsxPassword('');
    setErrors([]);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E0E8F0' }}>
          <h2 className="text-xl font-bold" style={{ color: '#001F3F' }}>
            Nova Migração
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="text-sm space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx} style={{ color: '#991B1B' }}>
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            {/* Nome do Cliente */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#001F3F' }}>
                Nome do Cliente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: SSX Rastreamento"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
              />
            </div>

            {/* Plataforma de Origem */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#001F3F' }}>
                Plataforma de Origem
              </label>
              <input
                type="text"
                value={sourceSystem}
                onChange={(e) => setSourceSystem(e.target.value)}
                placeholder="Ex: Sensorweb, Rastreator, etc"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
              />
            </div>

            {/* Login do Sistema Antigo */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#001F3F' }}>
                Login do Sistema Antigo
              </label>
              <input
                type="text"
                value={sourceLogin}
                onChange={(e) => setSourceLogin(e.target.value)}
                placeholder="Ex: usuario@email.com"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
              />
            </div>

            {/* Senha do Sistema Antigo */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#001F3F' }}>
                Senha do Sistema Antigo
              </label>
              <input
                type="password"
                value={sourcePassword}
                onChange={(e) => setSourcePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
              />
            </div>

            {/* Modelos de Equipamento */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#001F3F' }}>
                Modelos de Equipamento
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newEquipmentModel}
                  onChange={(e) => setNewEquipmentModel(e.target.value)}
                  placeholder="Ex: J16"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: '#E0E8F0' }}
                />
                <input
                  type="text"
                  value={newEquipmentPort}
                  onChange={(e) => setNewEquipmentPort(e.target.value)}
                  placeholder="Ex: 17263"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: '#E0E8F0' }}
                />
                <button
                  onClick={handleAddEquipment}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#1D4ED8' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Equipment List */}
              {equipment.length > 0 && (
                <div className="space-y-2">
                  {equipment.map(eq => (
                    <div
                      key={eq.id}
                      className="flex items-center justify-between p-2 rounded-lg"
                      style={{ backgroundColor: '#F3F4F6' }}
                    >
                      <span className="text-sm" style={{ color: '#4A5F7F' }}>
                        {eq.model} - Porta {eq.port}
                      </span>
                      <button
                        onClick={() => handleRemoveEquipment(eq.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Login SSX */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#001F3F' }}>
                Login SSX
              </label>
              <input
                type="text"
                value={ssxLogin}
                onChange={(e) => setSsxLogin(e.target.value)}
                placeholder="Ex: usuario@ssx.com"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
              />
            </div>

            {/* Senha SSX */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#001F3F' }}>
                Senha SSX
              </label>
              <input
                type="password"
                value={ssxPassword}
                onChange={(e) => setSsxPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
              />
            </div>
          </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-6 border-t" style={{ borderColor: '#E0E8F0' }}>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: '#E0E8F0', color: '#001F3F' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#1D4ED8' }}
          >
            Criar Migração
          </button>
          </div>
        </div>
      </div>
    </>
  );
}
