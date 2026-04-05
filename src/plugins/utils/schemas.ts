/**
 * Zod validation schemas for all ElizClaw action inputs.
 * Used to validate user input before processing.
 */
import { z } from "zod";

/**
 * Task creation input — validated before creating a recurring task.
 */
export const CreateTaskInput = z.object({
  type: z.string().min(1, "Task type is required"),
  target: z.string().min(1, "Task target is required"),
  schedule: z.string().min(1, "Schedule is required"),
  threshold: z.number().positive("Threshold must be a positive number").optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Monitor price input — coin is required, threshold and currency optional.
 */
export const MonitorPriceInput = z.object({
  coin: z.string().min(1, "Coin symbol is required"),
  threshold: z.number().positive("Threshold must be a positive number").optional(),
  currency: z.string().default("usd"),
});

/**
 * Wallet tracker input — Solana address validation.
 */
export const WalletTrackerInput = z.object({
  address: z
    .string()
    .min(32, "Invalid Solana address — too short")
    .max(44, "Invalid Solana address — too long")
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana address format"),
});

/**
 * Whale watcher input — address required, label optional.
 */
export const WhaleWatcherInput = z.object({
  address: z.string().min(32, "Invalid wallet address"),
  label: z.string().max(50).optional(),
});

/**
 * Web scrape input — URL must be valid.
 */
export const WebScrapeInput = z.object({
  url: z.string().url("Must be a valid URL"),
});

/**
 * API call input — URL required, method defaults to GET.
 */
export const ApiCallInput = z.object({
  url: z.string().url("Must be a valid URL"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.unknown().optional(),
});

/**
 * Signal monitor — no input required.
 */
export const SignalMonitorInput = z.object({}).strict();

/**
 * Agent report — no input required.
 */
export const AgentReportInput = z.object({}).strict();

/**
 * Prediction market input — amount and coin required.
 */
export const PredictionMarketInput = z.object({
  amount: z.number().positive("Bet amount must be positive"),
  coin: z.string().min(1, "Coin is required"),
  timeframe: z.string().min(1, "Timeframe is required"),
  prediction: z.string().min(1, "Prediction is required"),
});
