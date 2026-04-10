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
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

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
