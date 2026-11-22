"use client";

import { useEffect, useRef, useState } from "react";
import { EXPRESS_FEE, Offer, gbp, payOffer } from "@/lib/offers";
import { Listing } from "@/lib/seed";
import RatingBadge from "./RatingBadge";

/** Demo payment sheet: no card fields, "Pay with card (demo)" just simulates success after ~1s. */
export default function PaySheet({
  offer: o,
  listing: l,
  onClose,
  onPaid,
}: {
  offer: Offer;
  listing: Listing | undefined;
  onClose: () => void;
  onPaid?: () => void;
}) {
  const [state, setState] = useState<"idle" | "paying" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && state !== "paying" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, state]);

  const expressFee = o.express ? EXPRESS_FEE : 0;
  const itemPart = Math.max(0, o.amount - expressFee);

  const pay = () => {
    if (state !== "idle") return;
    setState("paying");
    timer.current = setTimeout(() => {
      payOffer(o.id);
      setState("done");
      onPaid?.();
      timer.current = setTimeout(onClose, 900);
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 sm:items-center sm:p-4"
      onClick={() => state !== "paying" && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Demo payment"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-2 border-ink bg-cream p-6 sm:rounded-3xl"
      >
        {state === "done" ? (
          <div className="py-6 text-center">
            <p className="text-6xl">✅</p>
            <h2 className="font-display mt-3 text-2xl font-bold">Paid ✓</h2>
            <p className="mt-1 text-sm text-ink/75">Demo only, no real payment was made.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-xl font-bold">Pay for your item</h2>
              <button
                onClick={onClose}
                disabled={state === "paying"}
                aria-label="Close"
                className="rounded-full bg-sage px-3 py-1 text-lg disabled:opacity-40"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-ink bg-canvas p-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sage text-2xl">
                {l?.imageEmoji ?? "👚"}
              </span>
              <div className="min-w-0">
                <p className="font-display truncate font-semibold">{l?.title ?? "Your item"}</p>
                <p className="flex flex-wrap items-center gap-1.5 text-xs text-stone">
                  {l?.sellerName ?? "Seller"}
                  {l && <RatingBadge listing={l} />}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-canvas p-4 text-sm">
              <Row label="Item & fees" value={gbp(itemPart)} />
              {o.express && <Row label="⚡ Express handover" value={gbp(EXPRESS_FEE)} />}
              <div className="my-2 border-t border-ink" />
              <Row label="Total" value={gbp(o.amount)} bold />
            </div>

            <button
              onClick={pay}
              disabled={state === "paying"}
              className="font-display pop mt-5 w-full rounded-full border-2 border-ink bg-forest py-3 text-base font-bold text-cream shadow-pop-sm disabled:opacity-70"
            >
              {state === "paying" ? "Processing…" : "Pay with card (demo)"}
            </button>
            <p className="mt-3 text-center text-xs font-semibold text-stone">
              Demo only, no real payment. No card details are collected.
            </p>
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
