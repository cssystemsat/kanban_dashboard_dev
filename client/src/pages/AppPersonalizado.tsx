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
    <div className="p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">App Personalizado</h1>
        {isAdmin && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
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

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-full lg:w-80 bg-card rounded-lg p-4 border border-border"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            <h2 className="font-semibold mb-4 text-card-foreground">{stage.label}</h2>
            <div className="space-y-3 min-h-96">
              {getCardsByStage(stage.id).map((card) => (
                <div
                  key={card.id}
                  draggable={isAdmin}
                  onDragStart={() => handleDragStart(card)}
                  className={`p-4 bg-background rounded-lg border border-border cursor-move hover:shadow-md transition-shadow ${
                    isAdmin ? 'cursor-grab active:cursor-grabbing' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground truncate">{card.companyName}</h3>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-destructive hover:text-destructive/80 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">CSM: {card.csm}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Data: {formatDate(card.startDate)}
                  </p>
                  <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleShowHistory(card.id)}
                      >
                        <Info className="w-4 h-4" />
                        Info
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Histórico de Movimentações</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedCardHistory.length > 0 ? (
                          selectedCardHistory.map((entry) => (
                            <div key={entry.id} className="p-3 bg-muted rounded-lg text-sm">
                              <p className="font-semibold">
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
                          <p className="text-muted-foreground">Nenhuma movimentação registrada</p>
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
