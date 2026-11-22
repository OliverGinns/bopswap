import type { BotMode } from "./botTypes";

export type BotProvider = "anthropic" | "groq";

// BOPBOT_PROVIDER=anthropic|groq. Default: groq if GROQ_API_KEY is set, else anthropic if ANTHROPIC_API_KEY is set.
// A forced provider without its key resolves to null (scripted). Server-side only.
export function resolveProvider(): BotProvider | null {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const want = (process.env.BOPBOT_PROVIDER ?? "").toLowerCase();
  if (want === "anthropic") return hasAnthropic ? "anthropic" : null;
  if (want === "groq") return hasGroq ? "groq" : null;
  if (hasGroq) return "groq";
  return hasAnthropic ? "anthropic" : null;
}

// BOPBOT_MODE=live|scripted|auto (default auto = live when a provider key is set). Server-side only.
export function resolveMode(): BotMode {
  const want = (process.env.BOPBOT_MODE ?? "auto").toLowerCase();
  if (want === "scripted") return "scripted";
  return resolveProvider() ? "live" : "scripted";
}
