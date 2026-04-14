FROM oven/bun:1.2.5-slim AS builder
WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY src ./src
COPY tsconfig.json ./
RUN bun run build

WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lockb* ./
RUN bun install
COPY frontend ./
RUN bun run build

FROM oven/bun:1.2.5-slim
WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install
RUN mkdir -p /app/cache && node -e "const { FlagEmbedding, EmbeddingModel } = require('fastembed'); FlagEmbedding.init({ cacheDir: '/app/cache/', model: EmbeddingModel.BGESmallENV15, maxLength: 512, showDownloadProgress: false }).then(() => console.log('Embedding model ready')).catch((e) => console.log('Embedding skip:', e.message));" || true

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/out ./frontend/out
COPY scripts/ ./scripts/
COPY src ./src
COPY start.mjs ./

RUN echo 'Bun.fetch("http://localhost:3000/health").then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))' > /app/healthcheck.js
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV AGENT_URL=http://localhost:3000

HEALTHCHECK --interval=30s --timeout=10s \
  --start-period=60s --retries=3 \
  CMD bun run healthcheck.js || exit 1

EXPOSE 3000
CMD ["bun", "run", "start.mjs"]
