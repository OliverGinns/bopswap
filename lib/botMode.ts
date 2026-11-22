import type { BotMode } from "./botTypes";

// BOPBOT_MODE=live|scripted|auto (default auto = live when ANTHROPIC_API_KEY is set). Server-side only.
export function resolveMode(): BotMode {
  const want = (process.env.BOPBOT_MODE ?? "auto").toLowerCase();
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  if (want === "scripted") return "scripted";
  return hasKey ? "live" : "scripted";
}
