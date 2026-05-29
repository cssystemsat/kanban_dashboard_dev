import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ChevronRight } from 'lucide-react';
import MigrationVehiclesModal from '@/components/MigrationVehiclesModal';

interface MigrationCard {
  id: number;
  title: string;
  description?: string;
  status: 'planejamento' | 'em_progresso' | 'concluido' | 'cancelado';
  sourceSystem?: string;
  targetSystem?: string;
  estimatedRecords?: number;
  processedRecords: number;
  owner?: string;
  priority: 'baixa' | 'media' | 'alta';
  notes?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const STATUS_CONFIG = {
  planejamento: { label: 'Planejamento', color: '#E0E8F0', textColor: '#4A5F7F' },
  em_progresso: { label: 'Em Progresso', color: '#FEF08A', textColor: '#92400E' },
  concluido: { label: 'Concluído', color: '#D1FAE5', textColor: '#065F46' },
  cancelado: { label: 'Cancelado', color: '#FEE2E2', textColor: '#991B1B' },
};

const PRIORITY_CONFIG = {
  baixa: { label: 'Baixa', color: '#D1FAE5' },
  media: { label: 'Média', color: '#FEF08A' },
  alta: { label: 'Alta', color: '#FEE2E2' },
};

interface MigratedVehicle {
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

export default function Migration() {
  const [migrations, setMigrations] = useState<MigrationCard[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showVehiclesModal, setShowVehiclesModal] = useState(false);
  const [selectedMigrationId, setSelectedMigrationId] = useState<number | null>(null);
  const [vehiclesByMigration, setVehiclesByMigration] = useState<Record<number, MigratedVehicle[]>>({});
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    sourceSystem: string;
    targetSystem: string;
    estimatedRecords: string;
    priority: 'baixa' | 'media' | 'alta';
    notes: string;
  }>({
    title: '',
    description: '',
    sourceSystem: '',
    targetSystem: '',
    estimatedRecords: '',
    priority: 'media',
    notes: '',
  });

  // Mock data para teste
  useEffect(() => {
    setMigrations([
      {
        id: 1,
        title: 'Migração MySQL → PostgreSQL',
        description: 'Migração completa do banco de dados principal',
        status: 'planejamento',
        sourceSystem: 'MySQL',
        targetSystem: 'PostgreSQL',
        estimatedRecords: 500000,
        processedRecords: 0,
        owner: 'admin@example.com',
        priority: 'alta',
        notes: 'Primeira fase da migração 2.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        title: 'Sincronização de Clientes',
        description: 'Sincronizar dados de clientes entre sistemas',
        status: 'em_progresso',
        sourceSystem: 'Planilha Google',
        targetSystem: 'PostgreSQL',
        estimatedRecords: 1000,
        processedRecords: 450,
        owner: 'user@example.com',
        priority: 'media',
        notes: 'Em andamento',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Mock data de veículos
    setVehiclesByMigration({
      1: [
        {
          id: 1,
          migrationId: 1,
          status: 'enviar',
          clientName: 'Cliente A',
          vehicleName: 'Veículo 001',
          model: 'Tracker',
          vehicleId: 'VEH001',
          apn: 'apn.example.com',
          apnLogin: 'user',
          apnPassword: 'pass123',
          command: 'AT+COMMAND',
          lineNumber: '11999999999',
        },
        {
          id: 2,
          migrationId: 1,
          status: 'enviado',
          clientName: 'Cliente B',
          vehicleName: 'Veículo 002',
          model: 'Tracker Pro',
          vehicleId: 'VEH002',
          apn: 'apn.example.com',
          apnLogin: 'user2',
          apnPassword: 'pass456',
          command: 'AT+COMMAND',
          lineNumber: '11988888888',
        },
      ],
      2: [],
    });
  }, []);

  const handleAddMigration = () => {
    if (!formData.title.trim()) return;

    const newMigration: MigrationCard = {
      id: Math.max(...migrations.map(m => m.id), 0) + 1,
      title: formData.title,
      description: formData.description,
      status: 'planejamento',
      sourceSystem: formData.sourceSystem,
      targetSystem: formData.targetSystem,
      estimatedRecords: formData.estimatedRecords ? parseInt(formData.estimatedRecords) : undefined,
      processedRecords: 0,
      priority: formData.priority,
      notes: formData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMigrations([...migrations, newMigration]);
    setFormData({ title: '', description: '', sourceSystem: '', targetSystem: '', estimatedRecords: '', priority: 'media', notes: '' });
    setShowModal(false);
  };

  const handleDeleteMigration = (id: number) => {
    setMigrations(migrations.filter(m => m.id !== id));
  };

  const handleStatusChange = (id: number, newStatus: MigrationCard['status']) => {
    setMigrations(migrations.map(m => m.id === id ? { ...m, status: newStatus } : m));
  };

  const groupedMigrations = {
    planejamento: migrations.filter(m => m.status === 'planejamento'),
    em_progresso: migrations.filter(m => m.status === 'em_progresso'),
    concluido: migrations.filter(m => m.status === 'concluido'),
    cancelado: migrations.filter(m => m.status === 'cancelado'),
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#001F3F' }}>Migração 2.0</h1>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Gerencie todas as migrações de dados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#1D4ED8' }}
        >
          <Plus className="w-5 h-5" />
          Nova Migração
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(status => {
          const config = STATUS_CONFIG[status];
          const cards = groupedMigrations[status];

          return (
            <div key={status} className="flex flex-col gap-3 bg-white rounded-lg border p-4" style={{ borderColor: '#E0E8F0' }}>
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: config.color }} />
                  <h2 className="font-bold text-sm" style={{ color: '#001F3F' }}>
                    {config.label}
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: config.color, color: config.textColor }}>
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3">
                {cards.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-center">
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>Nenhuma migração</p>
                  </div>
                ) : (
                  cards.map(migration => (
                    <div
                      key={migration.id}
                      className="bg-white rounded-lg border p-3 transition-all hover:shadow-md hover:-translate-y-0.5"
                      style={{ borderColor: '#E0E8F0' }}
                    >
                      {/* Title */}
                      <h3 className="font-bold text-sm mb-2" style={{ color: '#001F3F' }}>
                        {migration.title}
                      </h3>

                      {/* Description */}
                      {migration.description && (
                        <p className="text-xs mb-2 line-clamp-2" style={{ color: '#9CA3AF' }}>
                          {migration.description}
                        </p>
                      )}

                      {/* Priority Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: PRIORITY_CONFIG[migration.priority].color }}>
                          {PRIORITY_CONFIG[migration.priority].label}
                        </span>
                      </div>

                      {/* Systems */}
                      {migration.sourceSystem && migration.targetSystem && (
                        <div className="flex items-center gap-1 text-xs mb-2" style={{ color: '#4A5F7F' }}>
                          <span className="font-semibold">{migration.sourceSystem}</span>
                          <ChevronRight className="w-3 h-3" />
                          <span className="font-semibold">{migration.targetSystem}</span>
                        </div>
                      )}

                      {/* Progress */}
                      {migration.estimatedRecords && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1" style={{ color: '#4A5F7F' }}>
                            <span>Progresso</span>
                            <span>{migration.processedRecords} / {migration.estimatedRecords}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${(migration.processedRecords / migration.estimatedRecords) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Status Buttons */}
                      <div className="flex gap-1 mb-2">
                        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(newStatus => (
                          <button
                            key={newStatus}
                            onClick={() => handleStatusChange(migration.id, newStatus)}
                            className="text-xs px-2 py-1 rounded transition-all hover:opacity-80"
                            style={{
                              backgroundColor: migration.status === newStatus ? STATUS_CONFIG[newStatus].color : '#F3F4F6',
                              color: migration.status === newStatus ? STATUS_CONFIG[newStatus].textColor : '#9CA3AF',
                              fontWeight: migration.status === newStatus ? '600' : '400',
                            }}
                          >
                            {STATUS_CONFIG[newStatus].label.split(' ')[0]}
                          </button>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedMigrationId(migration.id);
                            setShowVehiclesModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold transition-all hover:opacity-90"
                          style={{ backgroundColor: '#DBEAFE', color: '#0C4A6E' }}
                        >
                          <ChevronRight className="w-3 h-3" />
                          Veículos
                        </button>
                        <button
                          onClick={() => setEditingId(migration.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold transition-all hover:opacity-90"
                          style={{ backgroundColor: '#E0E8F0', color: '#001F3F' }}
                        >
                          <Edit2 className="w-3 h-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteMigration(migration.id)}
                          className="flex items-center justify-center py-1.5 px-3 rounded text-xs font-semibold transition-all hover:opacity-90"
                          style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vehicles Modal */}
      {selectedMigrationId && (
        <MigrationVehiclesModal
          migrationId={selectedMigrationId}
          migrationTitle={migrations.find(m => m.id === selectedMigrationId)?.title || ''}
          isOpen={showVehiclesModal}
          onClose={() => setShowVehiclesModal(false)}
          vehicles={vehiclesByMigration[selectedMigrationId] || []}
          onVehiclesChange={(vehicles) =>
            setVehiclesByMigration(prev => ({
              ...prev,
              [selectedMigrationId]: vehicles,
            }))
          }
        />
      )}

      {/* Migration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#001F3F' }}>
              Nova Migração
            </h2>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Título da migração"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
              />

              <textarea
                placeholder="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
                rows={3}
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Sistema de origem"
                  value={formData.sourceSystem}
                  onChange={(e) => setFormData({ ...formData, sourceSystem: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: '#E0E8F0' }}
                />
                <input
                  type="text"
                  placeholder="Sistema de destino"
                  value={formData.targetSystem}
                  onChange={(e) => setFormData({ ...formData, targetSystem: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: '#E0E8F0' }}
                />
              </div>

              <input
                type="number"
                placeholder="Registros estimados"
                value={formData.estimatedRecords}
                onChange={(e) => setFormData({ ...formData, estimatedRecords: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
              />

              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: (e.target.value as any) as 'baixa' | 'media' | 'alta' })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
              >
                <option value="baixa">Prioridade Baixa</option>
                <option value="media">Prioridade Média</option>
                <option value="alta">Prioridade Alta</option>
              </select>

              <textarea
                placeholder="Notas"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#E0E8F0' }}
                rows={2}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: '#E0E8F0', color: '#001F3F' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddMigration}
                  className="flex-1 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#1D4ED8' }}
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
