"use client";

import { useEffect, useMemo } from "react";
import { acceptOffer, useOffers } from "@/lib/offers";
import { getListing } from "@/lib/seed";
import { toast, useToast } from "@/lib/toast";

/**
 * Mounted once in the root layout. Plays the seller: pending student offers flip to accepted at their
 * `acceptAt` time (on any page, and after a reload), and the global toast is rendered here.
 */
export default function OfferEngine() {
  const { offers } = useOffers();
  const message = useToast();

  const pending = useMemo(
    () => offers.filter((o) => o.status === "pending" && o.acceptAt).map((o) => ({ id: o.id, at: o.acceptAt!, listingId: o.listingId })),
    [offers]
  );
  const key = pending.map((p) => p.id).join(",");

  useEffect(() => {
    const timers = pending.map((p) =>
      setTimeout(() => {
        acceptOffer(p.id);
        const l = getListing(p.listingId);
        toast(l ? `🎉 ${l.sellerName} accepted your offer for ${l.title}. Check your Basket.` : "🎉 A seller accepted your offer. Check your Basket.");
      }, Math.max(0, p.at - Date.now()))
    );
    return () => timers.forEach(clearTimeout);
    // `key` captures the set of pending ids; absolute acceptAt times make rescheduling safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-end px-4 sm:px-6">
      <div
        key={message.id}
        role="status"
        className="pop-in max-w-lg rounded-2xl border-2 border-ink bg-ink px-5 py-3 text-center text-sm font-semibold text-cream shadow-pop"
      >
        {message.text}
      </div>
    </div>
  );
}
