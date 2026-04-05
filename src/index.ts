import { DirectClient } from "@elizaos/client-direct";
import {
  AgentRuntime,
  elizaLogger,
  settings,
  stringToUuid,
  type Character,
} from "@elizaos/core";
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import { createNodePlugin } from "@elizaos/plugin-node";
import express from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { handleError } from "./lib/error-handler.ts";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const wait = (minTime: number = 1000, maxTime: number = 3000) => {
  const waitTime =
    Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

let nodePlugin: any | undefined;

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

  nodePlugin ??= createNodePlugin();

  return new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: character.modelProvider,
    evaluators: [],
    character,
    plugins: [
      bootstrapPlugin,
      nodePlugin,
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
function attachDashboard(app: express.Application) {
  const isProduction = process.env.NODE_ENV === "production";
  const agentId = character.id || stringToUuid(character.name);

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
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

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

  // ── Chat proxy ──
  app.post("/api/chat", express.json(), chatLimiter, async (req: any, res: any) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "Message required" });

      const agentUrl = `http://localhost:${process.env.SERVER_PORT || 3000}`;
      const fetchRes = await fetch(`${agentUrl}/${agentId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, roomId: "web-ui", userId: "web-user" }),
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
    const frontendOut = path.join(__dirname, "../frontend/out");
    if (fs.existsSync(frontendOut)) {
      app.use(express.static(frontendOut));

      // SPA fallback — serve index.html for non-API, non-file routes
      app.get("*", (_req: express.Request, res: express.Response) => {
        res.sendFile(path.join(frontendOut, "index.html"));
      });
    }
  }
}

const checkPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
};

const startAgents = async () => {
  const directClient = new DirectClient();
  let serverPort = parseInt(settings.SERVER_PORT || "3000");
  const args = parseArguments();

  let charactersArg = args.characters || args.character;
  let characters = [character];

  if (charactersArg) {
    characters = await loadCharacters(charactersArg);
  }

  try {
    for (const character of characters) {
      await startAgent(character, directClient as DirectClient);
    }
  } catch (error) {
    elizaLogger.error("Error starting agents:", error);
  }

  while (!(await checkPortAvailable(serverPort))) {
    elizaLogger.warn(`Port ${serverPort} is in use, trying ${serverPort + 1}`);
    serverPort++;
  }

  directClient.startAgent = async (character: Character) => {
    return startAgent(character, directClient);
  };

  directClient.start(serverPort);

  if (serverPort !== parseInt(settings.SERVER_PORT || "3000")) {
    elizaLogger.log(`Server started on alternate port ${serverPort}`);
  }

  // ── Attach dashboard static files + API routes for single-port deployment ──
  // This serves the Next.js static export and task/chat/logs APIs on the same
  // Express server that runs the agent. Enables Nosana deployment on a single port.
  attachDashboard(directClient.app as express.Application);

  const isDaemonProcess = process.env.DAEMON_PROCESS === "true";
  if(!isDaemonProcess) {
    elizaLogger.log("Chat started. Type 'exit' to quit.");
    const chat = startChat(characters);
    chat();
  }
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
