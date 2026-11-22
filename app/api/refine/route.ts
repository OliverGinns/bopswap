import { resolveMode } from "@/lib/botMode";
import { LiveBotError, askLive } from "@/lib/liveBot";
import { buildRefinePrompt, parseRefineReply, sanitizeRefine } from "@/lib/refine";

const TIMEOUT_MS = 12_000;

/** Docked shop chat. Returns {message, filter?, rankedListingIds?, reasons?}, or {fallback:true} so the client uses its rule-based parser. */
export async function POST(req: Request) {
  const fallback = (reason: string) =>
    Response.json({ fallback: true, reason }, { headers: { "x-bopbot-mode": "scripted", "x-bopbot-reason": reason } });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const r = sanitizeRefine(body);
  if (!r) return Response.json({ error: "No message" }, { status: 400 });
  if (resolveMode() !== "live") return fallback("no-key");

  const system = buildRefinePrompt(r);
  try {
    const first = await askLive(system, [{ role: "user", content: r.message }], TIMEOUT_MS);
    const parsed = parseRefineReply(first.text, r);
    if (parsed) return Response.json(parsed, { headers: { "x-bopbot-mode": "live" } });

    const second = await askLive(
      system,
      [
        { role: "user", content: r.message },
        { role: "assistant", content: first.text || "{}" },
        { role: "user", content: "That was not valid. Reply again with ONLY the JSON object described in the instructions." },
      ],
      TIMEOUT_MS
    );
    const parsed2 = parseRefineReply(second.text, r);
    if (parsed2) return Response.json(parsed2, { headers: { "x-bopbot-mode": "live" } });
    console.warn("[BopBot] refine: invalid JSON twice, falling back");
    return fallback("invalid-json");
  } catch (err) {
    const reason = err instanceof LiveBotError ? err.reason : "error";
    console.warn(`[BopBot] refine live failed (${reason}), falling back${err instanceof LiveBotError ? `: ${err.detail}` : ""}`);
    return fallback(reason);
  }
}
