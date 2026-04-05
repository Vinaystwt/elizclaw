# Contributing to ElizClaw

ElizClaw is built on ElizaOS v2. The plugin architecture makes it straightforward to extend with new actions, providers, or evaluators.

## Adding a New Action

1. Create `src/plugins/actions/yourAction.ts`
2. Define input validation in `src/plugins/utils/schemas.ts` (optional but recommended)
3. Register the action in `src/plugins/elizclaw.ts`
4. Add JSDoc comments on the file and all exports
5. Write unit tests if the action has non-trivial logic

Example:
```typescript
import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";

export const myAction: Action = {
  name: "MY_ACTION",
  similes: ["MY_ACTION_ALT"],
  description: "What this action does",
  validate: async (_runtime, message) => {
    const text = (message.content as any)?.text || "";
    return /my_trigger/i.test(text);
  },
  handler: async (_runtime, message, _state, _options, callback) => {
    // Do something
    callback({ text: "Result" });
  },
};
```

## Adding a New Provider

1. Create `src/plugins/providers/yourProvider.ts`
2. Return data that gets injected into the agent's context
3. Register in `src/plugins/elizclaw.ts`

## Adding a New Evaluator

1. Create `src/plugins/evaluators/yourEvaluator.ts`
2. Evaluate agent outcomes and log results
3. Register in `src/plugins/elizclaw.ts`

## Development Setup

See README.md for full setup instructions.

```bash
bun install
cp .env.example .env
bun run dev
```

## Code Style

- TypeScript strict mode
- Conventional commits (`feat:` / `fix:` / `docs:` / `refactor:` / `test:`)
- JSDoc on all exports
- Zod validation on all action inputs
- Error handling: use `handleError()` from `src/lib/error-handler.ts`
- Logging: use `logger` from `src/lib/logger.ts`

## Testing

```bash
bun test
```

Tests live alongside source files as `*.test.ts`. Focus on edge cases, input validation, and error paths.
