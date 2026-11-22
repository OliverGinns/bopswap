"use client";

import Link from "next/link";
import { useState } from "react";
import { MyListing, MyStatus } from "@/lib/myListings";
import { formatPrice } from "@/lib/seed";
import { softFill } from "@/lib/theme";

const STATUS_CHIP: Record<MyStatus, string> = {
  Live: "bg-leaf text-ink",
  Reserved: "bg-mustard text-ink",
  Swapped: "bg-sage text-forest",
};

/** Grid of the user's own listings. `onDelete` enables the delete control (no editing, by design). */
export default function MyListingsGrid({ items, onDelete, onDeleted }: { items: MyListing[]; onDelete?: (id: string) => void; onDeleted?: (title: string) => void }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ listing: l, status, views, offers, demo }) => {
        const body = (
          <div
            className="relative flex aspect-[16/9] items-center justify-center overflow-hidden border-b-2 border-ink text-5xl"
            style={{ background: softFill(l.id) }}
          >
            {l.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.imageUrl} alt={l.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span aria-hidden>{l.imageEmoji}</span>
            )}
            <span className={`absolute left-2 top-2 rounded-full border border-ink px-2.5 py-0.5 text-xs font-bold ${STATUS_CHIP[status]}`}>{status}</span>
          </div>
        );
        return (
          <li key={l.id} className="flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-pop">
            {demo ? body : <Link href={`/listing/${l.id}`}>{body}</Link>}
            <div className="flex flex-1 flex-col gap-1 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display min-w-0 truncate text-base font-semibold">{l.title}</h3>
                <span className="shrink-0 text-sm font-bold text-forest">{l.swapOrPrice === "swap" ? "🔁 Swap" : formatPrice(l.swapOrPrice)}</span>
              </div>
              <p className="text-xs font-semibold text-ink/70">
                👀 {views} views · 💬 {offers} offer{offers === 1 ? "" : "s"}
              </p>
              {onDelete && (
                <div className="mt-auto pt-1 text-xs font-bold">
                  {confirmId === l.id ? (
                    <span className="flex items-center gap-3">
                      <span className="text-ink/75">Delete this listing?</span>
                      <button
                        onClick={() => {
                          onDelete(l.id);
                          onDeleted?.(l.title);
                          setConfirmId(null);
                        }}
                        className="text-coral underline-offset-2 hover:underline"
                      >
                        Yes, delete
                      </button>
                      <button onClick={() => setConfirmId(null)} className="text-ink/60 underline-offset-2 hover:underline">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmId(l.id)} aria-label={`Delete ${l.title}`} className="text-coral underline-offset-2 hover:underline">
                      🗑 Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
