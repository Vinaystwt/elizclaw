/**
 * ElizClaw process manager
 *
 * Local development: starts both the ElizaOS agent (port 3000) and
 * Next.js frontend (port 3001) via spawn.
 *
 * Production (NODE_ENV=production): only starts the agent.
 * The frontend is served as static files from the same Express server,
 * so no separate frontend process is needed.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PQueue from 'p-queue';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Structured logger for scheduler — JSON in production, readable in dev.
 */
function schedLog(level, msg, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    component: "scheduler",
    msg,
    ...meta,
  };
  if (isProduction || level === 'error') {
    // JSON output in production for Docker log aggregation
    console.log(JSON.stringify(entry));
  } else {
    // Readable in development
    const prefix = { info: 'ℹ', warn: '⚠', error: '✕' }[level] || '·';
    console.log(`${prefix} [scheduler] ${msg}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`);
  }
}

// ── Background Task Scheduler ──
// Polls store.json every 60 seconds for due tasks and executes them.
// This is what makes "schedules and executes autonomously" actually true.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

function readStore() {
  if (!fs.existsSync(STORE_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')); }
  catch { return {}; }
}

function writeStore(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function calcNext(schedule) {
  const now = new Date();
  if (schedule.includes('every day') || schedule.includes('daily')) {
    const m = schedule.match(/at\s*(\d{1,2}):(\d{2})/);
    if (m) { const n = new Date(now); n.setHours(parseInt(m[1]), parseInt(m[2]), 0, 0); if (n <= now) n.setDate(n.getDate() + 1); return n; }
    const n = new Date(now); n.setDate(n.getDate() + 1); n.setHours(0, 0, 0, 0); return n;
  }
  if (schedule.includes('hour')) { const m = schedule.match(/(\d+)/); return new Date(now.getTime() + (m ? parseInt(m[1]) : 1) * 3600000); }
  if (schedule.includes('week')) { const n = new Date(now); n.setDate(n.getDate() + 7); return n; }
  return new Date(now.getTime() + 3600000);
}

function triggerTask(task) {
  const { name, type, config } = task;
  console.log(`\n[scheduler] Executing task #${task.id}: ${name} (${type})`);
  schedLog('info', `Executing task`, { taskId: task.id, name, type });

  // Mark task as running
  const store = readStore();
  const tasks = store.TASKS || [];
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx === -1) return;
  tasks[idx].last_run = new Date().toISOString();
  tasks[idx].updated_at = new Date().toISOString();
  writeStore(store);

  // Build a natural language command from task type + config
  let command = '';
  switch (type) {
    case 'price_monitor':
      command = `Check ${config?.coin || 'BTC'} price and alert if ${config?.threshold || 'above $100k'}`;
      break;
    case 'wallet_tracker':
      command = `Check wallet balance for ${config?.address || 'tracked wallet'}`;
      break;
    case 'whale_watcher':
      command = `Check whale activity for ${config?.address || 'tracked whale'}`;
      break;
    case 'signal_monitor':
      command = `What's happening in the crypto market?`;
      break;
    case 'web_scrape':
      command = `Summarize ${config?.url || 'the webpage'}`;
      break;
    case 'api_call':
      command = `Call API at ${config?.url || 'endpoint'}`;
      break;
    default:
      command = name || `Execute task ${task.id}`;
  }

  // Send the command to the agent via its message endpoint
  const agentUrl = `http://localhost:${process.env.SERVER_PORT || 3000}`;
  const agentId = process.env.AGENT_ID || 'elizclaw';
  fetch(`${agentUrl}/${agentId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: command, roomId: 'scheduler', userId: 'system' }),
  })
    .then(res => res.json())
    .then(data => {
      const output = Array.isArray(data)
        ? data.map(m => m.text || m.content?.text).filter(Boolean).join('\n\n')
        : (data.text || JSON.stringify(data));

      // Log the result
      const logStore = readStore();
      const logs = logStore.LOGS || [];
      logs.push({
        task_id: task.id,
        type,
        status: 'success',
        output: output?.substring(0, 500) || 'Completed',
        executed_at: new Date().toISOString(),
      });
      logStore.LOGS = logs;

      // Update next_run
      const updatedTasks = logStore.TASKS || [];
      const taskIdx = updatedTasks.findIndex(t => t.id === task.id);
      if (taskIdx !== -1) {
        updatedTasks[taskIdx].next_run = calcNext(task.schedule)?.toISOString() || null;
        logStore.TASKS = updatedTasks;
      }
      writeStore(logStore);
      schedLog('info', `Task completed`, { taskId: task.id, name });
    })
    .catch(err => {
      schedLog('error', `Task failed`, { taskId: task.id, name, error: err.message });
      const logStore = readStore();
      const logs = logStore.LOGS || [];
      logs.push({ task_id: task.id, type, status: 'failed', output: err.message, executed_at: new Date().toISOString() });
      logStore.LOGS = logs;
      writeStore(logStore);
    });
}

function runScheduler() {
  setInterval(() => {
    try {
      const store = readStore();
      const tasks = (store.TASKS || []).filter(t => t.is_active && t.next_run);
      const now = new Date();
      const due = tasks.filter(t => new Date(t.next_run) <= now);

      if (due.length > 0) {
        schedLog('info', `Found due tasks`, { count: due.length });
        due.forEach(task => {
          taskQueue.add(() => triggerTask(task));
        });
      }
    } catch (err) {
      schedLog('error', `Error checking tasks`, { error: err.message });
    }
  }, 60_000); // Every 60 seconds
}

// Start the scheduler
const taskQueue = new PQueue({ concurrency: 2 });
runScheduler();
schedLog('info', 'Background task scheduler started — polling every 60s, max 2 concurrent');

// Start the ElizaOS agent
const agent = spawn('node', [
  path.join(__dirname, 'dist/index.js')
], {
  stdio: 'inherit',
  env: { ...process.env, DATA_DIR: process.env.DATA_DIR || '/app/data' },
});

// Give agent a moment to bind port 3000
setTimeout(() => {
  // In production, the agent serves the frontend static files directly.
  // Skip spawning the Next.js frontend process.
  if (isProduction) {
    console.log('Production mode — agent serves dashboard on port 3000');
  } else {
    // Start the Next.js frontend (standalone build) for local development
    const frontend = spawn('node', [
      path.join(__dirname, 'frontend/server.js')
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: '3001',
        NODE_ENV: 'production',
        DATA_DIR: process.env.DATA_DIR || '/app/data',
        AGENT_URL: 'http://localhost:3000',
      },
    });

    // Graceful shutdown — kill both processes together
    const shutdown = () => {
      console.log('\nShutting down ElizClaw...');
      agent.kill('SIGTERM');
      frontend.kill('SIGTERM');
      setTimeout(() => process.exit(0), 2000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // If either process exits unexpectedly, kill the other
    agent.on('exit', (code) => {
      console.log(`Agent exited with code ${code}`);
      if (code !== 0) frontend.kill('SIGTERM');
    });

    frontend.on('exit', (code) => {
      console.log(`Frontend exited with code ${code}`);
      if (code !== 0) agent.kill('SIGTERM');
    });
  }
}, 3000);
