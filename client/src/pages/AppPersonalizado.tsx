import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, Plus, Trash2 } from 'lucide-react';

const STAGES = [
  { id: 'venda_feita', label: 'Venda feita' },
  { id: 'formulario', label: 'Formulário' },
  { id: 'revisao_dados', label: 'Revisão de Dados' },
  { id: 'desenvolvimento', label: 'Desenvolvimento' },
  { id: 'envio_lojas', label: 'Envio para lojas' },
  { id: 'teste_liberacao', label: 'Teste para liberação' },
  { id: 'app_entregue', label: 'App entregue' },
];

interface KanbanCard {
  id: number;
  companyName: string;
  csm: string;
  startDate: string | Date;
  stage: string;
  order: number;
}

interface HistoryEntry {
  id: number;
  fromStage: string;
  toStage: string;
  movedBy: string;
  movedAt: string | Date;
}

export default function AppPersonalizado() {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCardHistory, setSelectedCardHistory] = useState<HistoryEntry[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', csm: '', startDate: '' });

  const { data: user } = trpc.auth.me.useQuery();
  const listCards = trpc.appKanban.list.useQuery();
  const createCard = trpc.appKanban.create.useMutation();
  const moveCard = trpc.appKanban.move.useMutation();
  const deleteCardMutation = trpc.appKanban.delete.useMutation();
  const getHistory = trpc.appKanban.history.useQuery(
    { cardId: selectedCardHistory.length > 0 ? 0 : -1 },
    { enabled: false }
  );

  useEffect(() => {
    if (listCards.data) {
      setCards(listCards.data as KanbanCard[]);
    }
  }, [listCards.data]);

  const isAdmin = user?.role === 'admin';

  const handleCreateCard = async () => {
    if (!formData.companyName || !formData.csm || !formData.startDate) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      await createCard.mutateAsync({
        companyName: formData.companyName,
        csm: formData.csm,
        startDate: formData.startDate,
      });
      setFormData({ companyName: '', csm: '', startDate: '' });
      setShowCreateDialog(false);
      listCards.refetch();
    } catch (error) {
      console.error('Erro ao criar card:', error);
      alert('Erro ao criar card');
    }
  };

  const handleDragStart = (card: KanbanCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (toStage: string) => {
    if (!draggedCard || !isAdmin) return;

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
      alert('Erro ao mover card');
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
      alert('Erro ao deletar card');
    }
  };

  const handleShowHistory = async (cardId: number) => {
    try {
      const history = await getHistory.refetch();
      setSelectedCardHistory(history.data as HistoryEntry[]);
      setShowHistoryDialog(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const getCardsByStage = (stageId: string) => {
    return cards.filter(card => card.stage === stageId);
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-background min-h-screen" style={{ padding: 'max(1rem, 2vw)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
          App Personalizado
        </h1>
        {isAdmin && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 whitespace-nowrap">
                <Plus className="w-4 h-4" />
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
                <Input
                  placeholder="CSM"
                  value={formData.csm}
                  onChange={(e) => setFormData({ ...formData, csm: e.target.value })}
                />
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

      {/* Kanban Board - Responsivo ao zoom */}
      <div 
        className="overflow-x-auto pb-4 -mx-4 px-4"
        style={{ 
          display: 'flex',
          gap: 'clamp(0.75rem, 1.5vw, 1rem)',
          minHeight: 'calc(100vh - 150px)'
        }}
      >
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 bg-card rounded-lg border border-border flex flex-col"
            style={{
              width: 'clamp(250px, 20vw, 320px)',
              padding: 'clamp(0.75rem, 1.5vw, 1rem)',
              minHeight: 'fit-content'
            }}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            {/* Stage Header */}
            <h2 
              className="font-semibold mb-3 text-card-foreground truncate"
              style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            >
              {stage.label}
            </h2>

            {/* Cards Container */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {getCardsByStage(stage.id).map((card) => (
                <div
                  key={card.id}
                  draggable={isAdmin}
                  onDragStart={() => handleDragStart(card)}
                  className={`p-3 bg-background rounded-lg border border-border transition-all hover:shadow-md ${
                    isAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                  }`}
                  style={{
                    padding: 'clamp(0.5rem, 1vw, 0.75rem)',
                    fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                  }}
                >
                  {/* Card Title */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-semibold text-foreground truncate flex-1">
                      {card.companyName}
                    </h3>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-destructive hover:text-destructive/80 flex-shrink-0"
                        title="Deletar card"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Card Info */}
                  <p className="text-xs text-muted-foreground mb-1 truncate">
                    CSM: {card.csm}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    Data: {formatDate(card.startDate)}
                  </p>

                  {/* Info Button */}
                  <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1 h-7 text-xs"
                        onClick={() => handleShowHistory(card.id)}
                      >
                        <Info className="w-3 h-3" />
                        Info
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[90vw] max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-lg">Histórico de Movimentações</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {selectedCardHistory.length > 0 ? (
                          selectedCardHistory.map((entry) => (
                            <div key={entry.id} className="p-2 bg-muted rounded-lg text-xs">
                              <p className="font-semibold text-sm">
                                {entry.fromStage} → {entry.toStage}
                              </p>
                              <p className="text-muted-foreground">
                                Por: {entry.movedBy}
                              </p>
                              <p className="text-muted-foreground">
                                {formatDate(entry.movedAt)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-xs">Nenhuma movimentação registrada</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
