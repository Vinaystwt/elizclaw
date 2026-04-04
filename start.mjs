/**
 * ElizClaw process manager
 * Starts both the ElizaOS agent (port 3000) and Next.js frontend (port 3001)
 * Handles graceful shutdown on SIGTERM/SIGINT
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Start the ElizaOS agent
const agent = spawn('node', [
  '--loader', 'ts-node/esm',
  path.join(__dirname, 'src/index.ts')
], {
  stdio: 'inherit',
  env: { ...process.env, DATA_DIR: process.env.DATA_DIR || '/app/data' },
});

// Give agent a moment to bind port 3000
setTimeout(() => {
  // Start the Next.js frontend (standalone build)
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
}, 3000);
