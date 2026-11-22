import Anthropic from "@anthropic-ai/sdk";
import { resolveMode } from "@/lib/botMode";
import { LIVE_MODEL } from "@/lib/liveBot";
import { CATEGORIES, CONDITIONS, TAG_CHIPS } from "@/lib/userListings";

// AI autofill for /sell. Live mode only (needs ANTHROPIC_API_KEY and BOPBOT_MODE != scripted).
// GET tells the form whether to show the button; POST never throws, it just returns {error}.

// Photo labelling needs a vision model, so it stays Anthropic-only (Groq's default model is text-only).
function autofillAvailable() {
  return resolveMode() === "live" && !!process.env.ANTHROPIC_API_KEY;
}

export async function GET() {
  return Response.json({ available: autofillAvailable() });
}

const MAX_B64 = 1_500_000; // ~1.1 MB of JPEG; the client sends a small preview

export async function POST(req: Request) {
  if (!autofillAvailable()) return Response.json({ error: "AI autofill is only available in live mode" }, { status: 503 });
  let image = "";
  try {
    const body = (await req.json()) as { image?: unknown };
    image = typeof body.image === "string" ? body.image : "";
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if (!m || m[1].length > MAX_B64) return Response.json({ error: "Send a JPEG data URL under ~1 MB" }, { status: 400 });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 20_000, maxRetries: 0 });
    const res = await client.messages.create({
      model: LIVE_MODEL,
      max_tokens: 400,
      system:
        "You label photos of clothing for a student swap app. Reply with ONE JSON object and nothing else (no markdown): " +
        `{"title": string (max 60 chars, plain, no emoji), "category": one of ${JSON.stringify(CATEGORIES)}, ` +
        `"condition": one of ${JSON.stringify(CONDITIONS)}, "theme": "90s" or "fancy-dress", ` +
        `"tags": up to 4 of ${JSON.stringify(TAG_CHIPS)}}. If the photo is not clothing, still return your best guess.`,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: m[1] } },
            { type: "text", text: "Fill in the listing." },
          ],
        },
      ],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Record<string, unknown>;

    const title = typeof json.title === "string" ? json.title.trim().slice(0, 80) : "";
    return Response.json({
      title,
      category: CATEGORIES.find((c) => c === json.category),
      condition: CONDITIONS.find((c) => c === json.condition),
      theme: json.theme === "90s" || json.theme === "fancy-dress" ? json.theme : undefined,
      tags: Array.isArray(json.tags) ? json.tags.filter((t): t is string => typeof t === "string" && TAG_CHIPS.includes(t)).slice(0, 4) : [],
    });
  } catch (err) {
    console.warn("[autofill] failed:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Couldn't read that photo, fill it in by hand." }, { status: 502 });
  }
}
