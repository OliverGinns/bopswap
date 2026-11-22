// Wardrobe: client-side only (localStorage), pre-seeded for the demo user. Nothing here throws.

export const DEMO_USER = "Ollie";

export const WARDROBE_CATEGORIES = ["Tops", "Bottoms", "Outerwear", "Shoes", "Accessories", "Costume"] as const;
export type WardrobeCategory = (typeof WARDROBE_CATEGORIES)[number];

export interface WardrobeItem {
  id: string;
  name: string;
  category: WardrobeCategory;
  colour: string;
  tags: string[];
  /** Resized JPEG data URL (optional; the card falls back to an emoji). */
  photo?: string;
}

const CATEGORY_EMOJI: Record<WardrobeCategory, string> = {
  Tops: "👕",
  Bottoms: "👖",
  Outerwear: "🧥",
  Shoes: "👟",
  Accessories: "🎀",
  Costume: "🎭",
};

/** Emoji that fits a specific item better than its category, where we can tell. */
export function itemEmoji(i: WardrobeItem): string {
  const n = i.name.toLowerCase();
  if (/hoodie|jumper|sweat/.test(n)) return "🧶";
  if (/scrunch/.test(n)) return "🎀";
  if (/jean|trouser|pant/.test(n)) return "👖";
  if (/trainer|shoe|boot/.test(n)) return "👟";
  if (/jacket|coat/.test(n)) return "🧥";
  if (/belt/.test(n)) return "➰";
  return CATEGORY_EMOJI[i.category];
}

const LS_KEY = "bopswap.wardrobe.v1";

const SEED: WardrobeItem[] = [
  { id: "w01", name: "Black trainers", category: "Shoes", colour: "Black", tags: ["casual", "sporty"] },
  { id: "w02", name: "Baggy jeans", category: "Bottoms", colour: "Light blue", tags: ["denim", "baggy", "90s"] },
  { id: "w03", name: "White tee", category: "Tops", colour: "White", tags: ["basic", "casual"] },
  { id: "w04", name: "Denim jacket", category: "Outerwear", colour: "Blue", tags: ["denim", "90s", "layer"] },
  { id: "w05", name: "Scrunchies (set of 5)", category: "Accessories", colour: "Mixed", tags: ["hair", "90s"] },
  { id: "w06", name: "Plain hoodie", category: "Outerwear", colour: "Grey", tags: ["cosy", "casual"] },
  { id: "w07", name: "Black skinny jeans", category: "Bottoms", colour: "Black", tags: ["going out", "basic"] },
  { id: "w08", name: "Striped long-sleeve top", category: "Tops", colour: "Navy & white", tags: ["stripes", "pirate"] },
  { id: "w09", name: "Black leather belt", category: "Accessories", colour: "Black", tags: ["belt", "smart"] },
  { id: "w10", name: "White shirt", category: "Tops", colour: "White", tags: ["smart", "black tie"] },
];

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function clean(raw: unknown): WardrobeItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id, 60);
  const name = str(o.name, 60);
  if (!id || !name) return null;
  const category = (WARDROBE_CATEGORIES as readonly string[]).includes(o.category as string)
    ? (o.category as WardrobeCategory)
    : "Tops";
  const tags = Array.isArray(o.tags) ? o.tags.map((t) => str(t, 24).toLowerCase()).filter(Boolean).slice(0, 8) : [];
  const photo = typeof o.photo === "string" && o.photo.startsWith("data:image/") ? o.photo : undefined;
  return { id, name, category, colour: str(o.colour, 30), tags, photo };
}

/** Saved wardrobe, or the demo items on first visit / any storage problem. Never throws. */
export function readWardrobe(): WardrobeItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null) return SEED;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED;
    return parsed.map(clean).filter((x): x is WardrobeItem => !!x);
  } catch {
    return SEED;
  }
}

function write(items: WardrobeItem[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

/** Returns the new list. If the photo doesn't fit in storage the item is kept without it. */
export function addItem(input: Omit<WardrobeItem, "id">): WardrobeItem[] {
  const item: WardrobeItem = { ...input, id: `w-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}` };
  const current = readWardrobe();
  const next = [item, ...current];
  if (write(next)) return next;
  const lean = [{ ...item, photo: undefined }, ...current];
  write(lean);
  return lean;
}

export function removeItem(id: string): WardrobeItem[] {
  const next = readWardrobe().filter((i) => i.id !== id);
  write(next);
  return next;
}
