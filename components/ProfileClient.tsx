"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Offer, TYPE_LABEL, gbp, offerDetail, retailEstimate, useOffers } from "@/lib/offers";
import { useMyListings } from "@/lib/myListings";
import { USER_RATING } from "@/lib/seed";
import { softFill } from "@/lib/theme";
import { useListings } from "@/lib/useListings";
import { useWardrobe } from "@/lib/useWardrobe";
import { DEMO_USER } from "@/lib/wardrobe";
import MyListingsGrid from "./MyListingsGrid";
import RatingBadge from "./RatingBadge";
import WardrobeThumb from "./WardrobeThumb";

// Plausible history for the demo user; live counts from offers are added on top.
const BASE = { swaps: 12, listed: 4, parcels: 14, saved: 86 };
const SINCE = "October 2026";
const KG_PER_PARCEL = 0.5; // ASSUMPTION, labelled in the UI

const REVIEW_TAGS = [
  { tag: "On time", n: 11 },
  { tag: "Friendly", n: 9 },
  { tag: "Great condition", n: 7 },
  { tag: "Easy swap", n: 5 },
];

// Fixed demo reviews.
const REVIEWS = [
  { who: "Maya P.", college: "Keble", stars: 5, text: "Turned up bang on time and the jacket was exactly as described. Easy swap!" },
  { who: "Zara A.", college: "Somerville", stars: 5, text: "Super friendly, we sorted the handover outside the lodge in two minutes." },
  { who: "Tom W.", college: "Balliol", stars: 4, text: "Great condition, a bit of a walk but worth it for the shell suit." },
];

const TABS = ["wardrobe", "listings", "offers"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = { wardrobe: "My wardrobe", listings: "My listings", offers: "My offers" };

const STATUS_CHIP: Record<Offer["status"], string> = {
  pending: "bg-mustard text-ink",
  accepted: "bg-leaf text-ink",
  completed: "bg-sage text-forest",
  retracted: "bg-canvas text-stone",
};

export default function ProfileClient() {
  const [tab, setTab] = useState<Tab>("wardrobe");
  const { offers } = useOffers();
  const { items: wardrobe } = useWardrobe();
  const { items: mine, remove } = useMyListings();
  const { byId } = useListings();

  const stats = useMemo(() => {
    const done = offers.filter((o) => o.status === "completed");
    const local = done.filter((o) => o.type !== "online");
    const swaps = local.filter((o) => o.type === "swap" || o.amount === 0).length;
    const saved = local.reduce((s, o) => s + Math.max(0, retailEstimate(byId(o.listingId)) - o.amount), 0);
    return {
      swaps: BASE.swaps + swaps,
      listed: BASE.listed + mine.length,
      parcels: BASE.parcels + local.length,
      saved: BASE.saved + saved,
    };
  }, [offers, mine.length, byId]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-6">
      <section className="flex flex-wrap items-center gap-5 rounded-3xl border-2 border-ink bg-cream p-5 shadow-pop">
        <div
          aria-hidden
          className="font-display flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-mustard text-4xl font-bold shadow-pop"
        >
          {DEMO_USER.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold tracking-tight">{DEMO_USER}</h1>
          <p className="font-semibold text-ink/75">🎓 St Anne&apos;s College, Oxford</p>
          <p className="text-sm text-stone">Swapper since {SINCE}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RatingBadge rating={USER_RATING} className="px-2 py-0.5 text-xs" />
            <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-sage px-2 py-0.5 text-xs font-bold text-forest">
              <span aria-hidden>✓</span> Verified student
            </span>
          </div>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Review tags">
            {REVIEW_TAGS.map((t) => (
              <li key={t.tag} className="rounded-full border border-ink bg-canvas px-2.5 py-0.5 text-xs font-semibold">
                {t.tag} <span className="text-stone">×{t.n}</span>
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto lg:min-w-[520px]">
          <Stat label="Swaps done" value={String(stats.swaps)} />
          <Stat label="Items listed" value={String(stats.listed)} />
          <Stat label="Parcels avoided" value={String(stats.parcels)} />
          <Stat label="£ saved (est.)" value={`£${stats.saved}`} />
        </dl>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="Your stuff">
          <div role="tablist" className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`font-display rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition ${
                  tab === t ? "border-ink bg-forest text-cream shadow-pop-sm" : "border-ink bg-cream hover:bg-sage"
                }`}
              >
                {TAB_LABEL[t]}
                <span className="ml-1.5 opacity-70">
                  {t === "wardrobe" ? wardrobe.length : t === "listings" ? mine.length : offers.length}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            {tab === "wardrobe" && (
              <>
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {wardrobe.map((w) => (
                    <li key={w.id} className="overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-pop-sm">
                      <WardrobeThumb item={w} className="aspect-square text-4xl" />
                      <p className="font-display line-clamp-1 border-t-2 border-ink px-2 py-1.5 text-xs font-semibold">{w.name}</p>
                    </li>
                  ))}
                </ul>
                <Link href="/wardrobe" className="font-display mt-3 inline-block text-sm font-semibold text-forest underline-offset-4 hover:underline">
                  Manage wardrobe →
                </Link>
              </>
            )}
            {tab === "listings" && (
              <>
                <MyListingsGrid items={mine} onDelete={remove} />
                <Link href="/sell" className="font-display mt-3 inline-block text-sm font-semibold text-forest underline-offset-4 hover:underline">
                  Add a listing →
                </Link>
              </>
            )}
            {tab === "offers" &&
              (offers.length === 0 ? (
                <div className="rounded-2xl border-2 border-ink bg-cream p-8 text-center shadow-pop">
                  <p className="text-4xl">🤝</p>
                  <p className="font-display mt-2 font-semibold">No offers yet.</p>
                  <Link href="/plan" className="mt-3 inline-block font-display text-sm font-semibold text-forest underline-offset-4 hover:underline">
                    Plan an outfit →
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {offers.map((o) => {
                    const l = byId(o.listingId);
                    return (
                      <li key={o.id} className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-cream p-2.5 shadow-pop-sm">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-ink text-2xl"
                          style={{ background: softFill(o.listingId) }}
                        >
                          {l?.imageEmoji ?? "👚"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display truncate text-sm font-semibold">{l?.title ?? "Listing"}</p>
                          <p className="truncate text-xs text-stone">
                            {TYPE_LABEL[o.type]} · {offerDetail(o, l, wardrobe.find((w) => w.id === o.swapWardrobeItemId))}
                          </p>
                          {l && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone">
                              <span className="truncate">{l.sellerName}</span>
                              <RatingBadge listing={l} className="shrink-0" />
                            </p>
                          )}
                        </div>
                        <span className={`shrink-0 rounded-full border border-ink px-2 py-0.5 text-[11px] font-bold capitalize ${STATUS_CHIP[o.status]}`}>
                          {o.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ))}
          </div>
        </section>

        <aside className="space-y-4 lg:self-start">
          <div className="rounded-2xl border-2 border-ink bg-leaf/60 p-5 text-center shadow-pop">
            <p className="text-4xl">🌱</p>
            <p className="font-display mt-1 text-lg font-bold">You&apos;ve avoided {stats.parcels} deliveries</p>
            <p className="mt-1 text-sm text-ink/80">
              ≈ {(stats.parcels * KG_PER_PARCEL).toFixed(1)} kg of delivery CO₂ kept out of the air.
            </p>
            <p className="mt-2 text-[11px] text-ink/60">Assumption: ~{KG_PER_PARCEL} kg CO₂ per parcel. Not a measured figure.</p>
          </div>
          <div className="rounded-2xl border-2 border-ink bg-cream p-4 shadow-pop-sm">
            <h2 className="font-display font-semibold">Recent reviews</h2>
            <ul className="mt-2 space-y-3">
              {REVIEWS.map((r) => (
                <li key={r.who} className="text-sm">
                  <p className="flex items-center justify-between gap-2 font-semibold">
                    <span>
                      {r.who} <span className="text-xs font-normal text-stone">· {r.college}</span>
                    </span>
                    <span className="text-xs" aria-label={`${r.stars} out of 5`}>
                      {"⭐".repeat(r.stars)}
                    </span>
                  </p>
                  <p className="text-ink/75">&ldquo;{r.text}&rdquo;</p>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/basket"
            className="pop flex items-center justify-between rounded-2xl border-2 border-ink bg-cream p-4 shadow-pop-sm"
          >
            <span>
              <span className="font-display block font-semibold">Your handover plan</span>
              <span className="text-xs text-stone">
                {offers.filter((o) => o.status === "pending" || o.status === "accepted").length} active offers · {gbp(offers.filter((o) => o.status === "pending" || o.status === "accepted").reduce((s, o) => s + o.amount, 0))}
              </span>
            </span>
            <span aria-hidden className="text-xl">→</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-mist px-3 py-2.5 text-center">
      <dd className="font-display text-2xl font-bold text-forest">{value}</dd>
      <dt className="text-[11px] font-semibold text-ink/70">{label}</dt>
    </div>
  );
}
