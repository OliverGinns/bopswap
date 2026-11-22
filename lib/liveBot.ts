import Anthropic from "@anthropic-ai/sdk";
import { BotReply, ChatMessage, WardrobeLite } from "./botTypes";
import { resolveProvider } from "./botMode";
import { parseBotReply } from "./botValidate";
import { Listing, SOURCE_LABEL, distanceInfo, formatPrice } from "./seed";

export const LIVE_MODEL = "claude-haiku-5-5";

function inventoryLine(l: Listing): string {
  const d = distanceInfo(l);
  const where = d
    ? l.sellerType === "charity"
      ? `charity shop (${l.sellerName}), ${d.walkMins} min walk, pick up today`
      : `${l.college ?? "Oxford"}, ${d.walkMins} min walk, handover today`
    : `${SOURCE_LABEL[l.source]}, delivery ${l.delivery ?? "2-4 days"}`;
  return `${l.id} | ${l.title} | ${l.category} | ${l.theme} | size ${l.size} | ${formatPrice(l.swapOrPrice)} | ${l.external ? "EXTERNAL" : "LOCAL"} | ${where} | tags: ${l.tags.join(", ")}`;
}

function wardrobeLine(w: WardrobeLite): string {
  return `${w.name} | ${w.category}${w.colour ? ` | ${w.colour}` : ""}${w.tags.length ? ` | tags: ${w.tags.join(", ")}` : ""}`;
}

export function buildSystemPrompt(inventory: Listing[], wardrobe: WardrobeLite[]): string {
  return `You are BopBot, the outfit planner inside BopSwap, a student clothes swap app in Oxford where local items are handed over in person, the same day (no delivery). The user's default location is St Anne's College.

TONE: friendly, brief, natural. Talk like a helpful friend, not a brand. No cringe, no slang overload, at most one emoji per message. Keep "message" under about 50 words.

CONVERSATION FLOW:
1. The user first names an event: reply with a short "message" (one or two sentences, do NOT list the looks in it) and 3-4 "directions": distinct outfit ideas the app shows as tappable cards. Each direction has an id (short kebab-case), a title (1-3 words), a vibe (one line, under 12 words), one emoji, and 3-5 pieces. Mark pieces the user already owns (see WARDROBE) as "have". Do NOT include "outfit" yet.
2. The user taps a direction (message like "Let's go with Grunge") or refines ("more grunge, under £8"): confirm briefly in "message" and return "outfit": 4-6 pieces for that look, respecting any budget (swap items are free). Only return fresh "directions" if the refinement changes the ideas.
3. Later messages: update "outfit" or answer briefly.

PIECE STATUS:
- "have": the user already owns it (it appears in WARDROBE). No listingId.
- "local": a LOCAL inventory item matches. listingId required.
- "external": only an EXTERNAL inventory item matches. listingId required.
- "missing": nothing in the inventory matches. No listingId.
ALWAYS prefer a LOCAL item over an EXTERNAL one. Use an EXTERNAL item only when no LOCAL item fits. Never use the same listingId twice within one direction or outfit. When you use local items, mention the walking distance of the closest one and that handover can be today. Never invent items or ids: only use ids from the inventory below.

OUTPUT: reply with ONE JSON object and nothing else (no markdown, no code fences):
{"message": string, "directions"?: [{"id": string, "title": string, "vibe": string, "emoji": string, "pieces": [{"piece": string, "status": "have"|"local"|"external"|"missing", "listingId"?: string}]}], "outfit"?: [{"piece": string, "status": "have"|"local"|"external"|"missing", "listingId"?: string}], "followUp"?: string}

WARDROBE (what the user already owns: name | category | colour | tags):
${wardrobe.length ? wardrobe.map(wardrobeLine).join("\n") : "(empty)"}

INVENTORY (id | title | category | theme | size | price | LOCAL/EXTERNAL | where | tags):
${inventory.map(inventoryLine).join("\n")}`;
}

/** Re-encode history so the model always sees its own turns as JSON (keeps it in format). */
function toApiMessages(history: ChatMessage[]): Msg[] {
  return history.map((m) => ({
    role: m.role,
    content:
      m.role === "assistant"
        ? JSON.stringify({ message: m.content, ...(m.directions ? { directions: m.directions } : {}), ...(m.outfit ? { outfit: m.outfit } : {}) })
        : m.content,
  }));
}

type Msg = { role: "user" | "assistant"; content: string };

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_DEFAULT_MODEL = "openai/gpt-oss-120b";

/** A live-bot failure with a short machine reason ("401", "429", "timeout", "invalid-json", "error") and a log-safe detail. */
export class LiveBotError extends Error {
  constructor(public reason: string, public provider: string, public detail: string) {
    super(`${provider} ${reason}: ${detail}`);
  }
}

function isTimeout(err: unknown): boolean {
  const name = err instanceof Error ? err.name : "";
  const msg = err instanceof Error ? err.message : "";
  return name === "TimeoutError" || name === "AbortError" || name === "APIConnectionTimeoutError" || /timed? ?out/i.test(msg);
}

/** Strip anything key-shaped from text before it is logged or returned. */
function scrub(s: string): string {
  return s.replace(/(gsk_|sk-)[A-Za-z0-9_-]+/g, "[key]").replace(/\s+/g, " ").slice(0, 200);
}

async function askAnthropic(system: string, msgs: Msg[], timeoutMs = 25_000): Promise<string> {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: timeoutMs, maxRetries: 0 });
    const res = await client.messages.create({ model: LIVE_MODEL, max_tokens: 2000, system, messages: msgs });
    return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  } catch (err) {
    const status = (err as { status?: number }).status;
    const msg = err instanceof Error ? err.message : String(err);
    throw new LiveBotError(status ? String(status) : isTimeout(err) ? "timeout" : "error", "anthropic", scrub(msg));
  }
}

async function askGroq(system: string, msgs: Msg[], timeoutMs = 25_000): Promise<string> {
  const model = process.env.GROQ_MODEL || GROQ_DEFAULT_MODEL;
  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...msgs],
        max_tokens: 2000,
        response_format: { type: "json_object" },
        ...(model.includes("gpt-oss") ? { reasoning_effort: "low" } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new LiveBotError(isTimeout(err) ? "timeout" : "error", "groq", scrub(err instanceof Error ? err.message : String(err)));
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new LiveBotError(String(res.status), "groq", scrub(`model=${model} ${body}`));
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

/** One raw JSON-contract call on the configured provider (shared by chat and refine). Throws LiveBotError. */
export async function askLive(system: string, msgs: Msg[], timeoutMs = 25_000): Promise<{ text: string; provider: string }> {
  const provider = resolveProvider();
  if (!provider) throw new LiveBotError("no-key", "none", "no live provider configured");
  const text = provider === "groq" ? await askGroq(system, msgs, timeoutMs) : await askAnthropic(system, msgs, timeoutMs);
  return { text, provider };
}

/** Calls the configured provider, validates, retries once if the JSON is invalid. Throws on any failure (caller falls back to scripted). */
export async function liveReply(history: ChatMessage[], inventory: Listing[], wardrobe: WardrobeLite[]): Promise<BotReply> {
  const system = buildSystemPrompt(inventory, wardrobe);
  const messages = toApiMessages(history);
  const provider = resolveProvider();
  if (!provider) throw new LiveBotError("no-key", "none", "no live provider configured");

  const ask = (msgs: Msg[]) => (provider === "groq" ? askGroq(system, msgs) : askAnthropic(system, msgs));

  const first = await ask(messages);
  const parsed = parseBotReply(first, inventory);
  if (parsed) return parsed;

  const second = await ask([
    ...messages,
    { role: "assistant", content: first || "{}" },
    { role: "user", content: "That was not valid. Reply again with ONLY the JSON object described in the instructions." },
  ]);
  const parsed2 = parseBotReply(second, inventory);
  if (parsed2) return parsed2;
  throw new LiveBotError("invalid-json", provider, scrub(`model returned invalid JSON twice; last: ${second}`));
}
