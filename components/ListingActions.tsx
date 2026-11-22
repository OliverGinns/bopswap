"use client";

import { useState } from "react";
import { Listing, SOURCE_LABEL, formatPrice } from "@/lib/seed";
import { addOffer, gbp, useOffers, isActive } from "@/lib/offers";
import { toast } from "@/lib/toast";
import { useWardrobe } from "@/lib/useWardrobe";
import Link from "next/link";
import HandoverModal from "./HandoverModal";
import OfferModal from "./plan/OfferModal";

const btnMain = "pop w-full rounded-full border-2 border-ink bg-forest py-4 text-lg font-extrabold text-cream shadow-pop-sm";
const btnSub = "pop flex-1 rounded-full border-2 border-ink bg-mustard py-3 font-bold shadow-pop-sm";

export default function ListingActions({ listing: l }: { listing: Listing }) {
  const [modal, setModal] = useState<"handover" | "offer" | "swap" | null>(null);
  const { items: wardrobe } = useWardrobe();
  const { offers } = useOffers();
  const existing = offers.find((o) => o.listingId === l.id && isActive(o));
  const price = typeof l.swapOrPrice === "number" ? l.swapOrPrice : 0;

  const inBasket = existing && (
    <p className="rounded-2xl border-2 border-ink bg-sage p-3 text-sm font-semibold text-forest">
      ✅ In your basket ({existing.status}).{" "}
      <Link href="/basket" className="underline underline-offset-2">
        View handover plan →
      </Link>
    </p>
  );

  if (l.external) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-ink bg-cream p-4 text-sm text-ink/75">
          This item is listed on <strong className="text-ink">{SOURCE_LABEL[l.source]}</strong> and ships in {l.delivery}. No same-day handover, so
          find a local listing for that.
        </div>
        {inBasket}
        {!existing && (
          <button
            onClick={() => {
              addOffer({ listingId: l.id, type: "online", amount: price });
              toast(`Order added to your Basket: ${l.title}, arriving in ${l.delivery ?? "2-4 days"}.`);
            }}
            className={btnSub + " w-full"}
          >
            📦 Order online · {formatPrice(l.swapOrPrice)}
          </button>
        )}
      </div>
    );
  }

  if (l.sellerType === "charity" && l.shop) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-ink bg-sage p-4 text-sm">
          <p className="text-lg font-extrabold text-forest">🏪 {l.shop.pickupNote}</p>
          <p className="mt-1 text-ink/75">
            {l.shop.address} · {l.shop.hours}. Just ask for it at the counter. No handover slot or express fee.
          </p>
        </div>
        {inBasket}
        {!existing && (
          <button
            onClick={() => {
              addOffer({ listingId: l.id, type: "pickup", amount: price, slot: "Pick up in store today, until 5pm" });
              toast(`Reserved at ${l.sellerName}. It's in your Basket.`);
            }}
            className={btnMain}
          >
            🏪 Reserve for pickup
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {inBasket}
        <button onClick={() => setModal("handover")} className={btnMain}>
          🤝 Request handover
        </button>
        <div className="flex gap-3">
          {price > 0 && (
            <button onClick={() => setModal("offer")} className={btnSub}>
              💷 Make an offer
            </button>
          )}
          <button onClick={() => setModal("swap")} className={btnSub}>
            🔁 Offer a swap
          </button>
        </div>
      </div>
      {modal === "handover" && <HandoverModal listing={l} onClose={() => setModal(null)} />}
      {modal === "offer" && (
        <OfferModal
          mode="offer"
          listing={l}
          wardrobe={wardrobe}
          onClose={() => setModal(null)}
          onOffer={(amount) => {
            setModal(null);
            addOffer({ listingId: l.id, type: "cash", amount });
            toast(`Offer of ${gbp(amount)} sent to ${l.sellerName}. They usually reply within the hour.`);
          }}
        />
      )}
      {modal === "swap" && (
        <OfferModal
          mode="swap"
          listing={l}
          wardrobe={wardrobe}
          onClose={() => setModal(null)}
          onSwap={(item) => {
            setModal(null);
            addOffer({ listingId: l.id, type: "swap", swapWardrobeItemId: item.id });
            toast(`Swap offered: your ${item.name.toLowerCase()} for ${l.title.toLowerCase()}.`);
          }}
        />
      )}
    </>
  );
}
