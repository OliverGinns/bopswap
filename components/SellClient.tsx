"use client";

import { useEffect, useRef, useState } from "react";
import { useMyListings } from "@/lib/myListings";
import { toast } from "@/lib/toast";
import { supabaseConfigured } from "@/lib/userListings";
import { useWardrobe } from "@/lib/useWardrobe";
import { WardrobeItem } from "@/lib/wardrobe";
import MyListingsGrid from "./MyListingsGrid";
import SellForm, { SellPrefill } from "./SellForm";
import WardrobeThumb from "./WardrobeThumb";

export default function SellClient() {
  const { items, ready, remove } = useMyListings();
  const { items: wardrobe } = useWardrobe();
  const [picker, setPicker] = useState(false);
  const [prefill, setPrefill] = useState<(SellPrefill & { key: number }) | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!picker) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPicker(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picker]);

  const pick = (w: WardrobeItem) => {
    setPrefill((p) => ({ key: (p?.key ?? 0) + 1, name: w.name, category: w.category, tags: w.tags, photo: w.photo }));
    setPicker(false);
    toast(`Pre-filled from your wardrobe: ${w.name}. Just add a price or choose swap.`);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-5">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Sell or <span className="text-forest">swap</span>
      </h1>
      <p className="mt-1 text-ink/75">
        Listed items show up for students nearby straight away, and BopBot can suggest them.
        {!supabaseConfigured && " (Saving on this device only.)"}
      </p>

      <section aria-label="Your listings" className="mt-6">
        <h2 className="font-display mb-3 text-xl font-bold">
          Your listings {ready && <span className="text-stone">({items.length})</span>}
        </h2>
        {ready && items.length === 0 ? (
          <div className="rounded-2xl border-2 border-ink bg-cream p-8 text-center shadow-pop">
            <p className="text-4xl">🏷️</p>
            <p className="font-display mt-2 font-semibold">Nothing listed yet. Add your first item below!</p>
          </div>
        ) : (
          <MyListingsGrid items={items} onDelete={remove} onDeleted={(t) => toast(`Deleted “${t}”.`)} />
        )}
      </section>

      <section ref={formRef} aria-label="Add a listing" className="mt-10 scroll-mt-20">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Add a listing</h2>
          <button
            type="button"
            onClick={() => setPicker(true)}
            className="font-display pop rounded-full border-2 border-ink bg-mustard px-4 py-2 text-sm font-semibold shadow-pop-sm"
          >
            👗 List from my wardrobe
          </button>
        </div>
        {prefill && (
          <p className="mb-3 rounded-2xl border-2 border-ink bg-sage px-4 py-2 text-sm font-semibold text-forest">
            ✨ Pre-filled from your wardrobe: {prefill.name}. Just add a price or choose swap.
          </p>
        )}
        <div className="max-w-3xl">
          <SellForm key={prefill?.key ?? 0} prefill={prefill ?? undefined} />
        </div>
      </section>

      {picker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 sm:items-center sm:p-4" onClick={() => setPicker(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pick from your wardrobe"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border-2 border-ink bg-cream p-5 sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">List from my wardrobe</h2>
                <p className="text-sm text-stone">Pick an item and we&apos;ll fill in the details.</p>
              </div>
              <button onClick={() => setPicker(false)} aria-label="Close" className="rounded-full bg-sage px-3 py-1 text-lg">
                ✕
              </button>
            </div>
            {wardrobe.length === 0 ? (
              <p className="mt-4 text-sm text-stone">Your wardrobe is empty. Add items on the Wardrobe page first.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {wardrobe.map((w) => (
                  <li key={w.id}>
                    <button
                      onClick={() => pick(w)}
                      className="pop flex w-full flex-col overflow-hidden rounded-2xl border-2 border-ink bg-canvas text-left shadow-pop-sm"
                    >
                      <WardrobeThumb item={w} className="aspect-[4/3] text-4xl" />
                      <span className="border-t-2 border-ink p-2">
                        <span className="font-display line-clamp-1 block text-sm font-semibold">{w.name}</span>
                        <span className="block text-xs text-stone">{w.category}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
