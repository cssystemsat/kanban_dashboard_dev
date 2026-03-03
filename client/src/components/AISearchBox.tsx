import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { ClientData } from '@/hooks/useKanbanData';
import { trpc } from '@/lib/trpc';

interface AISearchBoxProps {
  clients: ClientData[];
}

export default function AISearchBox({ clients }: AISearchBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.system.analyzeWithLLM.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Preparar contexto dos dados para o LLM
  const prepareContext = () => {
    const totalClientes = clients.length;
    const clientesPorMarco = {
      1: clients.filter(c => c.marco === 1).length,
      2: clients.filter(c => c.marco === 2).length,
      3: clients.filter(c => c.marco === 3).length,
      4: clients.filter(c => c.marco === 4).length,
      5: clients.filter(c => c.marco === 5).length,
      completos: clients.filter(c => c.isComplete).length,
    };

    const clienteMaisAntigo = clients.reduce((prev, current) => {
      const parseDate = (dateStr: string | undefined) => {
        if (!dateStr) return new Date(0);
        const parts = dateStr.trim().split('/');
        if (parts.length !== 3) return new Date(0);
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      };
      return parseDate(current.entrada) < parseDate(prev.entrada) ? current : prev;
    });

    const clienteMaisNovo = clients.reduce((prev, current) => {
      const parseDate = (dateStr: string | undefined) => {
        if (!dateStr) return new Date(0);
        const parts = dateStr.trim().split('/');
        if (parts.length !== 3) return new Date(0);
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      };
      return parseDate(current.entrada) > parseDate(prev.entrada) ? current : prev;
    });

    const clienteMaisUrs = clients.reduce((prev, current) => {
      const ursA = parseInt(prev.urs || '0', 10);
      const ursB = parseInt(current.urs || '0', 10);
      return ursB > ursA ? current : prev;
    });

    const clienteMaiorDelta = clients.reduce((prev, current) => {
      const deltaA = parseFloat(prev.deltaConsumo || '0');
      const deltaB = parseFloat(current.deltaConsumo || '0');
      return Math.abs(deltaB) > Math.abs(deltaA) ? current : prev;
    });

    return `
Você é um assistente de análise de dados de clientes de rastreamento.

DADOS DISPONÍVEIS:
- Total de Clientes: ${totalClientes}
- Clientes por Marco: Marco 1: ${clientesPorMarco[1]}, Marco 2: ${clientesPorMarco[2]}, Marco 3: ${clientesPorMarco[3]}, Marco 4: ${clientesPorMarco[4]}, Marco 5: ${clientesPorMarco[5]}, 100% Implantados: ${clientesPorMarco.completos}
- Cliente Mais Antigo: ${clienteMaisAntigo.nome} (${clienteMaisAntigo.entrada})
- Cliente Mais Novo: ${clienteMaisNovo.nome} (${clienteMaisNovo.entrada})
- Cliente com Mais URs: ${clienteMaisUrs.nome} (${clienteMaisUrs.urs} URs)
- Cliente com Maior Delta: ${clienteMaiorDelta.nome} (R$ ${clienteMaiorDelta.deltaConsumo})

Responda as perguntas do usuário de forma concisa e amigável, baseado nos dados disponíveis.
    `;
  };

  const handleSendMessage = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await analyzeMutation.mutateAsync({
        systemPrompt: prepareContext(),
        userMessage: userMessage,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Erro ao chamar LLM:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.' 
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-40"
        title="Abrir busca com IA"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold">Assistente de Dados</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-green-700 p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <p className="font-semibold mb-2">Faça perguntas sobre seus clientes!</p>
            <p className="text-xs">Exemplos:</p>
            <ul className="text-xs mt-2 space-y-1">
              <li>• Qual é o cliente mais antigo?</li>
              <li>• Quantos clientes estão em Marco 3?</li>
              <li>• Quem tem mais URs?</li>
              <li>• Qual é o maior delta de consumo?</li>
            </ul>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-green-500 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg rounded-bl-none text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Faça uma pergunta..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !query.trim()}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg p-2 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
