/**
 * ElizClaw process manager
 *
 * Local development: starts both the ElizaOS agent (port 3000) and
 * Next.js frontend (port 3001).
 *
 * Production: starts only the agent because the dashboard is served from
 * the same Express app on port 3000.
 *
 * Production resilience rules:
 * - The process manager itself never exits on child failure.
 * - If the agent exits non-zero, wait 5 seconds and restart it.
 * - If it crashes 3 times in 60 seconds, keep the supervisor alive and
 *   continue retrying on the same 5 second cadence.
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const dataDir = process.env.DATA_DIR || "/app/data";
const restartDelayMs = 5000;
const restartWindowMs = 60000;
const restartBurstLimit = 3;

let shuttingDown = false;
let agentProcess = null;
let frontendProcess = null;
let agentRestartTimer = null;
const agentRestartHistory = [];

function baseEnv(extra = {}) {
  return {
    ...process.env,
    DATA_DIR: dataDir,
    ...extra,
  };
}

function pruneRestartHistory(now) {
  while (agentRestartHistory.length && now - agentRestartHistory[0] > restartWindowMs) {
    agentRestartHistory.shift();
  }
}

function scheduleAgentRestart(reason) {
  if (shuttingDown || agentRestartTimer) return;

  const now = Date.now();
  agentRestartHistory.push(now);
  pruneRestartHistory(now);

  if (agentRestartHistory.length >= restartBurstLimit) {
    console.error(
      `[manager] Agent exited ${agentRestartHistory.length} times within ${restartWindowMs / 1000}s. ` +
        `Keeping supervisor alive and retrying again in ${restartDelayMs / 1000}s.`,
    );
  } else {
    console.error(`[manager] Restarting agent in ${restartDelayMs / 1000}s (${reason}).`);
  }

  agentRestartTimer = setTimeout(() => {
    agentRestartTimer = null;
    startAgent();
  }, restartDelayMs);
}

function startAgent() {
  if (shuttingDown || agentProcess) return;

  console.log("[manager] Starting ElizClaw agent...");
  agentProcess = spawn("node", [path.join(__dirname, "dist/index.js")], {
    stdio: "inherit",
    env: baseEnv(),
  });

  agentProcess.on("exit", (code, signal) => {
    const exitReason = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`[manager] Agent exited with ${exitReason}`);
    agentProcess = null;

    if (shuttingDown) return;

    if (!isProduction && frontendProcess && code !== 0) {
      frontendProcess.kill("SIGTERM");
      frontendProcess = null;
    }

    const shouldRestart = signal !== "SIGTERM" && signal !== "SIGINT" && code !== 0;
    if (shouldRestart) {
      scheduleAgentRestart(exitReason);
    }
  });
}

function startFrontend() {
  if (shuttingDown || frontendProcess) return;

  console.log("[manager] Starting frontend server on port 3001...");
  frontendProcess = spawn("node", [path.join(__dirname, "frontend/server.js")], {
    stdio: "inherit",
    env: baseEnv({
      PORT: "3001",
      NODE_ENV: "production",
      AGENT_URL: "http://localhost:3000",
    }),
  });

  frontendProcess.on("exit", (code, signal) => {
    const exitReason = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`[manager] Frontend exited with ${exitReason}`);
    frontendProcess = null;

    if (shuttingDown) return;

    if (code !== 0 && agentProcess) {
      agentProcess.kill("SIGTERM");
      agentProcess = null;
    }
  });
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("\n[manager] Shutting down ElizClaw...");

  if (agentRestartTimer) {
    clearTimeout(agentRestartTimer);
    agentRestartTimer = null;
  }

  if (agentProcess) agentProcess.kill("SIGTERM");
  if (frontendProcess) frontendProcess.kill("SIGTERM");

  setTimeout(() => process.exit(0), 2000);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Run seed script on startup for demo data
try {
  const { execSync } = await import("child_process");
  execSync("node scripts/seed-demo-data.mjs", {
    cwd: "/app",
    stdio: "inherit",
  });
  console.log("Seed data initialized");
} catch (e) {
  console.log("Seed script skipped:", e.message);
}

startAgent();

if (isProduction) {
  console.log("[manager] Production mode — agent serves dashboard on port 3000");
} else {
  setTimeout(() => {
    if (!shuttingDown) startFrontend();
  }, 3000);
}

// Keep the supervisor process alive even if no child currently holds the loop.
setInterval(() => {
  if (isProduction && !agentProcess && !agentRestartTimer && !shuttingDown) {
    scheduleAgentRestart("keepalive check");
  }
}, 10000);
