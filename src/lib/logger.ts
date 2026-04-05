/**
 * Structured logger for ElizClaw.
 * Uses pino for JSON-formatted logs — ideal for Nosana deployment debugging.
 * In development, logs are pretty-printed via pino-pretty transport.
 * In production, clean JSON lines output for Docker log aggregation.
 */
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
