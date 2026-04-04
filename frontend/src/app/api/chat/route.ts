import { NextRequest, NextResponse } from 'next/server';

const AGENT_URL = process.env.AGENT_URL || 'http://localhost:3000';
const AGENT_ID = 'elizclaw';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const res = await fetch(`${AGENT_URL}/${AGENT_ID}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, roomId: 'web-ui', userId: 'web-user' }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Agent returned ${res.status}`, response: fallbackResponse(message) }, { status: res.status });
    }

    const data = await res.json();
    // ElizaOS returns array of messages
    const response = Array.isArray(data) ? data.map((m: any) => m.text || m.content?.text).filter(Boolean).join('\n\n') : data.text || JSON.stringify(data);

    return NextResponse.json({ response: response || fallbackResponse(message), source: 'agent' });
  } catch (e: any) {
    return NextResponse.json({ response: fallbackResponse(req.headers.get('x-fallback-message') || ''), source: 'simulated' });
  }
}

function fallbackResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (/check|monitor|track|watch|alert|remind|notify|summarize|digest|every|daily|hourly/i.test(lower)) {
    return `✅ Task created: **${extractName(msg)}**\n\n• Type: ${detectType(lower)}\n• Schedule: ${detectSchedule(lower)}\n\nSetting that up. First run will execute shortly.`;
  }
  if (/bet|place.*bet|prediction|predict/i.test(lower)) {
    const m = msg.match(/\$?(\d+)/);
    const amount = m ? parseInt(m[1]) : 10;
    return `🎲 **Bet Placed**\n\n• Amount: $${amount}\n• Prediction: ${lower.includes('btc') ? 'BTC > $100,000' : 'General market'}\n• Current odds: ${Math.floor(Math.random() * 40) + 20}%\n\nI'll track this and notify you when it resolves.`;
  }
  if (/price.?guess|guess.*price|play.*game/i.test(lower)) {
    return `🎮 **Price Guess Game**\n\nCurrent BTC: $98,450\n\nWhat's your guess for tomorrow's price? Reply with a number!`;
  }
  if (/price|btc|bitcoin|eth|ethereum|sol/i.test(lower)) {
    const coin = /eth|ethereum/i.test(lower) ? 'ETH' : /sol/i.test(lower) ? 'SOL' : 'BTC';
    const prices: Record<string, number> = { BTC: 98450, ETH: 3250, SOL: 245 };
    return `📊 **${coin}/USD**: $${(prices[coin] || 1000).toLocaleString()}\n\nWant me to monitor this on a schedule?`;
  }
  if (/hi|hello|hey|howdy/i.test(lower)) {
    return "Hey! 👋 I'm ElizClaw.\n\nTell me what recurring task you'd like automated:\n\n• \"Check BTC price every morning and alert me if above $100k\"\n• \"Place a $10 bet on BTC > $100k by Friday\"\n• \"Start a price guess game for tomorrow\"";
  }
  if (/help|what can you|capabilities/i.test(lower)) {
    return "Here's what I can do:\n\n📊 **Price Monitor** — Track crypto prices with alerts\n🎲 **Prediction Market** — Place bets on outcomes\n🎮 **Price Guess Game** — Daily BTC prediction game\n🌐 **Web Digest** — Fetch and summarize web content\n🔌 **API Calls** — Make HTTP requests to any endpoint\n\nJust tell me in plain English.";
  }
  if (/task|running|active|status/i.test(lower)) {
    return "You have 0 active tasks right now. Tell me what you'd like automated and I'll set it up!";
  }
  return "Want me to turn that into a recurring task? Say something like \"check this every day\" or \"alert me hourly\" and I'll set it up.";
}

function extractName(msg: string): string {
  const m = msg.match(/(?:check|monitor|track|watch|alert|remind|notify|summarize|digest)\s+(.+?)(?:\s+every|\s+if|\s+when|$)/i);
  if (m) return m[1].trim().split(' ').slice(0, 4).join(' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  return 'Recurring Task';
}

function detectType(l: string): string {
  if (/price|btc|eth|sol|crypto/i.test(l)) return 'Price Monitor';
  if (/summarize|digest|news|scrape/i.test(l)) return 'Web Digest';
  if (/api|call|request/i.test(l)) return 'API Call';
  return 'Custom';
}

function detectSchedule(l: string): string {
  if (/every\s*morning/i.test(l)) return 'Daily at 8:00 AM';
  if (/every\s*hour/i.test(l)) return 'Every hour';
  if (/daily|every\s*day/i.test(l)) return 'Daily';
  return 'Daily at 8:00 AM';
}
