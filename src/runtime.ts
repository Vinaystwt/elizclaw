import { DirectClient } from "@elizaos/client-direct";
import {
  AgentRuntime,
  elizaLogger,
  settings,
  stringToUuid,
  type Character,
} from "@elizaos/core";
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import express from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { handleError } from "./lib/error-handler.ts";
import { startScheduler } from "./lib/scheduler.ts";
import { initializeDbCache } from "./cache/index.ts";
import { character } from "./character.ts";
import { startChat } from "./chat/index.ts";
import { initializeClients } from "./clients/index.ts";
import {
  getTokenForProvider,
  loadCharacters,
  parseArguments,
} from "./config/index.ts";
import { initializeDatabase } from "./database/index.ts";
import { fetchCoinQuote, coinMap } from "./plugins/actions/watchlist.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let globalRuntime: AgentRuntime | null = null;

export const wait = (minTime: number = 1000, maxTime: number = 3000) => {
  const waitTime =
    Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

async function waitForRuntime(retries: number, delayMs: number) {
  for (let i = 0; i < retries; i += 1) {
    if (globalRuntime) return globalRuntime;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return null;
}

function detectIntent(text: string): string | null {
  const t = text.toLowerCase();

  if (t.match(/price|btc|eth|sol|coin|how much|worth|trading at|market price|what.*(cost|worth)/))
    return "PRICE";

  if (t.match(/whale|big move|large transaction|smart money|institutional|accumulate|dump/))
    return "WHALE";

  if (t.match(/wallet|address|track|holdings|portfolio|follow.*wallet/))
    return "WALLET";

  if (t.match(/brief|digest|morning|summary|overnight|what happened|catch me up|update me|daily/))
    return "DIGEST";

  if (t.match(/market|crypto|signal|trending|happening|bullish|bearish|sentiment|overview/))
    return "SIGNAL";

  if (t.match(/watchlist|watching|my coins|add.*coin|remove.*coin/))
    return "WATCHLIST";

  if (t.match(/health|performing|status|report card|how.*agent|uptime|success rate/))
    return "REPORT";

  return null;
}

export function createAgent(
  character: Character,
  db: any,
  cache: any,
  token: string
) {
  elizaLogger.success(
    "Creating runtime for character",
    character.name,
  );
  return new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: character.modelProvider,
    evaluators: [],
    character,
    plugins: [
      bootstrapPlugin,
    ],
    providers: [],
    actions: [],
    services: [],
    managers: [],
    cacheManager: cache,
  });
}

async function startAgent(character: Character, directClient: DirectClient) {
  try {
    character.id ??= stringToUuid(character.name);
    character.username ??= character.name;

    const token = getTokenForProvider(character.modelProvider, character);
    const dataDir = path.join(__dirname, "../data");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = initializeDatabase(dataDir);

    await db.init();

    const cache = initializeDbCache(character, db);
    const runtime = createAgent(character, db, cache, token);

    await runtime.initialize();

    runtime.clients = await initializeClients(character, runtime);

    directClient.registerAgent(runtime);
    globalRuntime = runtime;

    elizaLogger.debug(`Started ${character.name} as ${runtime.agentId}`);

    return runtime;
  } catch (error) {
    elizaLogger.error(
      `Error starting agent for character ${character.name}:`,
      error,
    );
    console.error(error);
    throw error;
  }
}

/**
 * Helper — resolve the data directory for store.json.
 */
function resolveDataDir(): string {
  return process.env.DATA_DIR || path.join(__dirname, "../data");
}

/**
 * Read the store from disk (used by dashboard API routes).
 */
function readStore(): Record<string, any> {
  const storePath = path.join(resolveDataDir(), "store.json");
  if (!fs.existsSync(storePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(storePath, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Write the Store to disk (used by dashboard API routes).
 */
function writeStore(store: Record<string, any>) {
  const dataDir = resolveDataDir();
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "store.json"), JSON.stringify(store, null, 2));
}

/**
 * Calculate next run time from a schedule string.
 * Mirrors the calcNext function in the frontend tasks API route.
 */
function calcNextRun(schedule: string): Date | null {
  const now = new Date();
  if (schedule.includes("every day") || schedule.includes("daily")) {
    const m = schedule.match(/at\s*(\d{1,2}):(\d{2})/);
    if (m) {
      const n = new Date(now);
      n.setHours(parseInt(m[1]), parseInt(m[2]), 0, 0);
      if (n <= now) n.setDate(n.getDate() + 1);
      return n;
    }
    const n = new Date(now);
    n.setDate(n.getDate() + 1);
    n.setHours(0, 0, 0, 0);
    return n;
  }
  if (schedule.includes("hour")) {
    const m = schedule.match(/(\d+)/);
    return new Date(now.getTime() + (m ? parseInt(m[1]) : 1) * 3600000);
  }
  if (schedule.includes("week")) {
    const n = new Date(now);
    n.setDate(n.getDate() + 7);
    return n;
  }
  return new Date(now.getTime() + 3600000);
}

function buildFallbackReport(store: Record<string, any>) {
  const logs = Array.isArray(store.LOGS) ? store.LOGS : [];
  const tasks = Array.isArray(store.TASKS) ? store.TASKS : [];
  const today = new Date().toISOString().split("T")[0];
  const totalTasks = logs.length;
  const successful = logs.filter((entry: any) => entry.status === "success").length;
  const failed = logs.filter((entry: any) => entry.status === "failed").length;
  const successRate = totalTasks > 0 ? Math.round((successful / totalTasks) * 100) : 0;
  const failureRate = totalTasks > 0 ? Math.round((failed / totalTasks) * 100) : 0;
  const tasksByType = logs.reduce((acc: Record<string, number>, entry: any) => {
    const type = entry.type || entry.task_type || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const mostUsedEntry = Object.entries(tasksByType).sort((a, b) => b[1] - a[1])[0];
  const durations = logs.map((entry: any) => entry.duration_ms).filter((value: any) => typeof value === "number");
  const avgExecutionTime = durations.length
    ? Math.round(durations.reduce((sum: number, value: number) => sum + value, 0) / durations.length)
    : 0;

  return {
    timestamp: new Date().toISOString(),
    totalTasks,
    successRate,
    failureRate,
    mostUsedAction: mostUsedEntry ? mostUsedEntry[0].toUpperCase() : "MONITOR_PRICE",
    tasksByType,
    recentFailures: logs
      .filter((entry: any) => entry.status === "failed")
      .slice(-3)
      .map((entry: any) => ({
        task: tasks.find((task: any) => task.id === entry.task_id)?.name || `Task #${entry.task_id || "unknown"}`,
        error: entry.output || "Unknown failure",
        time: entry.executed_at || new Date().toISOString(),
      })),
    uptime: Math.floor(process.uptime()),
    tasksRunToday: logs.filter((entry: any) => entry.executed_at?.startsWith(today)).length,
    avgExecutionTime,
  };
}

async function refreshWatchlistItems(items: any[]) {
  const refreshed = await Promise.all(items.map(async (item) => {
    const quote = await fetchCoinQuote(item.symbol || item.coin);
    if (!quote) return item;
    return {
      ...item,
      coin: quote.coin,
      symbol: quote.symbol,
      currentPrice: quote.currentPrice,
      change24h: quote.change24h,
    };
  }));

  return refreshed;
}

/**
 * Attach the dashboard static files and API routes to the Express app.
 *
 * This enables the ElizClaw dashboard (Next.js static export) to be served
 * from the same port as the agent API. Required for single-port Nosana deployment.
 *
 * Routes added:
 *   GET  /health          — health check with uptime + active task count
 *   GET  /api/tasks       — list all tasks
 *   POST /api/tasks       — create a task
 *   DELETE /api/tasks     — delete a task
 *   GET  /api/logs        — execution history + stats
 *   POST /api/chat        — proxy chat messages to agent message endpoint
 *   GET  /*               — static files (Next.js export output)
 */
function attachDashboard(app: express.Application, getAgentId: () => string) {
  const isProduction = process.env.NODE_ENV === "production";
  const frontendOutCandidates = isProduction
    ? ["/app/frontend/out", path.join(process.cwd(), "frontend/out")]
    : [path.join(process.cwd(), "frontend/out")];
  const frontendOut = frontendOutCandidates.find((candidate) => fs.existsSync(candidate));

  // ── Rate limiting on chat endpoint (most expensive — hits LLM) ──
  const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests — please try again in a minute." },
  });

  // ── CORS headers for dashboard routes ──
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json());

  // ── Health check ──
  app.get("/health", (_req: express.Request, res: express.Response) => {
    const store = readStore();
    const tasks = store.TASKS || [];
    res.json({
      status: "ok",
      uptime: process.uptime(),
      tasksActive: tasks.filter((t: any) => t.is_active).length,
      version: "1.0.0",
    });
  });

  // ── Task CRUD ──
  app.get("/api/tasks", (_req: express.Request, res: express.Response) => {
    try {
      const store = readStore();
      const tasks = store.TASKS || [];
      res.json({ tasks, activeCount: tasks.filter((t: any) => t.is_active).length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/tasks", (req: express.Request, res: express.Response) => {
    try {
      const { name, type, description, schedule, config, condition } = req.body;
      if (!name || !type || !schedule) {
        return res.status(400).json({ error: "name, type, schedule required" });
      }
      const store = readStore();
      const tasks = store.TASKS || [];
      const nextRun = calcNextRun(schedule);
      const task = {
        id: tasks.length + 1,
        name,
        type,
        description: description || null,
        schedule,
        config: config || null,
        condition: condition || null,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_run: null,
        next_run: nextRun?.toISOString() || null,
      };
      tasks.push(task);
      store.TASKS = tasks;
      writeStore(store);
      res.status(201).json({ task });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/tasks", (req: express.Request, res: express.Response) => {
    try {
      const id = parseInt((req.query.id as string) || "0");
      if (!id) return res.status(400).json({ error: "ID required" });
      const store = readStore();
      store.TASKS = (store.TASKS || []).filter((t: any) => t.id !== id);
      writeStore(store);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/tasks/:id", (req: express.Request, res: express.Response) => {
    try {
      const id = parseInt(req.params.id || "0");
      if (!id) return res.status(400).json({ error: "ID required" });

      const { is_active, schedule, config } = req.body || {};
      const store = readStore();
      const tasks = store.TASKS || [];
      const taskIndex = tasks.findIndex((task: any) => task.id === id);

      if (taskIndex === -1) {
        return res.status(404).json({ error: "Task not found" });
      }

      const currentTask = tasks[taskIndex];
      const updatedTask = {
        ...currentTask,
        ...(typeof is_active !== "undefined" ? { is_active } : {}),
        ...(typeof schedule !== "undefined" ? {
          schedule,
          next_run: calcNextRun(schedule)?.toISOString() || null,
        } : {}),
        ...(typeof config !== "undefined" ? { config } : {}),
        updated_at: new Date().toISOString(),
      };

      tasks[taskIndex] = updatedTask;
      store.TASKS = tasks;
      writeStore(store);
      res.json({ task: updatedTask });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/tasks", (req: express.Request, res: express.Response) => {
    try {
      const id = parseInt(req.body?.id || "0");
      if (!id) return res.status(400).json({ error: "ID required" });

      const { is_active, schedule, config } = req.body || {};
      const store = readStore();
      const tasks = store.TASKS || [];
      const taskIndex = tasks.findIndex((task: any) => task.id === id);

      if (taskIndex === -1) {
        return res.status(404).json({ error: "Task not found" });
      }

      const currentTask = tasks[taskIndex];
      const updatedTask = {
        ...currentTask,
        ...(typeof is_active !== "undefined" ? { is_active } : {}),
        ...(typeof schedule !== "undefined" ? {
          schedule,
          next_run: calcNextRun(schedule)?.toISOString() || null,
        } : {}),
        ...(typeof config !== "undefined" ? { config } : {}),
        updated_at: new Date().toISOString(),
      };

      tasks[taskIndex] = updatedTask;
      store.TASKS = tasks;
      writeStore(store);
      res.json({ task: updatedTask });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/tasks/:id", (req: express.Request, res: express.Response) => {
    try {
      const id = parseInt(req.params.id || "0");
      if (!id) return res.status(400).json({ error: "ID required" });
      const store = readStore();
      store.TASKS = (store.TASKS || []).filter((t: any) => t.id !== id);
      writeStore(store);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Logs + Stats ──
  app.get("/api/logs", (req: express.Request, res: express.Response) => {
    try {
      const store = readStore();
      const logs = store.LOGS || [];
      const tasks = store.TASKS || [];
      const limit = parseInt((req.query.limit as string) || "50");

      const enrichedLogs = logs.slice(-limit).reverse().map((l: any) => {
        const task = tasks.find((t: any) => t.id === l.task_id);
        return { ...l, task_name: task?.name || null, task_type: task?.type || null };
      });

      const today = new Date().toISOString().split("T")[0];
      const todayLogs = logs.filter((l: any) => l.executed_at?.startsWith(today));
      const stats = {
        total: todayLogs.length,
        success: todayLogs.filter((l: any) => l.status === "success").length,
        failed: todayLogs.filter((l: any) => l.status === "failed").length,
        running: todayLogs.filter((l: any) => l.status === "running").length,
      };

      res.json({ logs: enrichedLogs, stats, unreadNotifications: [] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/digest", (_req: express.Request, res: express.Response) => {
    try {
      const digest = (readStore().DAILY_BRIEFS || [])[0] || null;
      res.json({ digest });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/report", (_req: express.Request, res: express.Response) => {
    try {
      const store = readStore();
      const report = (store.AGENT_REPORTS || [])[0] || buildFallbackReport(store);
      res.json({ report });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/watchlist", async (_req: express.Request, res: express.Response) => {
    try {
      const store = readStore();
      const watchlist = store.WATCHLIST || [];
      const refreshed = await refreshWatchlistItems(watchlist);
      store.WATCHLIST = refreshed;
      writeStore(store);
      res.json({ watchlist: refreshed });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/watchlist", async (req: express.Request, res: express.Response) => {
    try {
      const coin = (req.body?.coin || "").toString().trim();
      if (!coin) return res.status(400).json({ error: "coin required" });

      const quote = await fetchCoinQuote(coin);
      if (!quote) return res.status(404).json({ error: "Unsupported coin" });

      const store = readStore();
      const watchlist = store.WATCHLIST || [];
      const existingIndex = watchlist.findIndex((item: any) => item.symbol === quote.symbol);
      const nextItem = {
        coin: quote.coin,
        symbol: quote.symbol,
        addedAt: existingIndex >= 0 ? watchlist[existingIndex].addedAt : new Date().toISOString(),
        currentPrice: quote.currentPrice,
        priceAtAdd: existingIndex >= 0 ? watchlist[existingIndex].priceAtAdd : quote.currentPrice,
        change24h: quote.change24h,
      };

      if (existingIndex >= 0) {
        watchlist[existingIndex] = nextItem;
      } else {
        watchlist.push(nextItem);
      }

      store.WATCHLIST = watchlist;
      writeStore(store);
      res.status(201).json({ item: nextItem });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/watchlist/:coin", (req: express.Request, res: express.Response) => {
    try {
      const coin = (req.params.coin || "").toLowerCase();
      if (!coin) return res.status(400).json({ error: "coin required" });

      const symbols = new Set<string>();
      const direct = coinMap[coin];
      if (direct) symbols.add(direct.symbol);
      symbols.add(coin.toUpperCase());

      const store = readStore();
      store.WATCHLIST = (store.WATCHLIST || []).filter((item: any) => !symbols.has((item.symbol || "").toUpperCase()));
      writeStore(store);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/export-config", (_req: express.Request, res: express.Response) => {
    const now = new Date().toISOString();
    const body = [
      `# ElizClaw — Quick Deploy Config`,
      `# Generated ${now}`,
      ``,
      `# Step 1: Copy this to your .env file`,
      `OPENAI_API_KEY=your_model_api_key_here`,
      `OPENAI_API_URL=your_model_endpoint_here`,
      `NODE_ENV=production`,
      `DATA_DIR=/app/data`,
      `HELIUS_API_KEY=optional_for_enhanced_wallet_data`,
      ``,
      `# Step 2: Run with Docker (one command)`,
      `docker run -d \\`,
      `  --name elizclaw \\`,
      `  -p 3000:3000 \\`,
      `  -e OPENAI_API_KEY=your_key \\`,
      `  -e OPENAI_API_URL=your_endpoint \\`,
      `  -e NODE_ENV=production \\`,
      `  vinaystwt/elizclaw:latest`,
      ``,
      `# Step 3: Open your browser`,
      `# http://localhost:3000`,
    ].join("\n");

    res.type("text/plain").send(body);
  });

  // ── Chat proxy ──
  app.post("/api/chat", express.json(), chatLimiter, async (req: any, res: any) => {
    try {
      const { message: userMessage } = req.body;
      if (!userMessage) return res.status(400).json({ error: "Message required" });

      const intent = detectIntent(userMessage);
      let enhancedMessage = userMessage;

      if (intent === "PRICE") {
        enhancedMessage = `[MONITOR_PRICE] ${userMessage}`;
      }
      if (intent === "WHALE") {
        enhancedMessage = `[WHALE_WATCHER] ${userMessage}`;
      }
      if (intent === "WALLET") {
        enhancedMessage = `[WALLET_TRACKER] ${userMessage}`;
      }
      if (intent === "DIGEST") {
        enhancedMessage = `[SIGNAL_DIGEST] ${userMessage}`;
      }
      if (intent === "SIGNAL") {
        enhancedMessage = `[SIGNAL_MONITOR] ${userMessage}`;
      }
      if (intent === "WATCHLIST") {
        enhancedMessage = `[WATCHLIST] ${userMessage}`;
      }
      if (intent === "REPORT") {
        enhancedMessage = `[AGENT_REPORT] ${userMessage}`;
      }

      const runtime = await waitForRuntime(5, 1000);
      if (!runtime) {
        return res.json({
          response: "The agent is quiet for the moment. Try again shortly.",
          source: "simulated",
        });
      }

      const agentUrl = `http://localhost:${process.env.SERVER_PORT || 3000}`;
      const fetchRes = await fetch(`${agentUrl}/${runtime.agentId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: enhancedMessage, roomId: "web-ui", userId: "web-user" }),
      });

      if (!fetchRes.ok) {
        return res.status(fetchRes.status).json({
          error: `Agent returned ${fetchRes.status}`,
          response: "The agent is processing your request. Please try again.",
        });
      }

      const data = await fetchRes.json();
      const response = Array.isArray(data)
        ? data.map((m: any) => m.text || m.content?.text).filter(Boolean).join("\n\n")
        : data.text || JSON.stringify(data);

      res.json({ response: response || "Task queued successfully.", source: "agent" });
    } catch {
      res.json({
        response: "The agent is currently offline. Please try again shortly.",
        source: "simulated",
      });
    }
  });

  // ── Static files (production only) ──
  if (isProduction) {
    if (frontendOut) {
      app.use(express.static(frontendOut));

      // SPA fallback — serve index.html for non-API, non-file routes
      app.get("*", (_req: express.Request, res: express.Response) => {
        res.sendFile(path.join(frontendOut, "index.html"));
      });
    }
  }
}

const initializeAgentsInBackground = async (
  directClient: DirectClient,
  characters: Character[],
  serverPort: number,
  setActiveAgentId: (agentId: string) => void,
) => {
  const runtimes = [];

  try {
    for (const character of characters) {
      const runtime = await startAgent(character, directClient);
      runtimes.push(runtime);
      if (runtime?.agentId) {
        setActiveAgentId(runtime.agentId);
      }
    }
  } catch (error) {
    elizaLogger.error("Error starting agents:", error);
  }

  const primaryRuntime = runtimes[0];
  if (primaryRuntime?.agentId) {
    startScheduler({ agentId: primaryRuntime.agentId, serverPort });
  }

  const isDaemonProcess = process.env.DAEMON_PROCESS === "true";
  if (!isDaemonProcess) {
    elizaLogger.log("Chat started. Type 'exit' to quit.");
    const chat = startChat(characters);
    chat();
  }
};

const startAgents = async () => {
  const directClient = new DirectClient();
  const app = express();
  let serverPort = parseInt(settings.SERVER_PORT || "3000");
  const args = parseArguments();

  let charactersArg = args.characters || args.character;
  let characters = [character];
  let activeAgentId = characters[0]?.name || "elizclaw";

  if (charactersArg) {
    characters = await loadCharacters(charactersArg);
    activeAgentId = characters[0]?.name || activeAgentId;
  }

  directClient.startAgent = async (character: Character) => {
    return startAgent(character, directClient);
  };

  // ── Attach dashboard static files + API routes for single-port deployment ──
  // This serves the Next.js static export and task/chat/logs APIs on the same
  // Express server that runs the agent. Enables Nosana deployment on a single port.
  attachDashboard(
    app,
    () => activeAgentId,
  );

  // Mount DirectClient routes after dashboard/static handlers so the
  // default REST API welcome route does not override the frontend root URL.
  app.use(directClient.app as express.Application);

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(serverPort, () => {
      elizaLogger.success(
        `Dashboard API bound to 0.0.0.0:${serverPort}. Health endpoint is ready.`,
      );
      resolve();
    });

    server.once("error", (error) => {
      reject(error);
    });
  });

  void initializeAgentsInBackground(
    directClient,
    characters,
    serverPort,
    (agentId) => {
      activeAgentId = agentId;
    },
  );
};

startAgents().catch((error) => {
  elizaLogger.error("Unhandled error in startAgents:", error);
  process.exit(1);
});

// ── Global error handlers ──
process.on("uncaughtException", (err) => {
  const msg = handleError(err);
  elizaLogger.error(`[uncaughtException] ${msg}`);
});

process.on("unhandledRejection", (reason) => {
  const msg = handleError(reason);
  elizaLogger.error(`[unhandledRejection] ${msg}`);
});
