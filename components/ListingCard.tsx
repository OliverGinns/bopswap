import Link from "next/link";
import { Listing, SOURCE_LABEL, distanceInfo, formatPrice } from "@/lib/seed";

export default function ListingCard({ listing: l }: { listing: Listing }) {
  const d = distanceInfo(l);
  const isSwap = l.swapOrPrice === "swap";
  const isCharity = l.sellerType === "charity";
  return (
    <Link
      href={`/listing/${l.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-navy-2 transition hover:-translate-y-1 hover:border-pink/60"
    >
      <div
        className="relative flex aspect-square items-center justify-center text-7xl"
        style={{ background: `linear-gradient(135deg, ${l.gradient[0]}, ${l.gradient[1]})` }}
      >
        <span className="drop-shadow-lg transition group-hover:scale-110">{l.imageEmoji}</span>
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
            isSwap ? "bg-yellow text-navy" : "bg-navy/80 text-white"
          }`}
        >
          {isSwap ? "🔁 Swap" : formatPrice(l.swapOrPrice)}
        </span>
        {isCharity && (
          <span className="absolute right-3 top-3 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-navy">
            💚 Charity shop
          </span>
        )}
        {l.external && (
          <span className="absolute right-3 top-3 rounded-full bg-navy/80 px-3 py-1 text-xs font-semibold text-white/90">
            via {SOURCE_LABEL[l.source]}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-bold">{l.title}</h3>
        <p className="text-xs text-white/60">
          Size {l.size} · {l.condition}
        </p>
        {d ? (
          <>
            <p className="text-sm text-white/80">
              📍 {d.label} · 🚶 {d.walkMins} min walk
            </p>
            <p className="text-xs text-white/50">
              {l.sellerName}
              {isCharity ? "" : ` · ${l.college}`}
            </p>
            {isCharity ? (
              <span className="mt-auto w-fit rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-400">
                🏪 Pick up today, open till 5pm
              </span>
            ) : (
              <span className="mt-auto w-fit rounded-full bg-pink/15 px-3 py-1 text-xs font-bold text-pink">
                ⚡ Same-day handover
              </span>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-white/80">
              {formatPrice(l.swapOrPrice)} · 📦 Delivery {l.delivery}
            </p>
            <p className="text-xs text-white/50">External listing · {SOURCE_LABEL[l.source]}</p>
          </>
        )}
      </div>
    </Link>
  );
}
