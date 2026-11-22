// Client-side helpers for the /plan page: find candidate listings per outfit piece, explain them,
// filter/rank them, and turn short chat refinements ("cheaper", "closer") into filter changes.
// Pure functions, no network: the feed never depends on the bot being up.

import { PIECE_HINTS, parseBudget } from "./directions";
import type { OutfitPiece } from "./botTypes";
import type { Category, Listing, Theme } from "./seed";
import { distanceInfo, formatPrice } from "./seed";
import type { WardrobeItem } from "./wardrobe";

// ---------- tokens ----------

const STOP = new Set(["and", "or", "with", "the", "for", "set", "pack", "bundle", "some", "your", "own", "any", "one"]);
const stem = (t: string) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t);
export const tokenize = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length > 2 && !STOP.has(t))
    .map(stem);

// ---------- candidates ----------

export interface Candidate {
  listing: Listing;
  score: number;
  /** The bot's own pick for this piece. */
  pinned: boolean;
}

/** A real keyword hit in the title or tags (as opposed to a same-category fallback). */
export const STRONG = 3;

const CATEGORY_HINT: [RegExp, Category][] = [
  [/jacket|coat|parka|windbreaker|shell suit|hoodie|cape/, "Outerwear"],
  [/jean|trouser|pant|flare|skirt|short/, "Bottoms"],
  [/shirt|tee|top|dress|flannel|jumper/, "Tops"],
  [/trainer|shoe|boot|sandal|heel/, "Shoes"],
  [/hat|clip|scrunchie|choker|hoop|earring|belt|glasses|shades|bag|backpack|wreath|mask|wallet/, "Accessories"],
];

export function guessCategory(piece: string): Category | undefined {
  const p = piece.toLowerCase();
  return PIECE_HINTS.get(p)?.category ?? CATEGORY_HINT.find(([re]) => re.test(p))?.[1];
}

/** Which theme the plan is: majority theme of the bot's pinned listings. */
export function themeOf(pieces: OutfitPiece[], byId: (id: string) => Listing | undefined): Theme {
  let n90 = 0;
  let fancy = 0;
  for (const p of pieces) {
    const l = p.listingId ? byId(p.listingId) : undefined;
    if (l?.theme === "90s") n90++;
    else if (l?.theme === "fancy-dress") fancy++;
  }
  return fancy > n90 ? "fancy-dress" : "90s";
}

export function candidatesFor(piece: OutfitPiece, all: Listing[], theme: Theme): Candidate[] {
  const hint = PIECE_HINTS.get(piece.piece.toLowerCase());
  const own = tokenize(piece.piece);
  const extra = (hint?.prefer ?? []).flatMap(tokenize).filter((t) => !own.includes(t));
  const category = guessCategory(piece.piece);
  const phrase = piece.piece.toLowerCase();

  const scored = all.map((l): Candidate => {
    const title = new Set(tokenize(l.title));
    const tags = new Set(l.tags.flatMap(tokenize));
    const desc = new Set(tokenize(l.description));
    let score = 0;
    for (const [terms, w] of [[own, 3], [extra, 2]] as const) {
      for (const t of terms) {
        if (title.has(t) || tags.has(t)) score += w;
        else if (desc.has(t)) score += 1;
      }
    }
    if (l.title.toLowerCase().includes(phrase)) score += 2;
    return { listing: l, score, pinned: l.id === piece.listingId };
  });

  const strong = scored.filter((c) => c.pinned || c.score >= STRONG);
  // Not many real matches: pad with same-category, same-theme pieces so the feed is never bare.
  if (strong.length < 4 && category) {
    const ids = new Set(strong.map((c) => c.listing.id));
    const pad = scored
      .filter((c) => !ids.has(c.listing.id) && c.listing.category === category && c.listing.theme === theme)
      .map((c) => ({ ...c, score: Math.max(c.score, 1) }));
    strong.push(...pad.slice(0, 6 - strong.length));
  }
  return strong;
}

// ---------- owned pieces ----------

/** Best wardrobe match for an outfit piece the user "has", if the names line up. */
export function ownedItemFor(piece: string, wardrobe: WardrobeItem[]): WardrobeItem | undefined {
  const own = tokenize(piece);
  let best: WardrobeItem | undefined;
  let bestScore = 0;
  for (const w of wardrobe) {
    const toks = new Set([...tokenize(w.name), ...w.tags.flatMap(tokenize)]);
    const score = own.filter((t) => toks.has(t)).length;
    if (score > bestScore) {
      best = w;
      bestScore = score;
    }
  }
  return best;
}

// ---------- emoji ----------

const EMOJI_RULES: [RegExp, string][] = [
  [/shell suit/, "🏃"],
  [/cape/, "🦸"],
  [/toga/, "🏛️"],
  [/wreath/, "🌿"],
  [/mask/, "🎭"],
  [/robe/, "🧙"],
  [/cowboy/, "🤠"],
  [/hat/, "🎩"],
  [/jacket|coat|parka|windbreaker|hoodie/, "🧥"],
  [/jean|trouser|pant|flare/, "👖"],
  [/dress/, "👗"],
  [/boot/, "🥾"],
  [/trainer|shoe/, "👟"],
  [/sandal/, "👡"],
  [/clip|butterfly/, "🦋"],
  [/scrunch/, "🎀"],
  [/choker/, "📿"],
  [/sunglass|shades/, "🕶️"],
  [/hoop|earring/, "⭕"],
  [/belt/, "➰"],
  [/backpack|bag/, "🎒"],
  [/sequin/, "🪩"],
];
export const pieceEmoji = (piece: string): string => EMOJI_RULES.find(([re]) => re.test(piece.toLowerCase()))?.[1] ?? "👚";

// ---------- filters / ranking ----------

export type SourceKind = "student" | "charity" | "online";
export type SortMode = "best" | "cheapest" | "closest";

export interface Filters {
  sort: SortMode;
  maxPrice?: number;
  only?: SourceKind;
  swapOnly?: boolean;
  warm?: boolean;
  colour?: string;
}

export const NO_FILTERS: Filters = { sort: "best" };

export const sourceKind = (l: Listing): SourceKind => (l.external ? "online" : l.sellerType === "charity" ? "charity" : "student");
const priceOf = (l: Listing) => (l.swapOrPrice === "swap" ? 0 : l.swapOrPrice);
const walkOf = (l: Listing) => distanceInfo(l)?.metres ?? Infinity;

const WARM_RE = /parka|coat|winter|warm|fur|wool|fleece|hoodie|jumper|thick|flannel|cosy|cozy/i;
const COLOURS = ["black", "white", "red", "blue", "pink", "navy", "green", "purple", "gold", "silver", "neon", "olive", "tan", "orange", "yellow", "teal"];
const text = (l: Listing) => `${l.title} ${l.tags.join(" ")} ${l.description}`;
export const isWarm = (l: Listing) => WARM_RE.test(text(l));
export const hasColour = (l: Listing, c: string) => new RegExp(`\\b${c}`, "i").test(text(l));

/** Apply filters, then rank. "best" = bot pick first, then relevance, local before online, nearest. */
export function applyFilters(cands: Candidate[], f: Filters): Candidate[] {
  let out = cands.filter((c) => {
    const l = c.listing;
    if (f.maxPrice != null && priceOf(l) > f.maxPrice) return false;
    if (f.only && sourceKind(l) !== f.only) return false;
    if (f.swapOnly && l.swapOrPrice !== "swap") return false;
    return true;
  });
  const boost = (c: Candidate) => (f.warm && isWarm(c.listing) ? 1 : 0) + (f.colour && hasColour(c.listing, f.colour) ? 1 : 0);
  const best = (a: Candidate, b: Candidate) =>
    Number(b.pinned) - Number(a.pinned) || b.score - a.score || Number(!!a.listing.external) - Number(!!b.listing.external) || walkOf(a.listing) - walkOf(b.listing);
  out = [...out].sort((a, b) => {
    if (f.sort === "cheapest") return boost(b) - boost(a) || priceOf(a.listing) - priceOf(b.listing) || best(a, b);
    if (f.sort === "closest") return boost(b) - boost(a) || walkOf(a.listing) - walkOf(b.listing) || best(a, b);
    return boost(b) - boost(a) || best(a, b);
  });
  return out;
}

/** Short labels for the active filters, with a function that removes each one. */
export function filterChips(f: Filters): { key: string; label: string; clear: (f: Filters) => Filters }[] {
  const chips: { key: string; label: string; clear: (f: Filters) => Filters }[] = [];
  if (f.sort !== "best") chips.push({ key: "sort", label: f.sort === "cheapest" ? "Cheapest first" : "Closest first", clear: (x) => ({ ...x, sort: "best" }) });
  if (f.maxPrice != null) chips.push({ key: "max", label: `Under £${f.maxPrice}`, clear: (x) => ({ ...x, maxPrice: undefined }) });
  if (f.only) chips.push({ key: "only", label: f.only === "online" ? "Online only" : f.only === "charity" ? "Charity shops" : "Students only", clear: (x) => ({ ...x, only: undefined }) });
  if (f.swapOnly) chips.push({ key: "swap", label: "Swaps only", clear: (x) => ({ ...x, swapOnly: false }) });
  if (f.warm) chips.push({ key: "warm", label: "Warmer first", clear: (x) => ({ ...x, warm: false }) });
  if (f.colour) chips.push({ key: "colour", label: `${f.colour[0].toUpperCase()}${f.colour.slice(1)} first`, clear: (x) => ({ ...x, colour: undefined }) });
  return chips;
}

/** Turn a chat message into a filter change + a short bot reply. Null = not a refinement we understand. */
export function interpretRefinement(msg: string, f: Filters): { filters: Filters; reply: string } | null {
  const t = msg.toLowerCase();
  const next: Filters = { ...f };
  const said: string[] = [];

  if (/\b(reset|clear|undo|start again|show (me )?(all|everything))\b/.test(t)) {
    return { filters: { sort: "best" }, reply: "Cleared. Back to my best matches." };
  }
  const budget = parseBudget(msg);
  if (budget != null) {
    next.maxPrice = budget;
    said.push(`kept to under £${budget}`);
  }
  if (/cheap|less expensive|lower price|save money|bargain/.test(t)) {
    next.sort = "cheapest";
    said.push("cheapest first");
  } else if (/clos|near|walk|quick|soon|today/.test(t)) {
    next.sort = "closest";
    said.push("closest first");
  } else if (/\b(best|recommended)\b/.test(t)) {
    next.sort = "best";
    said.push("back to best matches");
  }
  if (/warm|cosy|cozy|winter|cold/.test(t)) {
    next.warm = true;
    said.push("warmest pieces first");
  }
  if (/\bswap/.test(t)) {
    next.swapOnly = true;
    said.push("swaps only");
  }
  if (/charity/.test(t)) {
    next.only = "charity";
    said.push("charity shops only");
  } else if (/student|peer/.test(t)) {
    next.only = "student";
    said.push("students only");
  } else if (/online|vinted|amazon|facebook|delivery/.test(t)) {
    next.only = "online";
    said.push("online only");
  }
  const colour = COLOURS.find((c) => new RegExp(`\\b${c}`).test(t));
  if (colour) {
    next.colour = colour;
    said.push(`${colour} ones first`);
  }

  if (!said.length) return null;
  return { filters: next, reply: `Done: ${said.join(", ")}.` };
}

// ---------- AI reason line ----------

const GENERIC_TAGS = new Set(["casual", "basic", "smart", "going", "retro", "vintage", "layer", "cosy"]);

export interface ReasonCtx {
  wardrobe: WardrobeItem[];
  /** Wardrobe items already covering other pieces of this outfit (preferred when explaining). */
  ownedForOutfit: WardrobeItem[];
  cheapestId?: string;
  closestId?: string;
  theme: Theme;
  /** The look the user chose; reasons name it instead of assuming a theme. */
  look?: { title: string; vibe?: string };
}

/** One friendly line on why this item fits. Order: goes with something you own, then price/distance, then source. */
export function reasonFor(l: Listing, ctx: ReasonCtx): string {
  const mine = new Set([...l.tags.flatMap(tokenize), ...tokenize(l.title)].filter((t) => !GENERIC_TAGS.has(t)));
  const pool = [...ctx.ownedForOutfit, ...ctx.wardrobe.filter((w) => !ctx.ownedForOutfit.includes(w))];
  for (const w of pool) {
    if (w.category === l.category) continue;
    const shared = [...w.tags.flatMap(tokenize), ...tokenize(w.name)].filter((t) => mine.has(t) && !GENERIC_TAGS.has(t) && t !== "90s");
    if (shared.length) return `Goes with the ${w.name.toLowerCase()} you own`;
  }
  // Only talk about the 90s when the chosen look is one.
  if (l.theme === "90s" && /90/.test(`${ctx.look?.title ?? ""} ${ctx.look?.vibe ?? ""}`)) {
    const w = ctx.ownedForOutfit.find((x) => x.tags.includes("90s") && x.category !== l.category);
    if (w) return `Same 90s vibe as your ${w.name.toLowerCase()}`;
  }
  const d = distanceInfo(l);
  if (l.id === ctx.cheapestId && priceOf(l) > 0) return `Cheapest match for this piece at ${formatPrice(l.swapOrPrice)}`;
  if (l.id === ctx.closestId && d) return `Closest match, just ${d.walkMins} min from you`;
  if (l.sellerType === "charity" && l.shop) return `Charity find: ${l.shop.cause.charAt(0).toLowerCase()}${l.shop.cause.slice(1)}`;
  if (l.external) return "Only turns up online, so allow a few days for delivery";
  if (l.swapOrPrice === "swap") return "Open to a swap, so it could cost you nothing";
  const lookName = ctx.look?.title ? `your ${ctx.look.title} look` : "your look";
  return `Fits ${lookName}, ${d ? `${d.walkMins} min walk` : "size " + l.size}`;
}

export { priceOf, walkOf };
