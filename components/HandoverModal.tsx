"use client";

import { useEffect, useState } from "react";
import { addOffer } from "@/lib/offers";
import { Listing, distanceInfo, formatPrice } from "@/lib/seed";

const SLOTS = ["12:30", "13:30", "15:00", "16:30", "18:00", "19:30"];
const FEE_RATE = 0.05; // ASSUMPTION: BopSwap platform fee
const EXPRESS = 0.5;

const gbp = (n: number) => `£${n.toFixed(2)}`;

export default function HandoverModal({ listing: l, onClose, onConfirm }: { listing: Listing; onClose: () => void; onConfirm?: (info: { offerId: string; slot: string; express: boolean; total: number }) => void }) {
  const [slot, setSlot] = useState(SLOTS[0]);
  const [express, setExpress] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const itemPrice = typeof l.swapOrPrice === "number" ? l.swapOrPrice : 0;
  const expressFee = express ? EXPRESS : 0;
  const subtotal = itemPrice + expressFee;
  const platformFee = subtotal * FEE_RATE;
  const total = subtotal + platformFee;
  const d = distanceInfo(l);
  const when = express ? "within the hour" : `today at ${slot}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-2 border-ink bg-cream p-6 sm:rounded-3xl"
      >
        {done ? (
          <div className="py-6 text-center">
            <p className="text-6xl">🎉</p>
            <h2 className="mt-3 text-2xl font-extrabold">Request sent!</h2>
            <p className="mt-2 text-ink/75">
              {l.sellerName} will meet you at <strong className="text-forest">{l.college}</strong> {when}.
            </p>
            <button onClick={onClose} className="mt-6 w-full rounded-full border-2 border-ink bg-forest text-cream shadow-pop-sm pop py-3 font-bold">
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
              </div>
              <button onClick={onClose} aria-label="Close" className="rounded-full bg-sage px-3 py-1 text-lg">
                ✕
              </button>
            </div>

            <p className="mt-4 text-sm text-ink/75">
              📍 Meet at <strong>{l.college}</strong>
              {d ? ` · ${d.walkMins} min walk` : ""}
            </p>

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
              <input
                type="checkbox"
                checked={express}
                onChange={(e) => setExpress(e.target.checked)}
                className="h-5 w-5 accent-forest"
              />
              <span className="text-sm">
                <strong>⚡ Express (within the hour)</strong>
                <span className="block text-stone">+£0.50</span>
              </span>
            </label>

            <div className="mt-5 rounded-2xl bg-canvas p-4 text-sm">
              <h3 className="mb-2 font-bold text-forest">Fee breakdown</h3>
              <Row label="Item" value={l.swapOrPrice === "swap" ? "Swap (£0.00)" : gbp(itemPrice)} />
              {express && <Row label="Express handover" value={gbp(EXPRESS)} />}
              <Row label="BopSwap fee (5%)*" value={gbp(platformFee)} />
              <div className="my-2 border-t border-ink" />
              <Row label="Total" value={gbp(total)} bold />
              <p className="mt-3 text-xs text-stone">
                *Assumption: BopSwap takes 5% of the item price plus any express fee. Not a final pricing model.
              </p>
            </div>

            <button
              onClick={() => {
                // Record the offer first; any later failure must not block the success screen.
                const offer = addOffer({ listingId: l.id, type: "handover", amount: itemPrice > 0 ? total : 0, slot: when });
                setDone(true);
                onConfirm?.({ offerId: offer.id, slot: when, express, total });
              }}
              className="mt-5 w-full rounded-full bg-mustard py-3 font-extrabold text-ink transition "
            >
              Send request
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 ${bold ? "text-base font-extrabold" : "text-ink/75"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
