FROM oven/bun:1-slim AS builder

# Install build deps
RUN apt-get update && apt-get install -y git python3 make g++ && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Install and build agent
COPY package.json bun.lockb* ./
COPY src ./src
RUN bun install && bun run build

# Install and build frontend
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN bun install
COPY frontend/ .
RUN bun run build

# ── Runtime image ──
FROM oven/bun:1-slim

RUN apt-get update && apt-get install -y git python3 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy agent runtime deps and build output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

# Copy frontend build (standalone output)
COPY --from=builder /app/frontend/.next/standalone ./frontend/
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

# Create data directory for shared persistence
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV AGENT_URL=http://localhost:3000

EXPOSE 3000 3001

# Start both agent (port 3000) and frontend (port 3001)
# Using bun's native process spawning for clean multi-process
CMD ["bun", "run", "/app/start.mjs"]
