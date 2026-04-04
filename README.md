# ElizClaw

Automation agent that runs recurring tasks on a schedule. Set it up once in plain English — it handles the rest.

## What it does

- **Task scheduling** — describe a recurring task in natural language, it gets parsed into a scheduled job
- **Price monitoring** — track crypto prices with custom alert thresholds
- **Web scraping** — fetch and summarize web content on a schedule
- **API calls** — make HTTP requests to any endpoint on a schedule
- **Prediction markets** — place bets on price outcomes
- **Price guessing game** — daily BTC prediction with scoring

## Quick start

```bash
bun install
cp .env.example .env
# edit .env with your model endpoint

bun run dev          # agent on port 3000
cd frontend && bun run dev  # dashboard on port 3001
```

Or with Docker:

```bash
docker compose up --build
```

## Structure

```
src/
  character.ts           # agent personality
  config/index.ts        # arg parsing, token resolution
  plugins/
    elizclaw.ts          # main plugin
    priceGuess.ts        # price game plugin
    store.ts             # JSON persistence
    actions/             # task handlers
    providers/           # context providers
    evaluators/          # task completion checks
frontend/                # Next.js dashboard
```

## Config

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | Your model API key |
| `OPENAI_API_URL` | `http://localhost:8000/v1` | Model endpoint |
| `DATA_DIR` | `./data` | Persistent data directory |

## License

MIT
