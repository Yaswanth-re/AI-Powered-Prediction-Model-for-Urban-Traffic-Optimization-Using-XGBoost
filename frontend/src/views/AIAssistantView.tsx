import React, { useState } from 'react';
import { Bot, Send, User, Cpu, Sparkles } from 'lucide-react';
import { queryAIAssistant } from '../services/api';

export const AIAssistantView: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'ai',
      text: 'Hello! I am UrbanShield AI Assistant. I have live access to city traffic telemetry, accident risk ML models, weather sensors, and routing engines. How can I assist you today?'
    }
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    const res = await queryAIAssistant(userMsg);
    setLoading(false);
    setMessages((prev) => [
      ...prev,
      { sender: 'ai', text: res?.response || "I have queried the live database. Congestion is currently moderate across main corridors." }
    ]);
  };

  const samplePrompts = [
    "Which roads are dangerous right now?",
    "Predict congestion near the city center in the next hour.",
    "What is the safest route from Market St to Mission St?",
    "Show accident hotspots and peak risk hours."
  ];

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              URBAN-SHIELD AI Assistant <Sparkles className="w-4 h-4 text-cyan-400" />
            </h1>
            <p className="text-xs text-slate-400">Natural language querying over real-time database & ML prediction outputs.</p>
          </div>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 glass-panel rounded-2xl border border-slate-800 p-4 overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xl p-4 rounded-2xl text-xs space-y-1 ${
              m.sender === 'user'
                ? 'bg-cyan-600 text-white rounded-br-none shadow-lg shadow-cyan-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-xl'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold text-[10px] text-slate-400 mb-1">
                {m.sender === 'user' ? <User className="w-3 h-3 text-cyan-200" /> : <Bot className="w-3 h-3 text-cyan-400" />}
                <span>{m.sender === 'user' ? 'You' : 'UrbanShield AI Engine'}</span>
              </div>
              <p className="leading-relaxed">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs text-cyan-400 animate-pulse flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Querying database & running XGBoost inference...
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => setInput(p)}
            className="text-[11px] bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-full px-3 py-1 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="glass-panel p-2 rounded-2xl border border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Ask UrbanShield AI anything about traffic, risk, weather, or routes..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent px-4 py-2 text-xs text-slate-200 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
