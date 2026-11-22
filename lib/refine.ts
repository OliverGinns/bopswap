// BopBot "refine" (docked shop chat): prompt + JSON validator. Same provider and JSON-only contract as /api/chat.

import type { WardrobeLite } from "./botTypes";

export type RefineSeller = "student" | "charity" | "online";
export type RefineSort = "best" | "cheapest" | "closest";

export interface RefineFilter {
  maxPrice?: number;
  sellerType?: RefineSeller;
  swapOnly?: boolean;
  sortBy?: RefineSort;
}

export interface RefineListing {
  id: string;
  title: string;
  price: string;
  distance: string;
  source: string;
}

export interface RefineRequest {
  message: string;
  look: { title: string; vibe: string; pieces: string[] } | null;
  activeSlot: string;
  listings: RefineListing[];
  currentFilter: RefineFilter;
  wardrobe: WardrobeLite[];
}

export interface RefineReply {
  message: string;
  filter?: RefineFilter;
  rankedListingIds?: string[];
  reasons?: Record<string, string>;
}

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

function cleanFilter(raw: unknown): RefineFilter | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const f: RefineFilter = {};
  if (typeof o.maxPrice === "number" && Number.isFinite(o.maxPrice) && o.maxPrice >= 0) f.maxPrice = Math.min(o.maxPrice, 500);
  if (o.sellerType === "student" || o.sellerType === "charity" || o.sellerType === "online") f.sellerType = o.sellerType;
  if (o.swapOnly === true) f.swapOnly = true;
  if (o.sortBy === "best" || o.sortBy === "cheapest" || o.sortBy === "closest") f.sortBy = o.sortBy;
  return f;
}

/** Untrusted client payload -> clean request, or null if unusable. */
export function sanitizeRefine(raw: unknown): RefineRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const message = str(o.message, 500);
  if (!message) return null;

  const listings: RefineListing[] = [];
  if (Array.isArray(o.listings)) {
    for (const r of o.listings.slice(0, 60)) {
      if (!r || typeof r !== "object") continue;
      const x = r as Record<string, unknown>;
      const id = str(x.id, 40);
      if (id) listings.push({ id, title: str(x.title, 80), price: str(x.price, 20), distance: str(x.distance, 40), source: str(x.source, 30) });
    }
  }

  let look: RefineRequest["look"] = null;
  if (o.look && typeof o.look === "object") {
    const l = o.look as Record<string, unknown>;
    const title = str(l.title, 40);
    if (title) {
      look = {
        title,
        vibe: str(l.vibe, 120),
        pieces: Array.isArray(l.pieces) ? l.pieces.map((p) => str(p, 60)).filter(Boolean).slice(0, 8) : [],
      };
    }
  }

  const wardrobe: WardrobeLite[] = [];
  if (Array.isArray(o.wardrobe)) {
    for (const w of o.wardrobe.slice(0, 40)) {
      if (!w || typeof w !== "object") continue;
      const r = w as Record<string, unknown>;
      const name = str(r.name, 60);
      if (!name) continue;
      wardrobe.push({
        name,
        category: str(r.category, 20),
        colour: str(r.colour, 30),
        tags: Array.isArray(r.tags) ? r.tags.map((t) => str(t, 24)).filter(Boolean).slice(0, 8) : [],
      });
    }
  }
  return { message, look, activeSlot: str(o.activeSlot, 60), listings, currentFilter: cleanFilter(o.currentFilter) ?? {}, wardrobe };
}

function extractJson(text: string): unknown {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  try {
    return JSON.parse(text.slice(a, b + 1));
  } catch {
    return null;
  }
}

/** Validate a model reply against the listings that were actually shown. Null = unusable (caller retries / falls back). */
export function parseRefineReply(text: string, req: RefineRequest): RefineReply | null {
  const raw = extractJson(text);
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const message = str(o.message, 400);
  if (!message) return null;
  const reply: RefineReply = { message };

  if (o.filter !== undefined) {
    const filter = cleanFilter(o.filter);
    if (filter) reply.filter = filter;
  }

  const known = new Set(req.listings.map((l) => l.id));
  if (Array.isArray(o.rankedListingIds)) {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const id of o.rankedListingIds) {
      if (typeof id === "string" && known.has(id) && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
    if (ids.length) reply.rankedListingIds = ids;
  }

  if (o.reasons && typeof o.reasons === "object" && !Array.isArray(o.reasons)) {
    const mentions90 = /90/.test(`${req.look?.title ?? ""} ${req.look?.vibe ?? ""}`);
    const reasons: Record<string, string> = {};
    for (const [id, v] of Object.entries(o.reasons as Record<string, unknown>)) {
      const r = str(v, 90);
      if (!known.has(id) || !r) continue;
      if (/\b90'?s\b|nineties/i.test(r) && !mentions90) continue; // never mention the 90s unless that look is chosen
      reasons[id] = r;
    }
    if (Object.keys(reasons).length) reply.reasons = reasons;
  }
  return reply;
}

export function buildRefinePrompt(req: RefineRequest): string {
  const look = req.look ? `${req.look.title}${req.look.vibe ? ` (${req.look.vibe})` : ""}; pieces: ${req.look.pieces.join(", ")}` : "(no named look)";
  return `You are BopBot, the outfit helper inside BopSwap, a student clothes swap app in Oxford. Local items are handed over in person the same day. The user is already shopping for a chosen look and is tuning the feed for one outfit piece.

TONE: friendly, brief, natural. At most one emoji. "message" under about 40 words. Answer the user's question directly (e.g. if they ask for alternatives to an item, name the listed items that are good alternatives).

CHOSEN LOOK: ${look}
ACTIVE PIECE: ${req.activeSlot || "(unknown)"}
CURRENT FILTER: ${JSON.stringify(req.currentFilter)}

WARDROBE (already owned):
${req.wardrobe.length ? req.wardrobe.map((w) => `${w.name} | ${w.category}${w.colour ? ` | ${w.colour}` : ""}`).join("\n") : "(empty)"}

VISIBLE LISTINGS (id | title | price | distance | source):
${req.listings.map((l) => `${l.id} | ${l.title} | ${l.price} | ${l.distance} | ${l.source}`).join("\n") || "(none)"}

OUTPUT: reply with ONE JSON object and nothing else (no markdown, no code fences):
{"message": string, "filter"?: {"maxPrice"?: number, "sellerType"?: "student"|"charity"|"online", "swapOnly"?: boolean, "sortBy"?: "best"|"cheapest"|"closest"}, "rankedListingIds"?: string[], "reasons"?: {"<listingId>": string}}

RULES:
- "filter" is the COMPLETE desired filter state: include it only when the user wants the filters changed (leave out fields that should be off; send {} to clear everything). Omit "filter" to keep the current one.
- "rankedListingIds": best-first order using ONLY ids from VISIBLE LISTINGS, with the best answers to the user's request first.
- "reasons": one short line (under 80 characters) per top listing saying why it suits the chosen look, e.g. "Fits your ${req.look?.title ?? "chosen"} look, 9 min walk". Mention the look by name. Never mention the 90s unless the chosen look is a 90s look. Only use facts shown above.
- Never invent listings or ids.`;
}
