'use client';
import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

/**
 * ChatWindow — natural language interface to the agent.
 * Handles message sending, loading states, and connection errors gracefully.
 */

const WELCOME = "Hey 👋 I'm ElizClaw.\n\nTell me what to automate. For example:\n\n• Check BTC price every morning\n• Place a bet on BTC > $100k\n• Start a price guess game\n• Summarize Hacker News daily";

// Simple markdown-like formatter: bold **text** → <strong>, newlines preserved
function formatMessage(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function ChatWindow() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

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
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "⚠️ Can't connect right now. The agent may be offline. Check your connection and try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickCommands = [
    { label: 'Check BTC price', value: 'Check BTC price every morning and alert me if above $100k' },
    { label: "What's happening?", value: "What's happening in the crypto market?" },
    { label: 'Track wallet', value: 'Track wallet ' },
    { label: 'How are you performing?', value: 'How are you performing?' },
  ];

  return (
    <div className="flex flex-col h-[480px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
            {msg.role === 'assistant' ? (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-violet-500/20">
                  <span className="text-xs">🐾</span>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-md px-4 py-3 text-[14px] leading-relaxed text-[#d4d4de] whitespace-pre-wrap">
                  {formatMessage(msg.content)}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl rounded-tr-md px-4 py-3 text-[14px] leading-relaxed text-white max-w-[75%] shadow-lg shadow-violet-500/10">
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start animate-slide-in">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-violet-500/20">
                <span className="text-xs">🐾</span>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-md px-4 py-3.5">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Commands */}
      <div className="flex gap-2 mb-2 flex-wrap">
        {quickCommands.map((cmd) => (
          <button
            key={cmd.label}
            onClick={() => setInput(cmd.value)}
            className="px-3 py-1.5 text-[12px] rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#a1a1b5] hover:bg-white/[0.08] hover:text-[#d4d4de] transition-all duration-200 whitespace-nowrap"
          >
            {cmd.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2.5">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Tell me what to automate..."
          className="input-field flex-1 text-[14px]"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg w-12 h-12 p-0 flex items-center justify-center rounded-xl"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
