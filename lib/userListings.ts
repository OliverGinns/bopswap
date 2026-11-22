// User-uploaded listings. Client-side only.
// Supabase (plain REST, no SDK) when NEXT_PUBLIC_SUPABASE_* are set; localStorage otherwise or on ANY failure.
// Nothing here throws: every public function resolves, so the UI can never crash on a bad network or missing env.

import { COLLEGES, Category, Condition, Listing, Theme } from "./seed";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseConfigured = !!URL_ && !!KEY;

const BUCKET = "listing-images";
const LS_KEY = "bopswap.userListings.v1";
const TIMEOUT_MS = 6000;

export const CATEGORIES: Category[] = ["Tops", "Bottoms", "Outerwear", "Shoes", "Accessories", "Costume"];
export const CONDITIONS: Condition[] = ["New", "Like new", "Good", "Well loved"];
export const THEMES: { id: Theme; label: string }[] = [
  { id: "90s", label: "📼 90s" },
  { id: "fancy-dress", label: "🎭 Fancy dress" },
];
/** Style tag chips (all seed tags are lowercase). */
export const TAG_CHIPS = [
  "denim", "vintage", "retro", "grunge", "sporty", "glitter", "sequins", "neon", "festival",
  "britpop", "going out", "costume", "hat", "wig", "disco", "toga", "pirate", "superhero",
];

const EMOJI: Record<Category, string> = { Tops: "👕", Bottoms: "👖", Outerwear: "🧥", Shoes: "👟", Accessories: "🕶️", Costume: "🎭" };
const GRADIENTS: [string, string][] = [
  ["#ff2e93", "#ffe600"], ["#7c3aed", "#ec4899"], ["#06b6d4", "#8b5cf6"], ["#f97316", "#ec4899"], ["#22d3ee", "#a3e635"],
];

export interface NewListingInput {
  title: string;
  category: Category;
  size: string;
  condition: Condition;
  theme: Theme;
  tags: string[];
  /** null = swap */
  price: number | null;
  college: string;
  description?: string;
  /** Resized JPEG, or none (the card falls back to an emoji). */
  image?: Blob | null;
}

// ---------- shaping ----------

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Normalise any untrusted object (a Supabase row, localStorage entry, or API upload) into a Listing. Null if unusable. */
export function toListing(raw: unknown): Listing | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id, 60);
  const title = str(o.title, 80);
  if (!id || !title) return null;

  const category = pick(o.category, CATEGORIES, "Accessories");
  const collegeName = str(o.college, 60);
  const spot = COLLEGES.find((c) => c.college === collegeName);
  // Supabase rows use `price` (null = swap) and snake_case; the in-app Listing uses swapOrPrice.
  const priceRaw = "price" in o ? o.price : o.swapOrPrice;
  const priceNum = typeof priceRaw === "number" ? priceRaw : typeof priceRaw === "string" && priceRaw !== "swap" && priceRaw !== "" ? Number(priceRaw) : NaN;
  const lat = typeof o.lat === "number" ? o.lat : spot?.lat;
  const lng = typeof o.lng === "number" ? o.lng : spot?.lng;
  const imageUrl = str(o.image_url ?? o.imageUrl, 2_000_000);

  return {
    id,
    title,
    description: str(o.description, 300) || `${title}, listed by a student near ${collegeName || "you"}.`,
    category,
    theme: o.theme === "90s" ? "90s" : "fancy-dress",
    size: str(o.size, 20) || "One size",
    condition: pick(o.condition, CONDITIONS, "Good"),
    tags: Array.isArray(o.tags) ? o.tags.map((t) => str(t, 30).toLowerCase()).filter(Boolean).slice(0, 8) : [],
    swapOrPrice: Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : "swap",
    sellerName: str(o.seller_name ?? o.sellerName, 60) || "A student",
    sellerType: "student",
    college: collegeName || undefined,
    lat,
    lng,
    imageEmoji: str(o.imageEmoji, 8) || EMOJI[category],
    imageUrl: /^(https?:|data:image\/)/.test(imageUrl) ? imageUrl : undefined,
    gradient: GRADIENTS[hash(id) % GRADIENTS.length],
    source: "local",
  };
}

const toListings = (rows: unknown): Listing[] =>
  Array.isArray(rows) ? rows.map(toListing).filter((l): l is Listing => !!l) : [];

// ---------- localStorage ----------

function readLocal(): Listing[] {
  try {
    return toListings(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

/** Ids the user deleted from "Your listings" (also hides Supabase rows we can't delete without auth). */
export const HIDDEN_KEY = "bopswap.myListings.hidden.v1";

/** Remove one listing from this device's saved uploads. */
export function removeLocalListing(id: string): void {
  writeLocal(readLocal().filter((l) => l.id !== id));
}

function writeLocal(list: Listing[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 30)));
    return true;
  } catch {
    return false; // quota or private mode
  }
}

// ---------- Supabase (REST) ----------

function headers(extra?: Record<string, string>): HeadersInit {
  const h: Record<string, string> = { apikey: KEY!, ...extra };
  // Legacy anon keys are JWTs and go in Authorization too; new sb_publishable_ keys must not.
  if (KEY!.startsWith("eyJ")) h.Authorization = `Bearer ${KEY}`;
  return h;
}

async function sb(path: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${URL_}${path}`, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function remoteList(): Promise<Listing[]> {
  if (!supabaseConfigured) return [];
  try {
    const res = await sb("/rest/v1/listings?select=*&order=created_at.desc&limit=100", { headers: headers() });
    return toListings(await res.json());
  } catch {
    return [];
  }
}

async function remoteGet(id: string): Promise<Listing | null> {
  if (!supabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const res = await sb(`/rest/v1/listings?select=*&id=eq.${id}&limit=1`, { headers: headers() });
    return toListings(await res.json())[0] ?? null;
  } catch {
    return null;
  }
}

async function remoteCreate(input: NewListingInput): Promise<Listing> {
  let image_url: string | null = null;
  if (input.image) {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
    await sb(`/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: headers({ "Content-Type": "image/jpeg", "x-upsert": "false" }),
      body: input.image,
    });
    image_url = `${URL_}/storage/v1/object/public/${BUCKET}/${path}`;
  }
  const spot = COLLEGES.find((c) => c.college === input.college);
  const res = await sb("/rest/v1/listings", {
    method: "POST",
    headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify({
      title: input.title,
      description: input.description ?? "",
      category: input.category,
      theme: input.theme,
      size: input.size,
      condition: input.condition,
      tags: input.tags,
      price: input.price,
      college: input.college,
      lat: spot?.lat ?? null,
      lng: spot?.lng ?? null,
      image_url,
    }),
  });
  const row = toListings(await res.json())[0];
  if (!row) throw new Error("Empty insert response");
  return row;
}

// ---------- public API ----------

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });

/** Merge, newest first, de-duplicated by id. */
const merge = (...lists: Listing[][]): Listing[] => {
  const seen = new Set<string>();
  return lists.flat().filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)));
};

/** Instant: whatever is in localStorage. Use for the first paint. */
export const cachedUserListings = readLocal;

/** Supabase + localStorage. Never rejects. */
export async function loadUserListings(): Promise<Listing[]> {
  const [remote] = await Promise.all([remoteList()]);
  let hidden: string[] = [];
  try {
    const v: unknown = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]");
    if (Array.isArray(v)) hidden = v.filter((x): x is string => typeof x === "string");
  } catch {
    /* nothing hidden */
  }
  return merge(readLocal(), remote).filter((l) => !hidden.includes(l.id));
}

export async function loadUserListing(id: string): Promise<Listing | null> {
  return readLocal().find((l) => l.id === id) ?? (await remoteGet(id));
}

/** Saves to Supabase, falling back to localStorage. Resolves with the new listing; only rejects if BOTH fail. */
export async function createListing(input: NewListingInput): Promise<Listing> {
  if (supabaseConfigured) {
    try {
      return await remoteCreate(input);
    } catch (err) {
      console.warn("[BopSwap] Supabase upload failed, saving locally:", err instanceof Error ? err.message : err);
    }
  }
  const id = `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const image = input.image ? await blobToDataUrl(input.image).catch(() => "") : "";
  const base = {
    id,
    title: input.title,
    description: input.description,
    category: input.category,
    theme: input.theme,
    size: input.size,
    condition: input.condition,
    tags: input.tags,
    price: input.price,
    college: input.college,
  };
  let listing = toListing({ ...base, imageUrl: image });
  if (!listing) throw new Error("Invalid listing");
  const existing = readLocal();
  // localStorage is small (~5 MB): if the photo doesn't fit, keep the listing and drop the photo.
  if (!writeLocal([listing, ...existing])) {
    listing = toListing(base)!;
    if (!writeLocal([listing, ...existing])) throw new Error("Couldn't save the listing on this device");
  }
  return listing;
}

// ---------- images ----------

/** Decode, scale down to max `maxDim` px on the long edge, and re-encode as JPEG. Rejects if it isn't a readable image. */
export async function resizeImage(file: Blob, maxDim = 1200, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file); // honours EXIF orientation in current browsers
  try {
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas");
    ctx.fillStyle = "#fff"; // JPEG has no alpha
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encode failed"))), "image/jpeg", quality)
    );
  } finally {
    bmp.close();
  }
}
