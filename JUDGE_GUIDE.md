# ElizClaw — Judge's Guide

This file gives you the fastest path to evaluating ElizClaw. Everything you need in 5 minutes.

## Live Demo

[Nosana deployment URL — to be added after deployment]

Screenshot: see README.md Screenshots section

## What Makes This Different

After researching 5,400+ projects via Colosseum Copilot, we identified that the DeFi execution space is saturated (270+ projects doing swapping, trading, portfolio management). ElizClaw focuses on the unsolved gap: **continuous monitoring and on-chain intelligence**. It watches your portfolio, tracks whale wallets, aggregates market signals — and only tells you what matters.

## Fastest Evaluation Path

1. **Start with the dashboard** — create a task via chat: *"Check BTC price every hour"*
2. **Go to Tasks tab** — see the task created with schedule and status indicator
3. **Ask: "How are you performing?"** — agent self-reports execution statistics
4. **Ask: "What's happening in crypto?"** — signal aggregation across CoinGecko + GitHub
5. **Check Activity Feed** — see execution logs with sparkline charts for price data
6. **Check Whale Timeline** — color-coded on-chain activity feed on dashboard

## Key Technical Decisions

See **Architecture Decisions** section in README.md for the full rationale behind every major choice: JSON persistence, setInterval + p-queue scheduling, Next.js static export, Zod validation, pino structured logging.

## Test Commands (if running locally)

```bash
# Run unit tests
bun test

# Build verification
cd frontend && bun run build

# Docker build
docker build -t elizclaw .
```

## Scoring Notes

### Technical Implementation (25%)
- 11 custom actions, 3 providers, 1 evaluator
- Zod validation on all action inputs
- Global error handling with sanitized messages
- pino structured logging (JSON in production)
- p-queue concurrency: 2 on task scheduler
- 9 passing unit tests (http utility + store persistence)
- HTTP utility with exponential backoff retries, 15s timeouts, rate-limit detection
- Write mutex prevents concurrent store corruption

### Nosana Integration (25%)
- Single-port architecture (agent serves dashboard + API on port 3000)
- Docker HEALTHCHECK ready for deployment
- Job definition at `nos_job_def/nosana_eliza_job_definition.json`
- Multi-stage build with `oven/bun:1-slim`

### Usefulness & UX (25%)
- Live task execution status (running/completed/failed with visual indicators)
- SVG sparkline charts for price monitoring history
- Whale Alert Timeline with color-coded directional cards
- Export/Import tasks as JSON
- Quick Commands panel with one-click prompts
- Settings page wired to localStorage
- Skeleton loading states, error states with retry buttons

### Creativity & Originality (15%)
- Research-backed differentiation (avoided 270+ DeFi execution projects)
- Wallet Narrative — algorithmic portfolio analysis with risk profile
- Smart Money Tracker — cross-references holdings with whale activity
- Narrative Alerts — price thresholds include broader market context
- Agent Self-Report — audits its own execution statistics on command

### Documentation (10%)
- Comprehensive README with Mermaid architecture diagram
- Architecture Decisions table explaining every major choice
- This Judge's Guide for quick evaluation
- JSDoc comments on all exports
- Zod schemas documented in `src/plugins/utils/schemas.ts`
- CONTRIBUTING.md for extensibility
