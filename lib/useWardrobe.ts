"use client";

import { useEffect, useState } from "react";
import { WardrobeItem, readWardrobe } from "./wardrobe";

/** Wardrobe items: empty on first render (SSR-safe), then read from localStorage. */
export function useWardrobe() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readWardrobe());
    setReady(true);
  }, []);
  return { items, setItems, ready };
}
