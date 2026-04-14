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
if (!process.env.USE_OPENAI_EMBEDDING) {
  process.env.USE_OPENAI_EMBEDDING = "false";
}
if (!process.env.USE_OLLAMA_EMBEDDING) {
  process.env.USE_OLLAMA_EMBEDDING = "false";
}
if (!process.env.USE_LOCAL_EMBEDDING) {
  process.env.USE_LOCAL_EMBEDDING = "true";
}
process.env.OLLAMA_EMBEDDING_MODEL = "";
process.env.SMALL_OPENAI_MODEL = process.env.OPENAI_MODEL || "llama-3.1-8b-instant";
process.env.MEDIUM_OPENAI_MODEL = process.env.OPENAI_MODEL || "llama-3.1-8b-instant";
process.env.LARGE_OPENAI_MODEL = process.env.OPENAI_MODEL || "llama-3.1-8b-instant";

await import("./runtime.ts");
