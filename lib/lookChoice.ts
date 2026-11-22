"use client";

// The look (outfit direction) the user chose in /plan, remembered so the home page can offer "pick up where you left off".
// localStorage-backed; never throws, falls back to memory if storage is unavailable.

import { useSyncExternalStore } from "react";

const LS_KEY = "bopswap.look.v1";
let memory: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function snapshot(): string | null {
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return memory;
  }
}

/** Remember the chosen look's title (or clear it with null). */
export function setChosenLook(title: string | null) {
  memory = title;
  try {
    if (title) localStorage.setItem(LS_KEY, title.slice(0, 60));
    else localStorage.removeItem(LS_KEY);
  } catch {
    /* memory only */
  }
  emit();
}

export function useChosenLook(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      window.addEventListener("storage", cb);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    snapshot,
    () => null
  );
}
