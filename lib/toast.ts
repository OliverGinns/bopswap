"use client";

import { useSyncExternalStore } from "react";

// Tiny global toast: any page or component can call toast("…"), <Toaster /> (in the root layout) shows it.

export interface ToastMsg {
  id: number;
  text: string;
}

let current: ToastMsg | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, ms = 4500) {
  current = { id: Date.now() + Math.random(), text };
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    emit();
  }, ms);
}

export function useToast(): ToastMsg | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => null
  );
}
