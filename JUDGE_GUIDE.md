# ElizClaw — Judge Guide

## TL;DR
Live URL: https://myf3FTbR1Ngah4KXeyu7cypdNRe5KpWisNxjGeZ9KMYE.node.k8s.prd.nos.ci
Docker: vinaystwt/elizclaw:latest
GitHub: https://github.com/Vinaystwt/elizclaw

---

## Fastest Way to See It Working (2 minutes)

1. Open the live URL above
2. Type: "Morning brief"
3. Type: "What's happening in crypto?"
4. Click Watchlist in the sidebar
5. Click Report in the sidebar

---

## What ElizClaw Does

Personal on-chain intelligence agent. Not a trading 
bot — a 24/7 autonomous analyst that watches wallets, 
monitors whale movements, tracks market signals, and 
delivers daily briefs. Never touches user funds.

---

## Judging Criteria Checklist

### Technical Implementation (25pts)
- 13 custom ElizaOS actions with real API integrations
- Background scheduler with 60s autonomous polling
- Write mutex preventing concurrent data corruption
- Zod validation, Pino logging, global error handler
- CORS + rate limiting on all API routes
- 10/10 unit tests passing
- Single-port production architecture

### Nosana Integration (25pts)
- Live deployment: NVIDIA RTX 3060 on Nosana
- Docker image: vinaystwt/elizclaw:latest
- Health check: /health endpoint
- Job definition: nos_job_def/
- Autonomous restart supervisor in start.mjs
- Compatible with Nosana-provided model endpoints
  via OPENAI_API_URL + OPENAI_MODEL env vars

### Usefulness & UX (25pts)
- Dashboard: Signal Digest, Agent Health, 
  Live Activity, Whale Timeline
- Chat: structured intelligence responses with 
  work states (thinking/fetching/cross-referencing)
- Watchlist: live prices, semantic color coding
- Report: synthetic health score + metrics grid
- Tasks: autonomous scheduling in plain English
- Settings: one-click Export Config download

### Creativity & Originality (15pts)
- Monitoring-first positioning (not DeFi execution)
- Alert Rationale: explains WHY alerts triggered
- Portfolio x Whale Overlap analysis
- Agent Report Card with self-assessment
- Signal Fusion: synthesizes to one OVERALL READ

### Documentation (10pts)
- Comprehensive README with architecture diagram
- This JUDGE_GUIDE.md
- CONTRIBUTING.md
- Inline code comments
- Export Config deployment template

---

## Key Commands to Test
Morning brief
What's happening in crypto?
Track wallet 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
Monitor BTC daily at 8AM, alert if above $95,000
Check my watchlist
How are you performing?
Any whale activity?

---

## API Endpoints

GET  /health          — agent status
GET  /api/digest      — latest daily brief
GET  /api/report      — agent report card data
GET  /api/watchlist   — watched coins + prices
GET  /api/tasks       — scheduled tasks
GET  /api/export-config — deployment template

---

## Local Setup (if needed)

```bash
git clone https://github.com/Vinaystwt/elizclaw
cd elizclaw
bun install && bun run build
node scripts/seed-demo-data.mjs
OPENAI_API_KEY=key OPENAI_API_URL=endpoint \
NODE_ENV=production node dist/index.js
```

Open http://localhost:3000

---
