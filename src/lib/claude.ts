import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment automatically. Only ever
// imported from server-only modules (extraction.ts, future memo narrative
// generation) — never bundle this into client code.
export const anthropic = new Anthropic();
