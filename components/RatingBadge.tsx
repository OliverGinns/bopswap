import { Listing, Rating, ratingFor } from "@/lib/seed";

/** Small "⭐ 4.8 · 23 swaps" pill. Pass a listing (seller rating) or an explicit rating. */
export default function RatingBadge({ listing, rating, className = "" }: { listing?: Listing; rating?: Rating; className?: string }) {
  const r = rating ?? (listing ? ratingFor(listing) : null);
  if (!r) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mustard/30 px-1.5 py-px text-[11px] font-bold leading-4 text-ink ${className}`}
      title={`${r.rating.toFixed(1)} out of 5 from ${r.count} ${r.unit}`}
    >
      <span aria-hidden>⭐</span>
      {r.rating.toFixed(1)} · {r.count} {r.unit}
    </span>
  );
}
