"use client";

import { useEffect, useState } from "react";
import { addOffer } from "@/lib/offers";
import { Listing, distanceInfo, formatPrice } from "@/lib/seed";
import { itemEmoji } from "@/lib/wardrobe";
import { useWardrobe } from "@/lib/useWardrobe";
import RatingBadge from "./RatingBadge";

const SLOTS = ["12:30", "13:30", "15:00", "16:30", "18:00", "19:30"];
const FEE_RATE = 0.05; // ASSUMPTION: BopSwap platform fee
const EXPRESS = 0.5;

const gbp = (n: number) => `£${n.toFixed(2)}`;

export interface HandoverInfo {
  offerId: string;
  slot: string;
  express: boolean;
  total: number;
  /** "swap" when the user traded a wardrobe item, "cash" when they pay. */
  kind: "swap" | "cash";
}

export default function HandoverModal({
  listing: l,
  onClose,
  onConfirm,
}: {
  listing: Listing;
  onClose: () => void;
  onConfirm?: (info: HandoverInfo) => void;
}) {
  const { items: wardrobe } = useWardrobe();
  const itemPrice = typeof l.swapOrPrice === "number" ? l.swapOrPrice : 0;
  const swapListing = itemPrice === 0;
  // "trade" = pick a wardrobe item, "pay" = pay the price. Swap listings can only be traded for.
  const [mode, setMode] = useState<"trade" | "pay">(swapListing ? "trade" : "pay");
  const [pick, setPick] = useState<string | null>(null);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [express, setExpress] = useState(false);
  const [done, setDone] = useState<HandoverInfo | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trading = mode === "trade";
  const pickedItem = wardrobe.find((w) => w.id === pick);
  // Express costs +£0.50 on paid items; on a swap nothing is charged (swaps never need payment).
  const expressFee = express && !trading ? EXPRESS : 0;
  const subtotal = trading ? 0 : itemPrice + expressFee;
  const platformFee = subtotal * FEE_RATE;
  const total = subtotal + platformFee;
  const d = distanceInfo(l);
  const when = express ? "within the hour" : `today at ${slot}`;
  // A swap listing with an empty wardrobe can still be requested as a plain handover.
  const canSend = !trading || !!pickedItem || (swapListing && wardrobe.length === 0);

  const send = () => {
    // Record the offer first; any later failure must not block the success screen.
    const offer = addOffer({
      listingId: l.id,
      type: trading && pickedItem ? "swap" : trading ? "handover" : "cash",
      amount: trading ? 0 : total,
      swapWardrobeItemId: trading ? (pickedItem?.id ?? null) : null,
      slot: when,
      express: express && !trading,
    });
    const info: HandoverInfo = {
      offerId: offer.id,
      slot: when,
      express,
      total: trading ? 0 : total,
      kind: trading ? "swap" : "cash",
    };
    setDone(info);
    onConfirm?.(info);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-2 border-ink bg-cream p-6 sm:rounded-3xl"
      >
        {done ? (
          <div className="py-6 text-center">
            <p className="text-6xl">🎉</p>
            <h2 className="mt-3 text-2xl font-extrabold">{done.kind === "swap" ? "Swap request sent!" : "Request sent!"}</h2>
            <p className="mt-2 text-ink/75">
              {l.sellerName} will meet you at <strong className="text-forest">{l.college}</strong> {done.slot}.
            </p>
            <p className="mt-1 text-sm text-stone">It&apos;ll show in your basket, and the map updates once they accept.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-full border-2 border-ink bg-forest text-cream shadow-pop-sm pop py-3 font-bold"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold">Request handover</h2>
                <p className="text-sm text-stone">
                  {l.imageEmoji} {l.title} · {formatPrice(l.swapOrPrice)}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-stone">
                  {l.sellerName} <RatingBadge listing={l} />
                </p>
              </div>
              <button onClick={onClose} aria-label="Close" className="rounded-full bg-sage px-3 py-1 text-lg">
                ✕
              </button>
            </div>

            <p className="mt-4 text-sm text-ink/75">
              📍 Meet at <strong>{l.college}</strong>
              {d ? ` · ${d.walkMins} min walk` : ""}
            </p>

            <h3 className="mt-5 text-sm font-bold text-forest">Trade something from your wardrobe</h3>
            {wardrobe.length === 0 ? (
              <p className="mt-2 text-sm text-stone">Your wardrobe is empty. Add items on the Wardrobe page to trade.</p>
            ) : (
              <ul className="mt-2 grid max-h-52 grid-cols-2 gap-2 overflow-y-auto p-0.5">
                {wardrobe.map((w) => {
                  const on = trading && pick === w.id;
                  return (
                    <li key={w.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("trade");
                          setPick(w.id);
                        }}
                        aria-pressed={on}
                        className={`flex w-full items-center gap-2 rounded-2xl border-2 p-2 text-left text-sm font-semibold transition ${
                          on ? "border-ink bg-mustard/40 ring-2 ring-mustard" : "border-ink bg-canvas"
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage text-xl">
                          {itemEmoji(w)}
                        </span>
                        <span className="min-w-0 truncate">{w.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {!swapListing && (
              <button
                type="button"
                onClick={() => setMode("pay")}
                aria-pressed={!trading}
                className={`mt-2 w-full rounded-2xl border-2 py-2.5 text-sm font-bold transition ${
                  !trading ? "border-ink bg-mustard ring-2 ring-mustard" : "border-ink bg-canvas"
                }`}
              >
                💷 Pay {gbp(itemPrice)} instead
              </button>
            )}

            <h3 className="mt-5 text-sm font-bold text-forest">Pick a meetup slot (today)</h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  disabled={express}
                  onClick={() => setSlot(s)}
                  className={`rounded-xl border py-2 text-sm font-semibold transition disabled:opacity-40 ${
                    slot === s && !express ? "border-ink bg-forest text-cream" : "border-ink bg-canvas hover:border-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-ink bg-canvas p-3">
              <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} className="h-5 w-5 accent-forest" />
              <span className="text-sm">
                <strong>⚡ Express (within the hour)</strong>
                <span className="block text-stone">{trading ? "Free on swaps (demo)" : "+£0.50"}</span>
              </span>
            </label>

            <div className="mt-5 rounded-2xl bg-canvas p-4 text-sm">
              {trading ? (
                <>
                  <h3 className="mb-2 font-bold text-forest">Your swap</h3>
                  <Row label="You give" value={pickedItem ? pickedItem.name : "Pick an item above"} />
                  <Row label="You get" value={l.title} />
                  <div className="my-2 border-t border-ink" />
                  <Row label="To pay" value="£0.00" bold />
                </>
              ) : (
                <>
                  <h3 className="mb-2 font-bold text-forest">Fee breakdown</h3>
                  <Row label="Item" value={gbp(itemPrice)} />
                  {express && <Row label="Express handover" value={gbp(EXPRESS)} />}
                  <Row label="BopSwap fee (5%)*" value={gbp(platformFee)} />
                  <div className="my-2 border-t border-ink" />
                  <Row label="Total" value={gbp(total)} bold />
                  <p className="mt-3 text-xs text-stone">
                    *Assumption: BopSwap takes 5% of the item price plus any express fee. Not a final pricing model.
                  </p>
                </>
              )}
            </div>

            <button
              disabled={!canSend}
              onClick={send}
              className="mt-5 w-full rounded-full bg-mustard py-3 font-extrabold text-ink transition disabled:opacity-40"
            >
              {trading ? "Send swap request" : "Send request"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 py-0.5 ${bold ? "text-base font-extrabold" : "text-ink/75"}`}>
      <span className="shrink-0">{label}</span>
      <span className="min-w-0 truncate text-right">{value}</span>
    </div>
  );
}
