import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, Plus, Trash2, Database, CheckSquare, Square } from 'lucide-react';

const STAGES = [
  { id: 'venda_feita', label: 'Vendido' },
  { id: 'formulario', label: 'Formulário respondido' },
  { id: 'revisao_dados', label: 'Pronto para desenvolvimento' },
  { id: 'desenvolvimento', label: 'Em desenvolvimento' },
  { id: 'envio_lojas', label: 'Enviado para a Loja' },
  { id: 'teste_liberacao', label: 'Recuso pela Loja' },
  { id: 'app_entregue', label: 'App entregue' },
];

const STAGE_LABELS: Record<string, string> = {
  venda_feita: 'Vendido',
  formulario: 'Formulário respondido',
  revisao_dados: 'Pronto para desenvolvimento',
  desenvolvimento: 'Em desenvolvimento',
  envio_lojas: 'Enviado para a Loja',
  teste_liberacao: 'Recuso pela Loja',
  app_entregue: 'App entregue',
};

const CHECKLIST_ITEMS = [
  { key: 'logomarca', label: 'Logomarca' },
  { key: 'descricaoCurta', label: 'Descrição Curta' },
  { key: 'descricaoLonga', label: 'Descrição Longa' },
  { key: 'politicaPrivacidade', label: 'Política de privacidade' },
] as const;

interface KanbanCard {
  id: number;
  companyName: string;
  csm: string;
  comercial: string;
  startDate: string | Date;
  stage: string;
  order: number;
  priority?: number;
  refusalReason?: string;
}

interface HistoryEntry {
  id: number;
  cardId: number;
  fromStage: string;
  toStage: string;
  movedBy: string;
  movedAt: string | Date;
}

interface ChecklistData {
  logomarca: boolean;
  descricaoCurta: boolean;
  descricaoLonga: boolean;
  politicaPrivacidade: boolean;
}

function getDaysSince(startDate: string | Date): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export default function AppPersonalizado() {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedCardName, setSelectedCardName] = useState('');
  const [selectedCardData, setSelectedCardData] = useState<KanbanCard | null>(null);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [checklistState, setChecklistState] = useState<ChecklistData>({
    logomarca: false,
    descricaoCurta: false,
    descricaoLonga: false,
    politicaPrivacidade: false,
  });
  const [formData, setFormData] = useState({ companyName: '', csm: '', comercial: '', startDate: '' });

  const { data: user } = trpc.auth.me.useQuery();
  const { data: myPerms } = trpc.config.myPermissions.useQuery();
  const listCards = trpc.appKanban.list.useQuery();
  const createCard = trpc.appKanban.create.useMutation();
  const moveCard = trpc.appKanban.move.useMutation();
  const deleteCardMutation = trpc.appKanban.delete.useMutation();
  const updateChecklist = trpc.appKanban.updateChecklist.useMutation();
  const updatePriority = trpc.appKanban.updatePriority.useMutation();
  const updateRefusalReason = trpc.appKanban.updateRefusalReason.useMutation();

  // Query de histórico com cardId dinâmico
  const historyQuery = trpc.appKanban.history.useQuery(
    { cardId: selectedCardId ?? 0 },
    { enabled: selectedCardId !== null && selectedCardId > 0, staleTime: 0, refetchOnMount: 'always' }
  );

  // Query de checklist com cardId dinâmico
  const checklistQuery = trpc.appKanban.getChecklist.useQuery(
    { cardId: selectedCardData?.id ?? 0 },
    { enabled: showDataModal && selectedCardData !== null && selectedCardData.id > 0, staleTime: 0 }
  );

  useEffect(() => {
    if (listCards.data) {
      setCards(listCards.data as KanbanCard[]);
    }
  }, [listCards.data]);

  useEffect(() => {
    if (historyQuery.data && selectedCardId) {
      setHistoryData(historyQuery.data as HistoryEntry[]);
    }
  }, [historyQuery.data, selectedCardId]);

  useEffect(() => {
    if (checklistQuery.data) {
      setChecklistState({
        logomarca: checklistQuery.data.logomarca ?? false,
        descricaoCurta: checklistQuery.data.descricaoCurta ?? false,
        descricaoLonga: checklistQuery.data.descricaoLonga ?? false,
        politicaPrivacidade: checklistQuery.data.politicaPrivacidade ?? false,
      });
    } else if (showDataModal) {
      setChecklistState({
        logomarca: false,
        descricaoCurta: false,
        descricaoLonga: false,
        politicaPrivacidade: false,
      });
    }
  }, [checklistQuery.data, showDataModal]);

  const isAdmin = myPerms?.isAdmin === true; // Usar allowed_emails.isAdmin, não user.role
  const canMoveCards = isAdmin || myPerms?.canMoveAppKanban === true;
  const canEditChecklist = isAdmin; // Apenas admins podem editar checklist

  const handleChecklistToggle = async (key: keyof ChecklistData) => {
    if (!selectedCardData || !canEditChecklist) return;
    const newValue = !checklistState[key];
    setChecklistState(prev => ({ ...prev, [key]: newValue }));
    try {
      await updateChecklist.mutateAsync({
        cardId: selectedCardData.id,
        [key]: newValue,
      });
    } catch (error) {
      // Revert on error
      setChecklistState(prev => ({ ...prev, [key]: !newValue }));
      console.error('Erro ao atualizar checklist:', error);
    }
  };

  const handleCreateCard = async () => {
    if (!formData.companyName || !formData.csm || !formData.comercial || !formData.startDate) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      await createCard.mutateAsync({
        companyName: formData.companyName,
        csm: formData.csm,
        comercial: formData.comercial,
        startDate: formData.startDate,
      });
      setFormData({ companyName: '', csm: '', comercial: '', startDate: '' });
      setShowCreateDialog(false);
      listCards.refetch();
    } catch (error) {
      console.error('Erro ao criar card:', error);
      alert('Erro ao criar card');
    }
  };

  const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (toStage: string) => {
    if (!draggedCard || !canMoveCards || draggedCard.stage === toStage) {
      setDraggedCard(null);
      return;
    }

    // Optimistic update
    setCards(prev => prev.map(c => c.id === draggedCard.id ? { ...c, stage: toStage } : c));

    try {
      await moveCard.mutateAsync({
        cardId: draggedCard.id,
        fromStage: draggedCard.stage,
        toStage,
        newOrder: 0,
      });
      listCards.refetch();
    } catch (error) {
      console.error('Erro ao mover card:', error);
      listCards.refetch(); // Revert on error
    }

    setDraggedCard(null);
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!isAdmin) return;
    if (!confirm('Tem certeza que deseja deletar este card?')) return;

    try {
      await deleteCardMutation.mutateAsync({ cardId });
      listCards.refetch();
    } catch (error) {
      console.error('Erro ao deletar card:', error);
    }
  };

  const handleShowHistory = (cardId: number, cardName: string) => {
    setSelectedCardId(cardId);
    setSelectedCardName(cardName);
    setHistoryData([]);
    setShowHistoryModal(true);
    // Force refetch when opening modal
    setTimeout(() => historyQuery.refetch(), 100);
  };

  const handleShowData = (card: KanbanCard) => {
    setSelectedCardData(card);
    setShowDataModal(true);
  };

  const getCardsByStage = (stageId: string) => {
    return cards.filter(card => {
      const matchesStage = card.stage === stageId;
      const matchesSearch = searchQuery === '' || 
        card.companyName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStage && matchesSearch;
    });
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen flex flex-col md:ml-20" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header */}
      <div className="px-6 pt-3 pb-2 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">App Personalizado</h1>
        {canMoveCards && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-1 whitespace-nowrap h-7 text-xs px-3">
                <Plus className="w-3 h-3" />
                Adicionar Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome da Empresa"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
                <select
                  value={formData.csm}
                  onChange={(e) => setFormData({ ...formData, csm: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione o CSM</option>
                  <option value="João">João</option>
                  <option value="Duda">Duda</option>
                  <option value="Clarice">Clarice</option>
                  <option value="Lucas">Lucas</option>
                  <option value="Luis">Luis</option>
                  <option value="Rafaela">Rafaela</option>
                  <option value="Jeferson">Jeferson</option>
                </select>
                <select
                  value={formData.comercial}
                  onChange={(e) => setFormData({ ...formData, comercial: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione o Comercial</option>
                  <option value="Patrícia Fernandes">Patrícia Fernandes</option>
                  <option value="Aline">Aline</option>
                  <option value="Carlos">Carlos</option>
                  <option value="Alessandro">Alessandro</option>
                  <option value="Heitor">Heitor</option>
                </select>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
                <Button onClick={handleCreateCard} className="w-full">
                  Criar Card
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search bar */}
      <div className="px-6 py-3 border-b" style={{ borderColor: '#E0E8F0' }}>
        <Input
          placeholder="Buscar cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md h-9 text-sm"
        />
      </div>

      {/* Kanban Board - Todas as colunas visíveis */}
      <div className="flex-1 px-3 pb-4 overflow-hidden">
        <div className="flex gap-1.5" style={{ height: 'calc(100vh - 140px)', width: '100%' }}>
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              style={{ flex: '1 1 0', minWidth: '120px' }}
              className={`bg-white rounded border border-gray-200 flex flex-col overflow-hidden transition-all ${
                draggedCard && draggedCard.stage !== stage.id ? 'ring-2 ring-blue-200' : ''
              }`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* Stage Header */}
              <div className="px-2 py-1.5 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-[11px] text-gray-700 truncate">
                  {stage.label}
                </h2>
                <span className="text-[10px] text-gray-400">
                  {getCardsByStage(stage.id).length} {getCardsByStage(stage.id).length === 1 ? 'empresa' : 'empresas'}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                {getCardsByStage(stage.id).map((card) => (
                  <div
                    key={card.id}
                    draggable={canMoveCards}
                    onDragStart={(e) => handleDragStart(e, card)}
                    className={`p-2 bg-gray-50 rounded border border-gray-200 transition-all hover:shadow-sm hover:border-gray-300 ${
                      canMoveCards ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                    } ${draggedCard?.id === card.id ? 'opacity-50' : ''}`}
                  >
                    {/* Card Title + Delete */}
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <h3 className="font-semibold text-[11px] text-gray-900 leading-tight line-clamp-2">
                        {card.companyName}
                      </h3>
                      {canMoveCards && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                          className="text-red-400 hover:text-red-600 flex-shrink-0"
                          title="Deletar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Card Info */}
                    <p className="text-[10px] text-gray-500 truncate">
                      CSM: {card.csm}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      Comercial: {card.comercial}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {formatDate(card.startDate)}
                    </p>
                    {/* Dias corridos */}
                    <p className="text-[10px] font-semibold text-orange-600 mb-1.5">
                      {getDaysSince(card.startDate)} dias
                    </p>

                    {/* Priority Dropdown - Apenas para desenvolvimento */}
                    {stage.id === 'desenvolvimento' && isAdmin && (
                      <div className="mb-1.5">
                        <select
                          value={card.priority || 0}
                          onChange={(e) => {
                            const newPriority = parseInt(e.target.value);
                            if (newPriority > 0) {
                              updatePriority.mutateAsync({
                                cardId: card.id,
                                priority: newPriority,
                              }).then(() => {
                                listCards.refetch();
                              }).catch((error) => {
                                console.error('Erro ao atualizar prioridade:', error);
                              });
                            }
                          }}
                          className="w-full h-6 text-[10px] border border-purple-200 rounded bg-purple-50 px-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400"
                        >
                          <option value="0">Sem prioridade</option>
                          {Array.from({ length: getCardsByStage(stage.id).length }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>
                              Prioridade {num}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Motivo de Recusa - Apenas para teste_liberacao */}
                    {stage.id === 'teste_liberacao' && isAdmin && (
                      <div className="mb-1.5">
                        <textarea
                          value={card.refusalReason || ''}
                          onChange={(e) => {
                            const newReason = e.target.value;
                            updateRefusalReason.mutateAsync({
                              cardId: card.id,
                              refusalReason: newReason || undefined,
                            }).then(() => {
                              listCards.refetch();
                            }).catch((error) => {
                              console.error('Erro ao atualizar motivo de recusa:', error);
                            });
                          }}
                          placeholder="Motivo da recusa..."
                          className="w-full h-12 text-[10px] border border-red-200 rounded bg-red-50 px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
                        />
                      </div>
                    )}

                    {/* Buttons: Info + Dados */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleShowHistory(card.id, card.companyName)}
                        className="flex-1 flex items-center justify-center gap-1 h-5 text-[10px] text-gray-500 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                      >
                        <Info className="w-2.5 h-2.5" />
                        Info
                      </button>
                      <button
                        onClick={() => handleShowData(card)}
                        className="flex-1 flex items-center justify-center gap-1 h-5 text-[10px] text-blue-500 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                      >
                        <Database className="w-2.5 h-2.5" />
                        Dados
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Dados - Fundo transparente */}
      {showDataModal && selectedCardData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowDataModal(false)}
        >
          <div className="absolute inset-0 bg-transparent" />
          <div
            className="relative bg-white rounded-lg shadow-2xl border border-gray-300 w-[90vw] max-w-md p-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">Dados - {selectedCardData.companyName}</h3>
              <button
                onClick={() => setShowDataModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-500">Empresa</p>
                <p className="text-sm font-semibold text-gray-800">{selectedCardData.companyName}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-500">CSM</p>
                <p className="text-sm font-semibold text-gray-800">{selectedCardData.csm}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-500">Data de Início</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(selectedCardData.startDate)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-500">Etapa Atual</p>
                <p className="text-sm font-semibold text-gray-800">{STAGE_LABELS[selectedCardData.stage] || selectedCardData.stage}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-500">Dias Corridos</p>
                <p className="text-sm font-semibold text-orange-600">{getDaysSince(selectedCardData.startDate)} dias</p>
              </div>

              {/* Checklist */}
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Checklist de Documentos</p>
                <div className="space-y-2">
                  {CHECKLIST_ITEMS.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleChecklistToggle(item.key)}
                      disabled={!canEditChecklist}
                      className={`w-full flex items-center gap-2 p-2 rounded border transition-all text-left ${
                        checklistState[item.key]
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      } ${!canEditChecklist ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {checklistState[item.key] ? (
                        <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${checklistState[item.key] ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  {CHECKLIST_ITEMS.filter(i => checklistState[i.key]).length}/{CHECKLIST_ITEMS.length} concluídos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico - Fundo transparente */}
      {showHistoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowHistoryModal(false)}
        >
          {/* Overlay transparente (sem fundo preto) */}
          <div className="absolute inset-0 bg-transparent" />

          {/* Modal Content */}
          <div
            className="relative bg-white rounded-lg shadow-2xl border border-gray-300 w-[90vw] max-w-md p-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">Histórico - {selectedCardName}</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              {historyQuery.isLoading ? (
                <p className="text-gray-500 text-xs text-center py-4">Carregando...</p>
              ) : historyData.length > 0 ? (
                historyData.map((entry) => (
                  <div key={entry.id} className="p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                    <p className="font-semibold text-gray-800">
                      {STAGE_LABELS[entry.fromStage] || entry.fromStage} → {STAGE_LABELS[entry.toStage] || entry.toStage}
                    </p>
                    <p className="text-gray-500 mt-0.5">
                      Por: {entry.movedBy} · {formatDate(entry.movedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-xs text-center py-4">Nenhuma movimentação registrada</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
