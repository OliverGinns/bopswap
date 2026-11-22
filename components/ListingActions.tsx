"use client";

import { useState } from "react";
import { Listing, SOURCE_LABEL } from "@/lib/seed";
import HandoverModal from "./HandoverModal";

export default function ListingActions({ listing: l }: { listing: Listing }) {
  const [open, setOpen] = useState(false);

  if (l.external) {
    return (
      <div className="rounded-2xl border border-white/10 bg-navy-2 p-4 text-sm text-white/70">
        This item is listed on <strong className="text-white">{SOURCE_LABEL[l.source]}</strong> and ships in{" "}
        {l.delivery}. No same-day handover — find a local listing for that.
      </div>
    );
  }

  if (l.sellerType === "charity" && l.shop) {
    return (
      <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-4 text-sm">
        <p className="text-lg font-extrabold text-green-400">🏪 {l.shop.pickupNote}</p>
        <p className="mt-1 text-white/70">
          {l.shop.address} · {l.shop.hours}. Just ask for it at the counter. No handover slot or express fee.
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-full bg-pink py-4 text-lg font-extrabold shadow-lg shadow-pink/30 transition hover:brightness-110"
      >
        🤝 Request handover
      </button>
      {open && <HandoverModal listing={l} onClose={() => setOpen(false)} />}
    </>
  );
}
