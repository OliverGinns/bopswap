import { BotReply, Direction, OutfitPiece, PieceStatus, WardrobeLite } from "./botTypes";
import { Listing } from "./seed";

const STATUSES: PieceStatus[] = ["have", "local", "external", "missing"];

/** Pull the first JSON object out of a model reply (tolerates ```json fences / stray prose). */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Clean a list of pieces. Unknown listingIds are dropped; the status is then corrected so the UI never
 * shows a "local swap" with nothing to link to, and a known id always gets the right local/external status.
 */
export function cleanPieces(raw: unknown, byId: Map<string, Listing>): OutfitPiece[] {
  if (!Array.isArray(raw)) return [];
  const out: OutfitPiece[] = [];
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const r = p as Record<string, unknown>;
    if (typeof r.piece !== "string" || !r.piece.trim()) continue;
    const piece = r.piece.trim().slice(0, 60);
    let status: PieceStatus = STATUSES.includes(r.status as PieceStatus) ? (r.status as PieceStatus) : "missing";
    const listing = typeof r.listingId === "string" ? byId.get(r.listingId) : undefined;
    if (listing) {
      if (status !== "have") status = listing.external ? "external" : "local";
      out.push({ piece, status, listingId: listing.id });
    } else {
      if (status === "local" || status === "external") status = "missing";
      out.push({ piece, status });
    }
  }
  return out;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);

/** Clean the "directions" array. Needs a title and 2+ pieces per direction; returns up to 4. */
export function cleanDirections(raw: unknown, byId: Map<string, Listing>): Direction[] {
  if (!Array.isArray(raw)) return [];
  const out: Direction[] = [];
  const seen = new Set<string>();
  for (const d of raw) {
    if (!d || typeof d !== "object") continue;
    const r = d as Record<string, unknown>;
    if (typeof r.title !== "string" || !r.title.trim()) continue;
    const title = r.title.trim().slice(0, 40);
    let id = (typeof r.id === "string" && slug(r.id)) || slug(title) || `d${out.length + 1}`;
    while (seen.has(id)) id += "x";
    const pieces = cleanPieces(r.pieces, byId).slice(0, 6);
    if (pieces.length < 2) continue;
    seen.add(id);
    out.push({
      id,
      title,
      vibe: typeof r.vibe === "string" ? r.vibe.trim().slice(0, 120) : "",
      emoji: typeof r.emoji === "string" && r.emoji.trim() ? r.emoji.trim().slice(0, 8) : "✨",
      pieces,
    });
  }
  return out.slice(0, 4);
}

/** Untrusted wardrobe from the client: text fields only, capped. */
export function sanitizeWardrobe(raw: unknown): WardrobeLite[] {
  if (!Array.isArray(raw)) return [];
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const out: WardrobeLite[] = [];
  for (const w of raw.slice(0, 40)) {
    if (!w || typeof w !== "object") continue;
    const r = w as Record<string, unknown>;
    const name = str(r.name, 60);
    if (!name) continue;
    const tags = Array.isArray(r.tags) ? r.tags.map((t) => str(t, 24)).filter(Boolean).slice(0, 8) : [];
    out.push({ name, category: str(r.category, 20), colour: str(r.colour, 30), tags });
  }
  return out;
}

/** Validate a model reply. Returns null if unusable (caller retries). */
export function parseBotReply(text: string, inventory: Listing[]): BotReply | null {
  const raw = extractJson(text);
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.message !== "string" || !o.message.trim()) return null;

  const byId = new Map(inventory.map((l) => [l.id, l]));
  const reply: BotReply = { message: o.message.trim() };

  if (o.outfit !== undefined) {
    if (!Array.isArray(o.outfit)) return null;
    const outfit = cleanPieces(o.outfit, byId);
    if (outfit.length) reply.outfit = outfit;
  }

  if (o.directions !== undefined) {
    const directions = cleanDirections(o.directions, byId);
    if (directions.length >= 2) reply.directions = directions;
  }

  if (typeof o.followUp === "string" && o.followUp.trim()) reply.followUp = o.followUp.trim();
  return reply;
}

