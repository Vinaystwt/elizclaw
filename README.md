# ElizClaw 🦞

> Your personal on-chain intelligence agent.  
> Watches crypto 24/7. Never touches your keys.

**🚀 Live on Nosana:** https://myf3FTbR1Ngah4KXeyu7cypdNRe5KpWisNxjGeZ9KMYE.node.k8s.prd.nos.ci

**Docker:** `vinaystwt/elizclaw:latest`  
**GitHub:** https://github.com/Vinaystwt/elizclaw

---

## What is ElizClaw?

ElizClaw is a personal automation agent built on 
ElizaOS and deployed on Nosana's decentralized GPU 
network. It is not a trading bot. It does not touch 
your funds.

It is a 24/7 intelligence layer for crypto-native 
people who are tired of information overload. 
ElizClaw watches wallets, monitors whale movements, 
tracks market signals, and synthesizes everything 
into clean daily briefs — so you can focus on 
decisions instead of monitoring.

Think of it as hiring a quiet, brilliant analyst 
who works around the clock and puts a clean brief 
on your desk every morning.

---

## Live Demo

Deployed and running on Nosana's decentralized 
GPU infrastructure (NVIDIA RTX 3060):

🔗 **https://myf3FTbR1Ngah4KXeyu7cypdNRe5KpWisNxjGeZ9KMYE.node.k8s.prd.nos.ci**

Try these in the chat:
- `Morning brief` — today's intelligence digest
- `What's happening in crypto?` — market signals
- `Track wallet [address]` — follow any Solana wallet
- `Monitor BTC daily at 8AM` — set autonomous alerts
- `Check my watchlist` — your tracked coins
- `How are you performing?` — agent health report

---

## Features

### 🧠 Intelligence Layer
- **Signal Digest** — daily brief combining market 
  state, whale activity, and task execution history
- **Signal Fusion** — synthesizes price momentum + 
  developer activity + whale data into one OVERALL 
  READ (Bullish / Neutral / Bearish)
- **Alert Rationale** — every alert explains WHY 
  it triggered, not just that it did

### 🐋 On-Chain Monitoring
- **Wallet Tracker** — follows any Solana wallet, 
  shows holdings and smart money overlap
- **Whale Watcher** — monitors known whale wallets 
  (Binance, Wintermute, Jump Trading), detects 
  accumulation vs distribution patterns
- **Portfolio x Whale Overlap** — cross-references 
  your holdings against recent whale activity

### 📊 Market Intelligence
- **Price Monitor** — watches coins, triggers alerts 
  with full market context and rationale
- **Signal Monitor** — aggregates CoinGecko trending, 
  GitHub developer activity, and market momentum
- **Watchlist** — personal coin surveillance board 
  with live prices and change since added

### ⚙️ Autonomous Infrastructure
- **Background Scheduler** — runs tasks every 60s 
  without human prompting
- **Write Mutex** — prevents concurrent data corruption
- **Agent Report Card** — synthetic health score 
  combining success rate, uptime, and activity
- **Export Config** — one-click deployment template

---

## Architecture
┌─────────────────────────────────────────┐
│           ElizClaw Container            │
│                                         │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  ElizaOS    │  │   Express API    │  │
│  │  Agent v2   │  │   + Dashboard    │  │
│  │  Runtime    │  │   Port 3000      │  │
│  └──────┬──────┘  └────────┬─────────┘  │
│         │                  │            │
│  ┌──────▼──────────────────▼─────────┐  │
│  │         13 Custom Actions         │  │
│  │  Price Monitor · Whale Watcher    │  │
│  │  Signal Digest · Wallet Tracker   │  │
│  │  Watchlist · Agent Report · More  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │    Background Task Scheduler    │    │
│   │   60s polling · Write mutex   │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
│ Deployed on
▼
┌─────────────────────┐
│   Nosana GPU Node   │
│  NVIDIA RTX 3060    │
│  Decentralized      │
└─────────────────────┘

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent Framework | ElizaOS v2 |
| Runtime | Bun + TypeScript |
| Frontend | Next.js 14 (static export) |
| Fonts | Plus Jakarta Sans + JetBrains Mono |
| Compute | Nosana GPU Network |
| Container | Docker |
| Data APIs | CoinGecko · Helius · Jupiter |

Compatible with any OpenAI-compatible model endpoint.
Configured via OPENAI_API_URL + OPENAI_MODEL env vars.

---

## Quick Deploy

```bash
docker run -d \
  --name elizclaw \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e OPENAI_API_URL=your_endpoint \
  -e NODE_ENV=production \
  vinaystwt/elizclaw:latest
```

Open http://localhost:3000

---

## Nosana Deployment

Built specifically for Nosana infrastructure:
- Single-port architecture (agent + frontend on 3000)
- No native dependencies (pure JS/TS)
- Health check endpoint at `/health`
- Autonomous restart supervisor
- Job definition at `nos_job_def/`

Deploy steps:
1. Go to deploy.nosana.com
2. Image: `vinaystwt/elizclaw:latest`
3. Expose port: `3000`
4. Set `OPENAI_API_KEY` and `OPENAI_API_URL`

---

## Local Development

```bash
git clone https://github.com/Vinaystwt/elizclaw
cd elizclaw
cp .env.example .env
# Edit .env with your API keys
bun install
bun run build
node scripts/seed-demo-data.mjs
node dist/index.js
```

Open http://localhost:3000

---

## Actions (13 total)

price_monitor · wallet_tracker · whale_watcher · 
signal_monitor · signal_digest · agent_report_card · 
watchlist · web_scrape · api_call · prediction_market · 
price_guess · agent_self_report · agent_report

---

## Built For

**Nosana x ElizaOS Agent Challenge**  
Prize pool: $3,000 USDC | Submitted: April 2026

---
