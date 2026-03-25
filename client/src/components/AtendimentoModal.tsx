import { useState } from 'react';
import { X, Headphones, CheckCircle, Loader2, ShieldX, LogIn, Minus, Plus } from 'lucide-react';
import { ClientData } from '@/hooks/useKanbanData';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { getLoginUrl } from '@/const';

interface AtendimentoModalProps {
  client: ClientData;
  onClose: () => void;
}

const TIPOS_ATENDIMENTO = [
  'Whatsapp privado',
  'Whatsapp grupo',
  'Ligação',
  'Meet',
];

const SITUACOES = [
  'Reclamações',
  'Dúvidas',
  'Problemas',
  'Operacional (migração)',
];

const TOPICOS = [
  'Web',
  'SSX Mobile',
  'SSX Onboard',
  'Quick Service',
  'Rastreadores',
  'Tag',
  'Periféricos',
  'Câmera',
  'API',
  'Financeiro',
  'Comercial',
];

const DURACOES = [
  '5 minutos',
  '10 minutos',
  '30 minutos',
  '1 hora',
  '+1 hora',
];

const INITIAL_FORM = {
  tipo: 'Whatsapp grupo',
  situacao: '',
  topico: '',
  resumo: '',
  duracao: '',
};

export default function AtendimentoModal({ client, onClose }: AtendimentoModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [enviado, setEnviado] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);

  const adjustMinutes = (delta: number) => {
    setCustomMinutes(prev => {
      const next = Math.max(5, prev + delta);
      return next;
    });
  };

  // Verifica se a duração selecionada é o valor personalizado atual
  const customLabel = `${customMinutes} minutos`;
  const isCustomSelected = form.duracao === customLabel;

  const { data: permission, isLoading: permLoading } = trpc.atendimento.checkPermission.useQuery();

  const gravar = trpc.atendimento.gravar.useMutation({
    onSuccess: (data) => {
      toast.success(`Atendimento registrado na linha ${data.row} da planilha!`);
      setEnviado(true);
      // Limpa o formulário após 1.5s e volta ao estado inicial
      setTimeout(() => {
        setForm(INITIAL_FORM);
        setEnviado(false);
      }, 1500);
    },
    onError: (err) => {
      toast.error(`Erro ao registrar: ${err.message}`);
    },
  });

  const handleEnviar = () => {
    if (!form.tipo || !form.situacao || !form.topico || !form.duracao) {
      toast.warning('Preencha todos os campos obrigatórios antes de enviar.');
      return;
    }
    gravar.mutate({
      cliente: client.nome,
      tipo: form.tipo,
      situacao: form.situacao,
      razao: form.topico,
      resumo: form.resumo.trim() || 'sem resumo',
      duracao: form.duracao,
    });
  };

  const handleLimpar = () => {
    setForm(INITIAL_FORM);
    setEnviado(false);
  };

  // Tela de carregando permissão
  if (permLoading) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
          <div className="relative w-full max-w-md rounded-xl p-8 shadow-2xl flex flex-col items-center gap-3" style={{ backgroundColor: 'white', border: '2px solid #E5E7EB' }}>
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">Verificando permissão...</p>
          </div>
        </div>
      </>
    );
  }

  // Tela de acesso negado
  if (!permission?.allowed) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
          <div className="relative w-full max-w-md rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4" style={{ backgroundColor: 'white', border: '2px solid #EF4444' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100" style={{ color: '#6B7280' }}>
              <X className="w-4 h-4" />
            </button>
            <ShieldX className="w-12 h-12 text-red-400" />
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Acesso negado</h2>
              <p className="text-sm text-gray-500">
                {!permission ? 'Você precisa estar autenticado para lançar atendimentos.' : 'Seu e-mail não está na lista de usuários autorizados.'}
              </p>
            </div>
            {!permission && (
              <button
                onClick={() => window.location.href = getLoginUrl()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: '#1D4ED8' }}
              >
                <LogIn className="w-4 h-4" />
                Entrar com Google
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="relative w-full max-w-md rounded-xl p-6 shadow-2xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.97)',
            border: '2px solid #1D4ED8',
            backdropFilter: 'blur(8px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#1D4ED8' }}
              >
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: '#001F3F' }}>
                  Registrar Atendimento
                </h2>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  {client.nome}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: '#6B7280' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Formulário */}
          <div className="flex flex-col gap-4">
            {/* Origem do atendimento */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Origem do atendimento <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none transition-all"
                style={{
                  border: '1.5px solid #D1D5DB',
                  color: form.tipo ? '#111827' : '#9CA3AF',
                  backgroundColor: '#FAFAFA',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1D4ED8')}
                onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
              >
                <option value="" disabled>Selecione...</option>
                {TIPOS_ATENDIMENTO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Situação */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Situação <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={form.situacao}
                onChange={(e) => setForm({ ...form, situacao: e.target.value })}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none transition-all"
                style={{
                  border: '1.5px solid #D1D5DB',
                  color: form.situacao ? '#111827' : '#9CA3AF',
                  backgroundColor: '#FAFAFA',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1D4ED8')}
                onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
              >
                <option value="" disabled>Selecione...</option>
                {SITUACOES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Tópico */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Tópico <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={form.topico}
                onChange={(e) => setForm({ ...form, topico: e.target.value })}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none transition-all"
                style={{
                  border: '1.5px solid #D1D5DB',
                  color: form.topico ? '#111827' : '#9CA3AF',
                  backgroundColor: '#FAFAFA',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1D4ED8')}
                onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
              >
                <option value="" disabled>Selecione...</option>
                {TOPICOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Resumo */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Resumo <span style={{ color: '#9CA3AF', fontWeight: 'normal' }}>(opcional)</span>
              </label>
              <textarea
                value={form.resumo}
                onChange={(e) => setForm({ ...form, resumo: e.target.value })}
                placeholder="Descreva o que foi tratado no atendimento..."
                rows={3}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none transition-all resize-none"
                style={{
                  border: '1.5px solid #D1D5DB',
                  backgroundColor: '#FAFAFA',
                  color: '#111827',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1D4ED8')}
                onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
              />
            </div>

            {/* Duração */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Duração <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {DURACOES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setForm({ ...form, duracao: d })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: form.duracao === d ? '#1D4ED8' : '#F3F4F6',
                      color: form.duracao === d ? '#FFFFFF' : '#374151',
                      border: form.duracao === d ? '1.5px solid #1D4ED8' : '1.5px solid #E5E7EB',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Seletor de minutos — sempre visível */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => adjustMinutes(-5)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80 shrink-0"
                  style={{ backgroundColor: '#E5E7EB', color: '#374151' }}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setForm(f => ({ ...f, duracao: customLabel }))}
                  className="flex-1 text-center text-sm font-semibold rounded-lg py-1.5 transition-all"
                  style={{
                    backgroundColor: isCustomSelected ? '#1D4ED8' : '#EFF6FF',
                    color: isCustomSelected ? '#FFFFFF' : '#1D4ED8',
                    border: isCustomSelected ? '1.5px solid #1D4ED8' : '1.5px solid #BFDBFE',
                  }}
                >
                  {customLabel}
                </button>
                <button
                  onClick={() => adjustMinutes(5)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80 shrink-0"
                  style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleLimpar}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-gray-100"
              style={{
                border: '1.5px solid #D1D5DB',
                color: '#6B7280',
                backgroundColor: 'transparent',
              }}
            >
              Limpar
            </button>
            <button
              onClick={handleEnviar}
              disabled={gravar.isPending || enviado}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-70"
              style={{
                backgroundColor: enviado ? '#22C55E' : '#1D4ED8',
                color: '#FFFFFF',
              }}
            >
              {gravar.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : enviado ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Enviado!
                </>
              ) : (
                'Enviar'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
