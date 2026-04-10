import { Action, Plugin, Provider, Evaluator, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { createTaskAction } from "./actions/createTask.ts";
import { executeTaskAction } from "./actions/executeTask.ts";
import { webScrapeAction } from "./actions/webScrape.ts";
import { apiCallAction } from "./actions/apiCall.ts";
import { monitorPriceAction } from "./actions/monitorPrice.ts";
import { predictionMarketAction } from "./actions/predictionMarket.ts";
import { walletTrackerAction } from "./actions/walletTracker.ts";
import { whaleWatcherAction } from "./actions/whaleWatcher.ts";
import { signalMonitorAction } from "./actions/signalMonitor.ts";
import { agentReportAction } from "./actions/agentReport.ts";
import { signalDigestAction } from "./actions/signalDigest.ts";
import { watchlistAction } from "./actions/watchlist.ts";
import { tasksProvider } from "./providers/tasks.ts";
import { memoryProvider } from "./providers/memory.ts";
import { taskCompletionEvaluator } from "./evaluators/taskCompletion.ts";

/**
 * ElizClaw — main plugin definition.
 *
 * Provides 12 actions across 3 categories:
 *  - Task Automation: CREATE_TASK, EXECUTE_TASK
 *  - Data & Monitoring: MONITOR_PRICE, WEB_SCRAPE, API_CALL, SIGNAL_MONITOR
 *  - On-Chain Intelligence: WALLET_TRACKER, WHALE_WATCHER, PREDICTION_MARKET
 *
 * Also provides 2 context providers (tasks, memory) and 1 evaluator (task completion).
 */
export const elizclawPlugin: Plugin = {
  name: "elizclaw",
  description: "Task automation, on-chain intelligence, and monitoring",
  actions: [
    createTaskAction,
    executeTaskAction,
    webScrapeAction,
    apiCallAction,
    monitorPriceAction,
    predictionMarketAction,
    walletTrackerAction,
    whaleWatcherAction,
    signalMonitorAction,
    signalDigestAction,
    agentReportAction,
    watchlistAction,
  ],
  providers: [tasksProvider, memoryProvider],
  evaluators: [taskCompletionEvaluator],
  services: [],
};
