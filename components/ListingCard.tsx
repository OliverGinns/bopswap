import { softFill } from "@/lib/theme";
import Link from "next/link";
import { Listing, SOURCE_LABEL, distanceInfo, formatPrice } from "@/lib/seed";

export default function ListingCard({ listing: l }: { listing: Listing }) {
  const d = distanceInfo(l);
  const isSwap = l.swapOrPrice === "swap";
  const isCharity = l.sellerType === "charity";
  return (
    <Link
      href={`/listing/${l.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-pop pop"
    >
      <div
        className="relative flex aspect-[16/9] items-center justify-center text-3xl"
        style={{ background: softFill(l.id) }}
      >
        {l.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.imageUrl} alt={l.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="drop-shadow-lg transition group-hover:scale-110">{l.imageEmoji}</span>
        )}
        <span
          className={`absolute left-1.5 top-1.5 rounded-full px-2 text-[11px] leading-5 font-bold ${
            isSwap ? "bg-mustard text-ink" : "bg-cream/95 text-ink"
          }`}
        >
          {isSwap ? "🔁 Swap" : formatPrice(l.swapOrPrice)}
        </span>
        {isCharity && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-leaf px-2 text-[11px] leading-5 font-bold text-ink">
            💚 Charity shop
          </span>
        )}
        {l.external && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-cream/95 px-2 text-[11px] leading-5 font-semibold text-ink/75">
            via {SOURCE_LABEL[l.source]}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2">
        <h3 className="line-clamp-1 text-[13px] font-bold">{l.title}</h3>
        <p className="text-xs text-stone">
          Size {l.size} · {l.condition}
        </p>
        {d ? (
          <>
            <p className="text-xs text-ink/75">
              📍 {d.label} · 🚶 {d.walkMins} min walk
            </p>
            <p className="text-xs text-stone">
              {l.sellerName}
              {isCharity ? "" : ` · ${l.college}`}
            </p>
            {isCharity ? (
              <span className="mt-auto w-fit rounded-full bg-sage px-2 py-0.5 text-xs font-bold text-forest">
                🏪 Pick up today, open till 5pm
              </span>
            ) : (
              <span className="mt-auto w-fit rounded-full bg-sage px-2 py-0.5 text-xs font-bold text-forest">
                ⚡ Same-day handover
              </span>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-ink/75">
              {formatPrice(l.swapOrPrice)} · 📦 Delivery {l.delivery}
            </p>
            <p className="text-xs text-stone">External listing · {SOURCE_LABEL[l.source]}</p>
          </>
        )}
      </div>
    </Link>
  );
}
