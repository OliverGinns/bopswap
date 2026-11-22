"use client";

// "Your listings" for the demo user: 3 seeded demo listings + anything created on this device.

import { useCallback, useEffect, useState } from "react";
import { Category, DEFAULT_USER, Listing } from "./seed";
import { HIDDEN_KEY, cachedUserListings, removeLocalListing } from "./userListings";
import { DEMO_USER } from "./wardrobe";

export type MyStatus = "Live" | "Reserved" | "Swapped";

export interface MyListing {
  listing: Listing;
  status: MyStatus;
  views: number;
  offers: number;
  demo: boolean;
}

type DemoInput = Pick<
  Listing,
  "id" | "title" | "description" | "category" | "theme" | "size" | "condition" | "tags" | "swapOrPrice" | "imageEmoji" | "gradient"
>;
const demo = (l: DemoInput): Listing => ({
  ...l,
  sellerName: DEMO_USER,
  sellerType: "student",
  college: "St Anne's",
  lat: DEFAULT_USER.lat,
  lng: DEFAULT_USER.lng,
  source: "local",
});

const DEMO: MyListing[] = [
  {
    listing: demo({ id: "my01", title: "Butterfly clip set", description: "A rainbow of 90s butterfly clips.", category: "Accessories", theme: "90s", size: "One size", condition: "Like new", tags: ["90s", "hair"], swapOrPrice: 3, imageEmoji: "🦋", gradient: ["#ec4899", "#8b5cf6"] }),
    status: "Live", views: 42, offers: 3, demo: true,
  },
  {
    listing: demo({ id: "my02", title: "Tartan mini skirt", description: "Pleated red tartan, very Clueless.", category: "Bottoms", theme: "90s", size: "S", condition: "Good", tags: ["90s", "tartan"], swapOrPrice: 6, imageEmoji: "👗", gradient: ["#ef4444", "#7f1d1d"] }),
    status: "Reserved", views: 88, offers: 5, demo: true,
  },
  {
    listing: demo({ id: "my03", title: "Leopard-print party coat", description: "Fluffy and loud. Fancy dress approved.", category: "Outerwear", theme: "fancy-dress", size: "M", condition: "Good", tags: ["costume", "leopard"], swapOrPrice: "swap", imageEmoji: "🐆", gradient: ["#f59e0b", "#7c2d12"] }),
    status: "Swapped", views: 120, offers: 2, demo: true,
  },
];

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function hiddenIds(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function hide(id: string) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...new Set([...hiddenIds(), id])]));
  } catch {
    /* in-memory only */
  }
}

function build(): MyListing[] {
  const hidden = new Set(hiddenIds());
  const mine: MyListing[] = cachedUserListings().map((l) => ({
    listing: { ...l, sellerName: DEMO_USER },
    status: "Live" as const,
    views: 3 + (hash(l.id) % 18),
    offers: hash(l.id) % 3,
    demo: false,
  }));
  return [...mine, ...DEMO].filter((m) => !hidden.has(m.listing.id));
}

/** Empty on first render (SSR-safe), then read from localStorage. */
export function useMyListings() {
  const [items, setItems] = useState<MyListing[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      setItems(build());
      setReady(true);
    });
  }, []);
  const remove = useCallback((id: string) => {
    hide(id);
    removeLocalListing(id);
    setItems((prev) => prev.filter((m) => m.listing.id !== id));
  }, []);
  return { items, ready, remove };
}

/** Scripted BopBot price hint. */
const HINT: Record<Category, number> = { Tops: 4, Bottoms: 6, Outerwear: 8, Shoes: 7, Accessories: 3, Costume: 5 };
export const suggestPrice = (c: Category) => HINT[c];
