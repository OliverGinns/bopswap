"use client";

import { useEffect, useState } from "react";
import { Listing, formatPrice } from "@/lib/seed";
import { WardrobeItem, itemEmoji } from "@/lib/wardrobe";

type Props =
  | { mode: "swap"; listing: Listing; wardrobe: WardrobeItem[]; onClose: () => void; onSwap: (item: WardrobeItem) => void }
  | { mode: "offer"; listing: Listing; wardrobe: WardrobeItem[]; onClose: () => void; onOffer: (amount: number) => void };

/** Simulated offers: confirming just calls back, nothing is sent anywhere. */
export default function OfferModal(props: Props) {
  const { listing: l, onClose } = props;
  const listed = typeof l.swapOrPrice === "number" ? l.swapOrPrice : 5;
  const [pick, setPick] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(Math.max(1, Math.round(listed * 0.8))));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const n = Number(amount);
  const valid = Number.isFinite(n) && n > 0 && n <= 500;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-2 border-ink bg-cream p-6 sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold">{props.mode === "swap" ? "Offer a swap" : "Make an offer"}</h2>
            <p className="text-sm text-stone">
              {l.imageEmoji} {l.title} · listed {formatPrice(l.swapOrPrice)} · {l.sellerName}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-sage px-3 py-1 text-lg">
            ✕
          </button>
        </div>

        {props.mode === "swap" ? (
          <>
            <h3 className="mt-5 text-sm font-bold text-forest">Pick something from your wardrobe</h3>
            {props.wardrobe.length === 0 ? (
              <p className="mt-2 text-sm text-stone">Your wardrobe is empty. Add an item in the Plan chat first.</p>
            ) : (
              <ul className="mt-2 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
                {props.wardrobe.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => setPick(w.id)}
                      aria-pressed={pick === w.id}
                      className={`flex w-full items-center gap-2 rounded-2xl border-2 p-2 text-left text-sm font-semibold transition ${
                        pick === w.id ? "border-ink bg-mustard/40 ring-2 ring-mustard" : "border-ink bg-canvas"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage text-xl">{itemEmoji(w)}</span>
                      <span className="min-w-0 truncate">{w.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              disabled={!pick}
              onClick={() => {
                const item = props.wardrobe.find((w) => w.id === pick);
                if (item && props.mode === "swap") props.onSwap(item);
              }}
              className="pop mt-5 w-full rounded-full border-2 border-ink bg-mustard py-3 font-bold shadow-pop-sm disabled:opacity-40"
            >
              Send swap offer
            </button>
          </>
        ) : (
          <>
            <label className="mt-5 block text-sm font-bold text-forest" htmlFor="offer-amount">
              Your offer
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border-2 border-ink bg-canvas px-4 py-2 focus-within:border-forest">
              <span className="text-xl font-bold">£</span>
              <input
                id="offer-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, "").slice(0, 6))}
                className="w-full bg-transparent text-xl font-bold outline-none"
              />
            </div>
            <div className="mt-2 flex gap-2">
              {[0.9, 0.8, 0.7].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAmount(String(Math.max(1, Math.round(listed * f))))}
                  className="rounded-full border border-ink bg-cream px-3 py-1 text-xs font-bold"
                >
                  −{Math.round((1 - f) * 100)}%
                </button>
              ))}
            </div>
            <button
              disabled={!valid}
              onClick={() => props.mode === "offer" && valid && props.onOffer(n)}
              className="pop mt-5 w-full rounded-full border-2 border-ink bg-mustard py-3 font-bold shadow-pop-sm disabled:opacity-40"
            >
              Send offer
            </button>
          </>
        )}
        <p className="mt-3 text-center text-xs text-stone">Demo only: offers are simulated and nothing is sent.</p>
      </div>
    </div>
  );
}
