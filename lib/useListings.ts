"use client";

import { useEffect, useMemo, useState } from "react";
import { ALL_LISTINGS, Listing } from "./seed";
import { cachedUserListings, loadUserListings } from "./userListings";

/**
 * Seed listings + user uploads (localStorage instantly, then Supabase). User uploads come first
 * so a fresh upload is visible straight away. Seed ids always win over a clashing user id.
 */
export function useListings(): { all: Listing[]; user: Listing[]; byId: (id: string) => Listing | undefined } {
  const [user, setUser] = useState<Listing[]>([]);

  useEffect(() => {
    let alive = true;
    // Instant first paint from localStorage (async so it is not a synchronous setState in the effect), then Supabase.
    queueMicrotask(() => alive && setUser(cachedUserListings()));
    loadUserListings().then((l) => alive && setUser(l));
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    const seedIds = new Set(ALL_LISTINGS.map((l) => l.id));
    const extra = user.filter((l) => !seedIds.has(l.id));
    const all = [...extra, ...ALL_LISTINGS];
    const map = new Map(all.map((l) => [l.id, l]));
    return { all, user: extra, byId: (id: string) => map.get(id) };
  }, [user]);
}
