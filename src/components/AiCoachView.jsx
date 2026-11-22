import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  User,
  Bot,
  RotateCcw,
  Key,
  Check,
} from 'lucide-react';
import { generateAiAdvice } from '../services/aiCoach';
import { getChatMessages, saveChatMessages } from '../services/storage';
import { analyzeRecentFeedback } from '../services/feedbackAdvisor';

const buildWelcomeMessage = (name) => `Olá ${name || 'Atleta'}! ✨ Sou o teu AI Personal Coach.

Podes fazer-me qualquer pergunta sobre os teus treinos de ginásio, vídeos de casa, substituição de máquinas ou dicas de alimentação.

Se quiseres, podes até fazer mais do que uma pergunta na mesma mensagem! Como te posso ajudar hoje?`;

// Componente para converter texto com formatação markdown simples em JSX elegante
function FormattedMessage({ text }) {
  if (!text) return null;

  // Processar negrito (**texto**), itálico (*texto*) e código (`texto`) inline
  const formatInline = (str) => {
    // Dividir por negrito (**...**)
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-sand-600">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Processar itálico (*...*)
      const italicParts = part.split(/(\*.*?\*)/g);
      return italicParts.map((subPart, j) => {
        if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
          return (
            <em key={`${i}-${j}`} className="italic text-sand-500">
              {subPart.slice(1, -1)}
            </em>
          );
        }
        return subPart;
      });
    });
  };

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Subheaders: ### 1. Título or ## Título
        if (/^#{2,4}\s+/.test(trimmed)) {
          const heading = trimmed.replace(/^#{2,4}\s+/, '');
          return (
            <h4
              key={idx}
              className="font-bold text-sand-600 text-sm pt-2 pb-0.5 border-b border-roseGold-100/60"
            >
              {formatInline(heading)}
            </h4>
          );
        }

        // Bullets: • or - or *
        if (/^[•\-*]\s+/.test(trimmed)) {
          const content = trimmed.replace(/^[•\-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-0.5 my-0.5">
              <span className="text-roseGold-500 font-bold shrink-0 leading-tight">•</span>
              <span className="flex-1">{formatInline(content)}</span>
            </div>
          );
        }

        // Numbered lists: 1. 2. etc
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-0.5 my-0.5">
              <span className="text-roseGold-600 font-bold shrink-0 text-xs leading-tight">
                {numMatch[1]}.
              </span>
              <span className="flex-1">{formatInline(numMatch[2])}</span>
            </div>
          );
        }

        // Regular line
        return (
          <p key={idx} className="leading-relaxed">
            {formatInline(line)}
          </p>
        );
      })}
    </div>
  );
}

export default function AiCoachView({ profile, workouts, history = [] }) {
  const welcomeText = buildWelcomeMessage(profile?.nome);

  const [messages, setMessages] = useState(() => {
    const list = getChatMessages(profile?.nome, profile?.id);
    if (Array.isArray(list) && list.length > 0) {
      if (list[0].id === 'msg-welcome') {
        list[0].text = welcomeText;
      }
      return list;
    }
    return [
      {
        id: "msg-welcome",
        sender: "ai",
        timestamp: new Date().toISOString(),
        text: welcomeText,
      }
    ];
  });

  // Atualizar chat ao mudar de perfil ou nome
  useEffect(() => {
    const list = getChatMessages(profile?.nome, profile?.id);
    const updatedWelcome = buildWelcomeMessage(profile?.nome);
    if (Array.isArray(list) && list.length > 0) {
      if (list[0].id === 'msg-welcome') {
        list[0].text = updatedWelcome;
      }
      setMessages(list);
    } else {
      setMessages([
        {
          id: "msg-welcome",
          sender: "ai",
          timestamp: new Date().toISOString(),
          text: updatedWelcome,
        }
      ]);
    }
  }, [profile?.id, profile?.nome]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [keySaved, setKeySaved] = useState(false);

  const recentFeedback = React.useMemo(() => {
    return analyzeRecentFeedback(history);
  }, [history]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    saveChatMessages(messages, profile?.id);
  }, [messages, isTyping, profile?.id]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const replyText = await generateAiAdvice(text, profile, workouts, messages, history);
      const aiMsg = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'ai',
        timestamp: new Date().toISOString(),
        text: replyText,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'ai',
        timestamp: new Date().toISOString(),
        text: `Desculpa ${profile?.nome || 'Atleta'}, tive uma pequena falha de ligação. Podes repetir a tua pergunta?`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const saveCustomKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowKeyModal(false);
    }, 1200);
  };

  const suggestions = [
    'Como sentir mais os glúteos no Hip Thrust?',
    'Máquina ocupada: como substituir o Leg Press?',
    'Dor no joelho nos afundos: o que fazer?',
    'Quanta proteína e água devo consumir?',
    'O que treinar nos membros superiores?',
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-sand-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-roseGold-400 to-roseGold-500 flex items-center justify-center text-white shadow-md shadow-roseGold-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-sand-500">AI Coach {profile?.nome || 'Rise'}</h2>
            <p className="text-xs text-emerald-600 font-semibold">Online • AI Personal Coach</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (window.confirm('Queres reiniciar a conversa com o AI Coach?')) {
                const fresh = [
                  {
                    id: 'msg-welcome',
                    sender: 'ai',
                    timestamp: new Date().toISOString(),
                    text: DEFAULT_WELCOME,
                  },
                ];
                setMessages(fresh);
                saveChatMessages(fresh);
              }
            }}
            className="p-2 rounded-xl text-sand-400 hover:text-sand-600 hover:bg-cream-200 transition"
            title="Reiniciar conversa"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Feedback Memory Banner */}
      {recentFeedback && (
        <div className="mt-2.5 px-3 py-1.5 rounded-2xl bg-cream-50/90 border border-sand-200 text-[11px] text-sand-500 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-roseGold-500">✨</span>
            <span className="truncate">
              <strong>Contexto ativo:</strong> {recentFeedback.treinoTitulo}
              {recentFeedback.rawFeedback ? ` • "${recentFeedback.rawFeedback}"` : recentFeedback.tags.length > 0 ? ` • ${recentFeedback.tags.join(', ')}` : ''}
            </span>
          </div>
          {recentFeedback.rating && (
            <span className="text-amber-500 font-bold shrink-0 ml-1.5">
              {'★'.repeat(recentFeedback.rating)}
            </span>
          )}
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                  isUser
                    ? 'bg-sand-500 text-white'
                    : 'bg-roseGold-100 text-roseGold-600'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-roseGold-400 text-white rounded-tr-none shadow-sm shadow-roseGold-200 font-medium whitespace-pre-line'
                    : 'bg-white text-sand-500 rounded-tl-none border border-sand-100 shadow-soft'
                }`}
              >
                {isUser ? msg.text : <FormattedMessage text={msg.text} />}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-sand-400 text-sm italic pl-2">
            <Sparkles className="w-4 h-4 text-roseGold-400 animate-spin" />
            O teu coach está a escrever...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      <div className="pt-2 pb-1 overflow-x-auto flex gap-1.5 no-scrollbar">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="whitespace-nowrap px-3.5 py-2 rounded-full bg-cream-50 hover:bg-cream-200 border border-sand-200 text-sand-600 text-xs font-semibold transition active:scale-95 shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-white rounded-2xl p-1.5 border border-sand-200 shadow-soft focus-within:border-roseGold-300 transition"
        >
          <input
            type="text"
            placeholder="Faz uma pergunta sobre exercícios, alimentação, dores..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-transparent text-sm text-sand-500 placeholder-sand-300 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-roseGold-400 hover:bg-roseGold-500 disabled:opacity-40 text-white flex items-center justify-center transition active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

      {/* Optional Gemini API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-600/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-sand-200">
            <h3 className="text-sm font-bold text-sand-500 flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-roseGold-500" />
              Chave Gemini API (Opcional)
            </h3>
            <p className="text-xs text-sand-400 leading-relaxed mb-3">
              A app já inclui a chave da Google configurada. Podes substituir por outra chave própria se desejares.
            </p>
            <input
              type="text"
              placeholder="Cole a sua chave aqui"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs mb-3 font-mono focus:outline-none focus:border-roseGold-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="flex-1 py-2 rounded-xl bg-cream-200 text-sand-500 text-xs font-semibold"
              >
                Fechar
              </button>
              <button
                onClick={saveCustomKey}
                className="flex-1 py-2 rounded-xl bg-roseGold-400 text-white text-xs font-bold shadow-md shadow-roseGold-200 flex items-center justify-center gap-1"
              >
                {keySaved ? <Check className="w-3.5 h-3.5" /> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
