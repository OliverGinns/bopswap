"use client";

import { useState } from "react";
import { WARDROBE_CATEGORIES, WardrobeCategory, WardrobeItem, addItem, itemEmoji, removeItem } from "@/lib/wardrobe";

/** Collapsible wardrobe. BopBot receives these items automatically with every message. */
export default function WardrobePanel({ items, onChange }: { items: WardrobeItem[]; onChange: (items: WardrobeItem[]) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cat, setCat] = useState<WardrobeCategory>("Tops");

  const add = () => {
    const n = name.trim();
    if (!n) return;
    onChange(addItem({ name: n.slice(0, 60), category: cat, colour: "", tags: [] }));
    setName("");
  };

  return (
    <div className="rounded-2xl border-2 border-ink bg-cream">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-bold"
      >
        <span>
          🧥 My wardrobe <span className="font-medium text-stone">· {items.length} items · BopBot checks it for you</span>
        </span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t-2 border-ink p-3">
          <ul className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
            {items.length === 0 && <li className="text-sm text-stone">Nothing here yet. Add what you own below.</li>}
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-1.5 rounded-full border border-ink bg-canvas py-1 pl-2.5 pr-1 text-xs font-semibold">
                <span aria-hidden>{itemEmoji(i)}</span>
                {i.name}
                <button
                  type="button"
                  onClick={() => onChange(removeItem(i.id))}
                  aria-label={`Remove ${i.name}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-stone hover:bg-sage hover:text-ink"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
            className="flex flex-wrap gap-2"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add an item, e.g. Red beret"
              maxLength={60}
              className="min-w-0 flex-1 basis-40 rounded-full border-2 border-ink bg-canvas px-3 py-1.5 text-sm outline-none placeholder:text-stone focus:border-forest"
            />
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as WardrobeCategory)}
              aria-label="Category"
              className="rounded-full border-2 border-ink bg-canvas px-3 py-1.5 text-sm outline-none focus:border-forest"
            >
              {WARDROBE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!name.trim()}
              className="pop rounded-full border-2 border-ink bg-mustard px-4 py-1.5 text-sm font-bold shadow-pop-sm disabled:opacity-40"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
