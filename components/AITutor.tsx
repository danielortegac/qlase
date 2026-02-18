
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { generateTutorResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const AITutor: React.FC<{ context?: string }> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Bienvenido a QLASE Core. ¿En qué puedo asistirte académicamente hoy?' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    const response = await generateTutorResponse(userMsg, context || 'Entorno académico general');
    
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] hover:scale-110 hover:rotate-90 transition-all z-40 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[450px] md:h-[650px] bg-black md:bg-zinc-950 border-0 md:border border-zinc-800 md:rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
            </div>
            <div>
              <h3 className="text-white font-black text-sm tracking-wide">QLASE CORE</h3>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Neural Engine v5.0</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-black to-zinc-950">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white font-bold rounded-tr-none' 
                  : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-3 text-zinc-400 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                Analizando datos académicos...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 pb-safe"> 
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pregunta a QLASE Core..."
              className="w-full bg-zinc-900 text-white rounded-xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-zinc-500 border border-zinc-800 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-600 mt-3">QLASE Core puede cometer errores. Verifica la información importante.</p>
        </div>
      </div>
    </>
  );
};

export default AITutor;
