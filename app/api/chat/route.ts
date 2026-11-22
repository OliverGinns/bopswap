import { BotReply, ChatMessage } from "@/lib/botTypes";
import { resolveMode } from "@/lib/botMode";
import { cleanDirections, cleanPieces, sanitizeWardrobe } from "@/lib/botValidate";
import { buildInventory } from "@/lib/inventory";
import { liveReply } from "@/lib/liveBot";
import { scriptedReply } from "@/lib/scriptedBot";
import type { Listing } from "@/lib/seed";

/** Clamp and clean untrusted client history: alternating roles, starts and ends with user. */
function cleanHistory(raw: unknown, inventory: Listing[]): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map(inventory.map((l) => [l.id, l]));
  const out: ChatMessage[] = [];
  for (const m of raw.slice(-20)) {
    if (!m || typeof m !== "object") continue;
    const r = m as Record<string, unknown>;
    const content = typeof r.content === "string" ? r.content.trim().slice(0, 1500) : "";
    if ((r.role !== "user" && r.role !== "assistant") || !content) continue;
    if (out.length === 0 && r.role !== "user") continue;
    if (out.at(-1)?.role === r.role) {
      out[out.length - 1].content += "\n" + content;
      continue;
    }
    const msg: ChatMessage = { role: r.role, content };
    if (r.role === "assistant") {
      const outfit = cleanPieces(r.outfit, byId).slice(0, 10);
      if (outfit.length) msg.outfit = outfit;
      const directions = cleanDirections(r.directions, byId);
      if (directions.length) msg.directions = directions;
    }
    out.push(msg);
  }
  while (out.length && out.at(-1)!.role !== "user") out.pop();
  return out;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const inventory = buildInventory(body.uploads);
  const history = cleanHistory(body.messages, inventory);
  if (!history.length) return Response.json({ error: "No user message" }, { status: 400 });
  const wardrobe = sanitizeWardrobe(body.wardrobe);

  let mode = resolveMode();
  let reply: BotReply;

  try {
    if (mode === "live") {
      try {
        reply = await liveReply(history, inventory, wardrobe);
      } catch (err) {
        // Fail soft: never leave the UI hanging on camera.
        console.warn("[BopBot] live mode failed, falling back to scripted:", err instanceof Error ? err.message : err);
        mode = "scripted";
        reply = scriptedReply(history, inventory, wardrobe);
      }
    } else {
      reply = scriptedReply(history, inventory, wardrobe);
    }
  } catch (err) {
    console.error("[BopBot] scripted bot failed:", err);
    reply = { message: "Sorry, I tripped over my own feet there. Try that once more?" };
  }

  return Response.json(reply, { headers: { "x-bopbot-mode": mode } });
}
