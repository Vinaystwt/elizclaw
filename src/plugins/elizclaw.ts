import { Action, Plugin, Provider, Evaluator, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { createTaskAction } from "./actions/createTask.ts";
import { executeTaskAction } from "./actions/executeTask.ts";
import { webScrapeAction } from "./actions/webScrape.ts";
import { apiCallAction } from "./actions/apiCall.ts";
import { monitorPriceAction } from "./actions/monitorPrice.ts";
import { predictionMarketAction } from "./actions/predictionMarket.ts";
import { tasksProvider } from "./providers/tasks.ts";
import { memoryProvider } from "./providers/memory.ts";
import { taskCompletionEvaluator } from "./evaluators/taskCompletion.ts";

export const elizclawPlugin: Plugin = {
  name: "elizclaw",
  description: "Task automation, monitoring, and prediction",
  actions: [
    createTaskAction,
    executeTaskAction,
    webScrapeAction,
    apiCallAction,
    monitorPriceAction,
    predictionMarketAction,
  ],
  providers: [tasksProvider, memoryProvider],
  evaluators: [taskCompletionEvaluator],
  services: [],
};
