"use client";

import Link from "next/link";
import { Listing, SOURCE_LABEL, distanceInfo, formatPrice } from "@/lib/seed";
import { sourceKind } from "@/lib/plan";
import { softFill } from "@/lib/theme";
import type { Choice } from "./types";
import RatingBadge from "../RatingBadge";

interface Props {
  l: Listing;
  reason: string;
  saved: boolean;
  selected: boolean;
  /** This user's choice for the slot, if it is this listing. */
  chosen?: Choice;
  onSave: () => void;
  onSelect: () => void;
  onHover: (id: string | null) => void;
  onMain: () => void;
  onSwap: () => void;
  onOffer: () => void;
}

const BADGE = {
  student: { text: "🎓 Student", cls: "bg-coral text-ink" },
  charity: { text: "💚 Charity shop", cls: "bg-leaf text-ink" },
  online: { text: "📦 Online", cls: "bg-cream text-ink" },
} as const;

/** Big, Vinted-style photo card. Photos fall back to a pastel tile with the item's emoji. */
export default function ProductCard({ l, reason, saved, selected, chosen, onSave, onSelect, onHover, onMain, onSwap, onOffer }: Props) {
  const kind = sourceKind(l);
  const d = distanceInfo(l);
  const badge = BADGE[kind];
  const isSwap = l.swapOrPrice === "swap";
  const mainLabel =
    kind === "charity" ? "🏪 Pick up today" : kind === "online" ? `📦 Order online · ${l.delivery ?? "2-4 days"}` : "🤝 Request handover";

  return (
    <article
      id={`plan-card-${l.id}`}
      onMouseEnter={() => onHover(l.id)}
      onMouseLeave={() => onHover(null)}
      className={`flex scroll-mt-2 flex-col overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-pop transition ${
        selected ? "ring-4 ring-mustard" : ""
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect())}
        aria-label={`${l.title}: show on map`}
        className="relative flex h-[72px] cursor-pointer items-center justify-center text-3xl sm:h-20"
        style={{ background: softFill(l.id) }}
      >
        {l.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.imageUrl} alt={l.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="drop-shadow-md">{l.imageEmoji}</span>
        )}
        <span
          className={`absolute left-1.5 top-1.5 rounded-full border-2 border-ink px-1.5 text-[11px] leading-4 font-bold ${
            isSwap ? "bg-mustard text-ink" : "bg-cream text-ink"
          }`}
        >
          {isSwap ? "🔁 Swap" : formatPrice(l.swapOrPrice)}
        </span>
        <span className={`absolute right-1.5 top-1.5 rounded-full border-2 border-ink px-1.5 text-[10px] leading-4 font-bold ${badge.cls}`}>
          {kind === "online" ? `📦 ${SOURCE_LABEL[l.source]}` : badge.text}
        </span>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? `Unsave ${l.title}` : `Save ${l.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className="pop absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-cream text-base shadow-pop-sm"
        >
          <span className={saved ? "text-coral" : "text-stone"}>{saved ? "♥" : "♡"}</span>
        </button>
        {chosen && (
          <span className="absolute bottom-1.5 left-1.5 rounded-full border-2 border-ink bg-forest px-2 py-0.5 text-[11px] font-bold text-cream">
            ✓ {chosen.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display line-clamp-1 text-[13px] font-bold leading-tight">{l.title}</h3>
          <Link href={`/listing/${l.id}`} className="shrink-0 text-[11px] font-bold text-forest hover:underline">
            Details
          </Link>
        </div>
        <p className="truncate text-xs text-stone">
          Size {l.size} · {l.condition}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-stone">
          <span className="min-w-0 truncate">{l.sellerName}</span>
          <RatingBadge listing={l} className="shrink-0" />
        </p>
        <p className="truncate text-xs font-semibold text-ink/75">
          {d ? (
            <>
              📍 {d.label} · 🚶 {d.walkMins} min walk
            </>
          ) : (
            <>🚚 Delivery {l.delivery ?? "2-4 days"}</>
          )}
        </p>
        <p className="line-clamp-1 rounded-md bg-sage px-1.5 py-0.5 text-xs font-medium leading-snug text-forest">✨ {reason}</p>

        <div className="mt-auto space-y-1 pt-1">
          <button
            type="button"
            onClick={onMain}
            className={`pop min-h-7 w-full rounded-full border-2 border-ink py-1 text-xs font-bold shadow-pop-sm ${
              chosen && ["handover", "pickup", "online"].includes(chosen.kind) ? "bg-forest text-cream" : "bg-mustard text-ink"
            }`}
          >
            {chosen && ["handover", "pickup", "online"].includes(chosen.kind) ? `✓ ${chosen.label}` : mainLabel}
          </button>
          {kind === "student" && (
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={onSwap}
                className="pop min-h-7 rounded-full border-2 border-ink bg-canvas py-1 text-xs font-bold"
              >
                🔁 Swap
              </button>
              <button
                type="button"
                onClick={onOffer}
                className="pop min-h-7 rounded-full border-2 border-ink bg-canvas py-1 text-xs font-bold"
              >
                £ Offer
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
