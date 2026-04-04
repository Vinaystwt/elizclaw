# ElizClaw

Personal automation and on-chain intelligence agent. Tell it what to automate in plain English — it handles the rest while you sleep.

## Features

### Task Automation
Describe a recurring task in natural language. It gets parsed, scheduled, and executed automatically.
- **Price monitoring** — track crypto prices with custom alert thresholds
- **Web scraping** — fetch and summarize any website on a schedule
- **API calls** — make HTTP requests to any endpoint on a schedule

### On-Chain Intelligence
- **Wallet tracking** — connect a Solana wallet, monitor portfolio value, alert on changes
- **Whale watching** — track notable wallets and get alerts on large transfers
- **Signal monitoring** — aggregate trending coins, dev activity, and market sentiment

### Games & Prediction
- **Prediction markets** — place simulated bets on price outcomes
- **Price guess game** — daily BTC prediction with scoring

## Quick Start

```bash
bun install
cp .env.example .env
# Edit .env — set OPENAI_API_KEY and OPENAI_API_URL

# Start the agent (port 3000)
bun run dev

# In another terminal, start the frontend (port 3001)
cd frontend && bun install && bun run dev
```

Or with Docker:

```bash
docker compose up --build
```

## Usage Examples

### Create Tasks

Tell ElizClaw what to automate:

```
Check BTC price every morning and alert me if it's above $100k
```

It parses this into a structured task:
- **Type:** Price Monitor
- **Symbol:** BTC
- **Threshold:** $100,000
- **Schedule:** Daily at 8:00 AM
- **Condition:** price > $100,000

### Monitor Prices

```
What's BTC price?
Track SOL price with alert at $200
```

### Track Wallets

```
Check my wallet balance 7xKq...pR3m
Track wallet 9WzD...AWWM
```

### Whale Watching

```
Track the Binance cold wallet
What whales are moving?
```

### Market Signals

```
What's happening in the crypto market?
Show me trending coins
```

### Prediction Markets

```
Place a $10 bet on BTC above $100k by Friday
Start a price guess game
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | Your model API key |
| `OPENAI_API_URL` | `http://localhost:8000/v1` | Model endpoint URL |
| `DATA_DIR` | `./data` | Directory for persistent data (tasks, logs, bets) |
| `HELIUS_API_KEY` | — | Optional — Helius API key for wallet tracking (enhanced features) |

## Architecture

```
┌─────────────────────┐
│  Next.js Frontend   │  Port 3001 — Dashboard, chat, tasks, logs
│  (custom UI)        │  Auto-refreshes stats every 30s
└──────────┬──────────┘
           │ POST /api/chat → DirectClient
┌──────────▼──────────┐
│  ElizClaw Agent     │  Port 3000 — 10 actions, 3 providers, 1 evaluator
│  (ElizaOS runtime)  │  Runs on Qwen3.5-27B via OpenAI-compatible endpoint
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  SQLite (via        │  Tasks, logs, bets, guesses, wallets
│  adapter-sqlite)    │  Stored in data/db.sqlite
└─────────────────────┘
```

## Plugins

### elizclaw (main plugin)

| Type | Name | What it does |
|------|------|-------------|
| Action | CREATE_TASK | Parses natural language → structured scheduled task |
| Action | EXECUTE_TASK | Runs a task by dispatching to type-specific handlers |
| Action | MONITOR_PRICE | Fetches CoinGecko price, compares against threshold |
| Action | WEB_SCRAPE | Fetches URL, strips HTML, returns text summary |
| Action | API_CALL | Makes HTTP requests to any endpoint |
| Action | PREDICTION_MARKET | Places bets on crypto price outcomes with simulated odds |
| Action | WALLET_TRACKER | Tracks Solana wallet portfolio with balance and value |
| Action | WHALE_WATCHER | Monitors notable wallets and alerts on large transfers |
| Action | SIGNAL_MONITOR | Aggregates trending coins, dev activity, market signals |
| Provider | tasks | Surfaces active tasks and schedules to agent context |
| Provider | memory | Surfaces recent execution history to agent context |
| Evaluator | taskCompletion | Auto-logs task outcomes (success/failure) |

### priceGuess (game plugin)

| Type | Name | What it does |
|------|------|-------------|
| Action | PRICE_GUESS_GAME | Starts game round or records a price guess |
| Provider | priceGuess | Surfaces active bets and guesses to agent context |

### Persistence

All persistent data (tasks, logs, bets, guesses, wallets) is stored in `data/store.json` via `src/plugins/store.ts`. The ElizaOS SQLite adapter handles conversation memory separately in `data/db.sqlite`.

## Code Structure

```
elizclaw/
├── src/
│   ├── index.ts              # Agent runtime bootstrap
│   ├── character.ts          # Agent personality and examples
│   ├── config/index.ts       # Argument parsing, token resolution
│   ├── plugins/
│       ├── elizclaw.ts       # Main plugin (10 actions)
│       ├── priceGuess.ts     # Price game plugin
│       ├── store.ts          # JSON file-based persistence
│       ├── actions/          # 10 action handlers
│       │   ├── createTask.ts
│       │   ├── executeTask.ts
│       │   ├── monitorPrice.ts
│       │   ├── webScrape.ts
│       │   ├── apiCall.ts
│       │   ├── predictionMarket.ts
│       │   ├── walletTracker.ts    # NEW: Solana wallet tracking
│       │   ├── whaleWatcher.ts     # NEW: Whale movement alerts
│       │   └── signalMonitor.ts    # NEW: Market signal aggregation
│       ├── providers/        # 3 context providers
│       └── evaluators/       # 1 task completion evaluator
├── frontend/                 # Next.js 14 dashboard
├── Dockerfile
├── docker-compose.yaml
└── start.mjs                 # Process manager for agent + frontend
```

## Docker

```bash
docker compose up --build
```

Agent on port 3000, frontend on 3001. Multi-stage build using `oven/bun:1-slim`.

## Nosana Deployment

1. Register at nosana.com/builders-credits for free compute credits
2. Build Docker image with provided Dockerfile
3. Deploy via deploy.nosana.com

Required environment variables:
```
OPENAI_API_KEY=<your_model_api_key>
OPENAI_API_URL=<your_model_endpoint>
DATA_DIR=/app/data
```

## Tech

| Layer | Technology |
|---|---|
| Framework | ElizaOS 0.1.9 |
| Model | Qwen3.5-27B-AWQ-4bit (OpenAI-compatible endpoint) |
| Runtime | Node.js 23+, Bun |
| Frontend | Next.js 14, TailwindCSS, React 18 |
| Database | SQLite (adapter-sqlite + JSON store) |
| Container | Docker (oven/bun:1-slim) |
| Deploy | Nosana decentralized GPU |

## License

MIT
