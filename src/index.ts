/**
 * Production bootstrap entrypoint.
 *
 * Keep local LLaMA/Ollama model paths disabled before the ElizaOS runtime
 * module is loaded so container startup never blocks on unavailable local
 * model services.
 */
process.env.LLAMALOCAL_PATH = "";
process.env.OLLAMA_SERVER_URL = "";
process.env.OLLAMA_MODEL = "";
process.env.USE_OPENAI_EMBEDDING = "true";
process.env.USE_OLLAMA_EMBEDDING = "false";
process.env.OLLAMA_EMBEDDING_MODEL = "";

await import("./runtime.ts");
