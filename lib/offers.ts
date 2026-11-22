"use client";

// Offers: every cash offer, swap offer, handover request, charity pickup and online order the user makes.
// localStorage-backed and shared across pages (useSyncExternalStore). Nothing here throws; if storage is
// unavailable the offers simply live in memory for the session.

import { useSyncExternalStore } from "react";
import { Listing } from "./seed";
import { WardrobeItem } from "./wardrobe";

export type OfferType = "cash" | "swap" | "handover" | "pickup" | "online";
export type OfferStatus = "pending" | "accepted" | "retracted" | "completed";

export interface Offer {
  id: string;
  listingId: string;
  type: OfferType;
  /** £ the user pays (0 for swaps and swap-listings). */
  amount: number;
  swapWardrobeItemId: string | null;
  status: OfferStatus;
  createdAt: number;
  /** Meetup slot or pickup time, e.g. "today at 15:00". */
  slot?: string;
  /** When the simulated seller replies (pending student offers only). */
  acceptAt?: number;
}

export const isActive = (o: Offer) => o.status === "pending" || o.status === "accepted";

const LS_KEY = "bopswap.offers.v1";
export const MEETUP_SLOTS = ["12:30", "13:30", "15:00", "16:30", "18:00", "19:30"];
const TYPES: OfferType[] = ["cash", "swap", "handover", "pickup", "online"];
const STATUSES: OfferStatus[] = ["pending", "accepted", "retracted", "completed"];

// ---------- store ----------

const EMPTY: Offer[] = [];
let cache: Offer[] = EMPTY;
let lastRaw: string | null = null;
let memoryOnly = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function clean(raw: unknown): Offer | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.listingId !== "string") return null;
  if (!TYPES.includes(o.type as OfferType) || !STATUSES.includes(o.status as OfferStatus)) return null;
  return {
    id: o.id,
    listingId: o.listingId,
    type: o.type as OfferType,
    amount: typeof o.amount === "number" && Number.isFinite(o.amount) ? o.amount : 0,
    swapWardrobeItemId: typeof o.swapWardrobeItemId === "string" ? o.swapWardrobeItemId : null,
    status: o.status as OfferStatus,
    createdAt: typeof o.createdAt === "number" ? o.createdAt : Date.now(),
    slot: typeof o.slot === "string" ? o.slot : undefined,
    acceptAt: typeof o.acceptAt === "number" ? o.acceptAt : undefined,
  };
}

function snapshot(): Offer[] {
  if (typeof window === "undefined") return EMPTY;
  if (memoryOnly) return cache;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw !== lastRaw) {
      lastRaw = raw;
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cache = Array.isArray(parsed) ? parsed.map(clean).filter((x): x is Offer => !!x) : EMPTY;
    }
  } catch {
    memoryOnly = true;
  }
  return cache;
}

function save(next: Offer[]) {
  cache = next;
  try {
    const raw = JSON.stringify(next);
    localStorage.setItem(LS_KEY, raw);
    lastRaw = raw;
  } catch {
    memoryOnly = true;
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === LS_KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** All offers, newest first. `ready` is false until the browser has read localStorage. */
export function useOffers(): { offers: Offer[]; ready: boolean } {
  const offers = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  return { offers, ready };
}

// ---------- actions ----------

export interface NewOffer {
  listingId: string;
  type: OfferType;
  amount?: number;
  swapWardrobeItemId?: string | null;
  slot?: string;
}

/** Student offers get a simulated seller reply 6-10 s later; charity pickups and online orders are confirmed straight away. */
export function addOffer(input: NewOffer): Offer {
  const now = Date.now();
  const needsReply = input.type === "cash" || input.type === "swap" || input.type === "handover";
  const offer: Offer = {
    id: `o-${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    listingId: input.listingId,
    type: input.type,
    amount: Math.max(0, Math.round((input.amount ?? 0) * 100) / 100),
    swapWardrobeItemId: input.swapWardrobeItemId ?? null,
    status: needsReply ? "pending" : "accepted",
    createdAt: now,
    slot: input.slot,
    acceptAt: needsReply ? now + 6000 + Math.random() * 4000 : undefined,
  };
  // A newer offer on the same listing replaces the older active one.
  const rest = snapshot().map((o) =>
    o.listingId === input.listingId && isActive(o) ? { ...o, status: "retracted" as const, acceptAt: undefined } : o
  );
  save([offer, ...rest]);
  return offer;
}

function patch(ids: string[], fn: (o: Offer) => Offer) {
  const set = new Set(ids);
  save(snapshot().map((o) => (set.has(o.id) ? fn(o) : o)));
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** The seller says yes: pending -> accepted, with a proposed slot if there isn't one yet. */
export function acceptOffer(id: string) {
  patch([id], (o) =>
    o.status === "pending"
      ? { ...o, status: "accepted", acceptAt: undefined, slot: o.slot ?? `today at ${MEETUP_SLOTS[hash(o.id) % MEETUP_SLOTS.length]}` }
      : o
  );
}

export function retractOffer(id: string) {
  patch([id], (o) => (isActive(o) ? { ...o, status: "retracted", acceptAt: undefined } : o));
}

export function completeOffers(ids: string[]) {
  patch(ids, (o) => (isActive(o) ? { ...o, status: "completed", acceptAt: undefined } : o));
}

// ---------- display helpers ----------

export const TYPE_LABEL: Record<OfferType, string> = {
  cash: "Cash offer",
  swap: "Swap offer",
  handover: "Handover",
  pickup: "Charity pickup",
  online: "Online order",
};

export const gbp = (n: number) => `£${n.toFixed(2).replace(/\.00$/, "")}`;

export function offerDetail(o: Offer, l: Listing | undefined, w: WardrobeItem | undefined): string {
  switch (o.type) {
    case "cash":
      return `Offered ${gbp(o.amount)}${l && typeof l.swapOrPrice === "number" ? ` (listed ${gbp(l.swapOrPrice)})` : ""}`;
    case "swap":
      return `Swap for your ${w ? w.name.toLowerCase() : "wardrobe item"}`;
    case "handover":
      return o.amount > 0 ? `Handover · ${gbp(o.amount)} incl. fee` : "Handover · swap listing";
    case "pickup":
      return `Pay in store · ${gbp(o.amount)}`;
    case "online":
      return `Online order · ${gbp(o.amount)}`;
  }
}

export function offerWhen(o: Offer, l: Listing | undefined): string {
  if (o.type === "online") return `Arrives in ${l?.delivery ?? "2-4 days"}`;
  if (o.type === "pickup") return o.slot ?? "In store today, until 5pm";
  if (o.slot) return `Meet ${o.slot}`;
  return o.status === "pending" ? "Waiting for a reply…" : "Slot to confirm";
}

/** Rough "bought new" value of a listing; used for the "£ saved" estimate. */
export const retailEstimate = (l: Listing | undefined) =>
  Math.round((l && typeof l.swapOrPrice === "number" ? Math.max(l.swapOrPrice, 4) : 8) * 2.5);
