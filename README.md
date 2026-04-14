# ElizClaw 🦞

**Your personal on-chain intelligence agent.**  
Watches crypto 24/7. Never touches your keys.

🚀 **Live on Nosana:** https://myf3FTbR1Ngah4KXeyu7cypdNRe5KpWisNxjGeZ9KMYE.node.k8s.prd.nos.ci  
🐳 **Docker:** `vinaystwt/elizclaw:latest`  
📂 **GitHub:** https://github.com/Vinaystwt/elizclaw

---

## The Problem

If you're into crypto, you know the feeling. You're 
constantly jumping between price charts, whale 
trackers, Twitter, Discord — trying to piece together 
what's actually happening. It's exhausting.

ElizClaw fixes that. It runs 24/7, watches wallets, 
monitors whale movements, tracks market signals, and 
every morning puts a clean brief on your desk. You 
open it and you already know what matters.

Not a trading bot. Not a DeFi execution agent.  
A quiet, brilliant analyst that never sleeps.

---

## Live Demo

🔗 https://myf3FTbR1Ngah4KXeyu7cypdNRe5KpWisNxjGeZ9KMYE.node.k8s.prd.nos.ci

Try these in the chat:

| Command | What it does |
|---------|-------------|
| `Morning brief` | Today's full intelligence digest |
| `What's happening in crypto?` | Live market signal analysis |
| `Track wallet [address]` | Follow any Solana wallet |
| `Monitor BTC daily at 8AM` | Set autonomous price alerts |
| `Check my watchlist` | Your tracked coins with live prices |
| `How are you performing?` | Agent health report card |

---

## Features

**Intelligence Layer**
- Signal Digest — autonomous daily brief: market state, whale activity, task history
- Signal Fusion — one synthesized OVERALL READ (Bullish / Neutral / Bearish)  
- Alert Rationale — every alert explains WHY it triggered, not just that it did

**On-Chain Monitoring**
- Wallet Tracker — follows any Solana address, cross-references against whale activity
- Whale Watcher — monitors known wallets (Binance, Wintermute, Jump Trading)
- Portfolio x Whale Overlap — surfaces when whales move assets you hold

**Market Intelligence**  
- Price Monitor — threshold alerts with full market context
- Signal Monitor — CoinGecko trending + GitHub dev activity + momentum synthesis
- Watchlist — personal surveillance board, live prices, change since added

**Autonomous Infrastructure**
- Background Scheduler — executes tasks every 60s without human prompting
- Write Mutex — prevents concurrent data corruption
- Agent Report Card — synthetic health score: success rate + uptime + activity
- Export Config — one-click deployment template

---

## Architecture
ElizClaw Container (Port 3000)
├── ElizaOS Agent v2 (Runtime)
│   ├── 13 Custom Actions
│   │   ├── price_monitor      whale_watcher
│   │   ├── signal_monitor     signal_digest
│   │   ├── wallet_tracker     agent_report_card
│   │   ├── watchlist          web_scrape
│   │   └── api_call  prediction_market  price_guess
│   ├── 3 Context Providers + 1 Evaluator
│   └── Background Task Scheduler (60s polling)
├── Express API (11 endpoints)
└── Next.js Dashboard (static export)
Deployed on Nosana GPU Network — NVIDIA RTX 3060

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent Framework | ElizaOS v2 |
| Runtime | Bun + TypeScript |
| Frontend | Next.js 14 (static export) |
| Design | Plus Jakarta Sans + JetBrains Mono |
| Compute | Nosana GPU Network (NVIDIA RTX 3060) |
| Container | Docker |
| Data | CoinGecko · Helius · Jupiter APIs |

Works with any OpenAI-compatible endpoint.  
Configure via `OPENAI_API_URL` + `OPENAI_MODEL` env vars.

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

Designed specifically for Nosana infrastructure:

- Single-port architecture — agent + frontend + APIs on port 3000
- No native dependencies — pure TypeScript/JavaScript
- Health check at `/health`
- Autonomous restart supervisor in `start.mjs`
- Job definition at `nos_job_def/`

```bash
# Deploy via Nosana Dashboard
# Image: vinaystwt/elizclaw:latest
# Port:  3000
# Env:   OPENAI_API_KEY, OPENAI_API_URL
```

---

## Local Development

```bash
git clone https://github.com/Vinaystwt/elizclaw
cd elizclaw
cp .env.example .env
# Add your OPENAI_API_KEY and OPENAI_API_URL
bun install
bun run build
node scripts/seed-demo-data.mjs
node dist/index.js
```

Open http://localhost:3000

---

## API Endpoints
GET  /health            Agent status and uptime
GET  /api/digest        Latest daily brief
GET  /api/report        Agent report card data
GET  /api/watchlist     Watched coins with live prices
POST /api/watchlist     Add coin to watchlist
GET  /api/tasks         Scheduled tasks
POST /api/tasks         Create new task
GET  /api/export-config Deployment template
POST /api/chat          Chat with agent
