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

# Build frontend as static export (output: 'export' in next.config.mjs)
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lockb* ./
RUN bun install
COPY frontend/ .
RUN bun run build

# ── Runtime image ──
FROM oven/bun:1-slim

RUN apt-get update && apt-get install -y git python3 curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy agent runtime deps and build output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

# Copy frontend static export
COPY --from=builder /app/frontend/out ./frontend/out

# Create data directory for shared persistence
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV AGENT_URL=http://localhost:3000

EXPOSE 3000

# Single process — agent serves both API and dashboard on port 3000
CMD ["bun", "run", "/app/start.mjs"]
