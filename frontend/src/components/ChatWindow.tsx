'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, TrendingUp, Eye, Wallet } from 'lucide-react';

/**
 * ChatWindow — natural language interface to the agent.
 * Redesigned with indigo/gray palette, agent prefix, and prompt chips.
 */

function formatMessage(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

const promptChips = [
  { icon: TrendingUp, iconColor: 'text-amber-400', label: 'Check BTC price every morning', value: 'Check BTC price every morning and alert me if above $100k' },
  { icon: Eye, iconColor: 'text-red-400', label: "What's happening in crypto?", value: "What's happening in the crypto market?" },
  { icon: Wallet, iconColor: 'text-indigo-400', label: 'Track wallet [address]', value: 'Track wallet ' },
];

export function ChatWindow() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Processing...' }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Can't connect right now. The agent may be offline.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[480px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
            {msg.role === 'assistant' ? (
              <div className="flex flex-col gap-1 max-w-[85%]">
                <span className="text-[10px] font-mono text-indigo-400 font-bold ml-1">ELIZCLAW</span>
                <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl rounded-tl-md px-4 py-3 text-[13px] leading-relaxed text-[#E2E8F0] whitespace-pre-wrap">
                  {formatMessage(msg.content)}
                </div>
              </div>
            ) : (
              <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-2xl rounded-tr-md px-4 py-3 text-[13px] leading-relaxed text-slate-200 max-w-[75%]">
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-slide-in">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-indigo-400 font-bold ml-1">ELIZCLAW</span>
              <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl rounded-tl-md px-4 py-3.5">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome state — shows only before first message */}
        {!hasMessages && !loading && (
          <div className="flex flex-col justify-between h-full">
            <div className="flex justify-start animate-slide-in">
              <div className="flex flex-col gap-3 max-w-[90%]">
                <span className="text-[10px] font-mono text-indigo-400 font-bold ml-1">ELIZCLAW</span>
                <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl rounded-tl-md px-5 py-4">
                  <p className="text-[14px] text-[#F1F5F9] font-medium mb-1">Your on-chain sentinel is active and watching.</p>
                  <p className="text-[12px] text-[#94A3B8]">Tell me what to automate in plain English:</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {promptChips.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => setInput(chip.value)}
                      className="flex items-center gap-2 border border-[#1E1E2E] rounded-xl p-3 text-left hover:border-indigo-500/30 transition-all duration-200 cursor-pointer"
                    >
                      <chip.icon className={`w-4 h-4 flex-shrink-0 ${chip.iconColor}`} />
                      <span className="text-[12px] text-[#94A3B8] leading-tight">{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center text-[10px] text-[#1E1E2E] font-mono select-none pointer-events-none py-4">
              Monitoring 24/7 · Powered by Qwen3.5-27B · Deployed on Nosana
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Tell ElizClaw what to automate..."
          className="input-field flex-1 text-[13px]"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
