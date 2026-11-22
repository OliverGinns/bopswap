"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Offer,
  OfferStatus,
  TYPE_LABEL,
  completeOffers,
  gbp,
  isActive,
  offerDetail,
  offerWhen,
  retractOffer,
  useOffers,
} from "@/lib/offers";
import { planRoute } from "@/lib/route";
import { Listing } from "@/lib/seed";
import { softFill } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { useListings } from "@/lib/useListings";
import { useWardrobe } from "@/lib/useWardrobe";
import { WardrobeItem } from "@/lib/wardrobe";
import MapLoader from "./MapLoader";
import WardrobeThumb from "./WardrobeThumb";

const STATUS_STYLE: Record<OfferStatus, { label: string; chip: string }> = {
  pending: { label: "⏳ Pending", chip: "bg-mustard text-ink" },
  accepted: { label: "✅ Accepted", chip: "bg-leaf text-ink" },
  completed: { label: "🌱 Completed", chip: "bg-sage text-forest" },
  retracted: { label: "Retracted", chip: "bg-canvas text-stone" },
};

const GROUPS: { status: OfferStatus; title: string }[] = [
  { status: "accepted", title: "Accepted" },
  { status: "pending", title: "Waiting for a reply" },
  { status: "completed", title: "Completed" },
  { status: "retracted", title: "Retracted" },
];

export default function BasketClient() {
  const { offers, ready } = useOffers();
  const { byId } = useListings();
  const { items: wardrobe } = useWardrobe();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Offer | null>(null);
  const [success, setSuccess] = useState<{ parcels: number; items: number } | null>(null);

  const active = useMemo(() => offers.filter(isActive), [offers]);
  const mapListings = useMemo(
    () => active.map((o) => byId(o.listingId)).filter((l): l is Listing => !!l && !l.external),
    [active, byId]
  );
  const statusById = useMemo(() => {
    const m: Record<string, "pending" | "accepted"> = {};
    for (const o of active) m[o.listingId] = o.status as "pending" | "accepted";
    return m;
  }, [active]);

  const route = useMemo(() => planRoute(mapListings), [mapListings]);
  const cash = active.reduce((s, o) => s + o.amount, 0);
  const toCollect = active.filter((o) => o.type !== "online").length;
  const deliveries = active.length - toCollect;

  // Drop a selection whose offer went away.
  useEffect(() => {
    if (selectedId && !mapListings.some((l) => l.id === selectedId)) queueMicrotask(() => setSelectedId(null));
  }, [selectedId, mapListings]);

  const confirmAll = () => {
    const ids = active.map((o) => o.id);
    setSuccess({ parcels: toCollect, items: ids.length });
    completeOffers(ids);
  };

  const doRetract = () => {
    if (!confirming) return;
    const l = byId(confirming.listingId);
    retractOffer(confirming.id);
    toast(`Offer retracted${l ? ` for ${l.title}` : ""}. The map's updated.`);
    setConfirming(null);
  };

  if (success) return <SuccessScreen parcels={success.parcels} items={success.items} />;

  // Nothing but retracted offers (or none at all) -> friendly empty state.
  const empty = ready && !offers.some((o) => o.status !== "retracted");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5">
      <h1 className="font-display text-3xl font-bold tracking-tight">Your handover plan</h1>
      <p className="mt-1 text-ink/75">Everything you&apos;ve offered on, in one walk. Same-day, no delivery.</p>

      {empty ? (
        <EmptyState />
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)]">
          <div className="space-y-6">
            {GROUPS.map(({ status, title }) => {
              const list = offers.filter((o) => o.status === status);
              if (!list.length) return null;
              return (
                <section key={status} aria-label={title}>
                  <h2 className="font-display mb-2 text-lg font-bold">
                    {title} <span className="text-stone">({list.length})</span>
                  </h2>
                  <ul className="space-y-3">
                    {list.map((o) => (
                      <OfferRow
                        key={o.id}
                        offer={o}
                        listing={byId(o.listingId)}
                        wardrobeItem={wardrobe.find((w) => w.id === o.swapWardrobeItemId)}
                        onRetract={() => setConfirming(o)}
                        onShow={() => setSelectedId(o.listingId)}
                        selected={selectedId === o.listingId}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border-2 border-ink bg-cream p-4 shadow-pop">
              <h2 className="font-display text-lg font-bold">Summary</h2>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Stat label="Total cash" value={gbp(cash)} />
                <Stat label="Items to collect" value={String(toCollect)} />
                <Stat label="Walking time" value={`${route.totalMins} min`} />
              </dl>
              {deliveries > 0 && (
                <p className="mt-2 text-xs text-stone">+ {deliveries} online order{deliveries === 1 ? "" : "s"} shipping separately.</p>
              )}
              <button
                onClick={confirmAll}
                disabled={active.length === 0}
                className="font-display pop mt-4 w-full rounded-full border-2 border-ink bg-forest py-3 text-base font-bold text-cream shadow-pop-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Confirm all handovers
              </button>
              <p className="mt-2 text-center text-xs text-stone">Demo only: nothing is sent or charged.</p>
            </div>

            <div className="h-[380px] lg:h-[420px]">
              <MapLoader
                listings={mapListings}
                selectedId={selectedId}
                onSelect={setSelectedId}
                statusById={statusById}
                emptyHint="No active offers to map. Retracted and completed items are hidden."
              />
            </div>
            <p className="flex flex-wrap items-center gap-3 text-xs font-semibold text-ink/75">
              <Legend colour="#E9B949" label="Pending" />
              <Legend colour="#5B9A5B" label="Accepted" />
              <span>Dashed line = your walking route</span>
            </p>
          </aside>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4" onClick={() => setConfirming(null)}>
          <div
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border-2 border-ink bg-cream p-6 text-center shadow-pop"
          >
            <p className="text-4xl">🤔</p>
            <h2 className="font-display mt-2 text-xl font-bold">Retract this offer?</h2>
            <p className="mt-1 text-sm text-ink/75">
              {byId(confirming.listingId)?.title ?? "This item"} will come off your handover plan.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirming(null)} className="font-display flex-1 rounded-full border-2 border-ink bg-canvas py-2.5 font-semibold">
                Keep it
              </button>
              <button onClick={doRetract} className="font-display pop flex-1 rounded-full border-2 border-ink bg-coral py-2.5 font-semibold text-cream shadow-pop-sm">
                Retract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OfferRow({
  offer: o,
  listing: l,
  wardrobeItem,
  onRetract,
  onShow,
  selected,
}: {
  offer: Offer;
  listing: Listing | undefined;
  wardrobeItem: WardrobeItem | undefined;
  onRetract: () => void;
  onShow: () => void;
  selected: boolean;
}) {
  const st = STATUS_STYLE[o.status];
  const canMap = isActive(o) && o.type !== "online" && !!l && l.lat != null;
  return (
    <li
      className={`flex gap-3 rounded-2xl border-2 border-ink bg-cream p-3 shadow-pop ${o.status === "retracted" ? "opacity-60" : ""} ${
        selected ? "ring-4 ring-mustard" : ""
      }`}
    >
      <div
        className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-ink text-4xl"
        style={{ background: softFill(o.listingId) }}
      >
        {l?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.imageUrl} alt={l.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span aria-hidden>{l?.imageEmoji ?? "👚"}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display min-w-0 truncate text-base font-semibold">{l?.title ?? "Listing"}</h3>
          <span className={`shrink-0 rounded-full border border-ink px-2 py-0.5 text-[11px] font-bold ${st.chip}`}>{st.label}</span>
        </div>
        <p className="text-xs text-stone">
          {TYPE_LABEL[o.type]} · {l ? (l.sellerType === "charity" ? `💚 ${l.sellerName}` : l.sellerName) : "Seller"}
          {l?.college ? ` · ${l.college}` : ""}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
          {o.type === "swap" && wardrobeItem && <WardrobeThumb item={wardrobeItem} className="h-6 w-6 shrink-0 rounded-full border border-ink text-xs" />}
          <span className="min-w-0 truncate">{offerDetail(o, l, wardrobeItem)}</span>
        </p>
        <p className="text-xs font-semibold text-forest">🕒 {offerWhen(o, l)}</p>
        {isActive(o) && (
          <div className="mt-2 flex gap-3 text-xs font-bold">
            <button onClick={onRetract} className="text-coral underline-offset-2 hover:underline">
              Retract
            </button>
            {canMap && (
              <button onClick={onShow} className="text-forest underline-offset-2 hover:underline">
                Show on map
              </button>
            )}
            {l && (
              <Link href={`/listing/${l.id}`} className="text-ink/60 underline-offset-2 hover:underline">
                View listing
              </Link>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-ink bg-mist px-1 py-2">
      <dd className="font-display text-xl font-bold text-forest">{value}</dd>
      <dt className="text-[11px] font-semibold text-ink/70">{label}</dt>
    </div>
  );
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full border border-ink" style={{ background: colour }} />
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-8 max-w-md rounded-3xl border-2 border-ink bg-cream p-10 text-center shadow-pop">
      <p className="text-6xl">🧺</p>
      <h2 className="font-display mt-3 text-xl font-bold">Nothing in your basket yet</h2>
      <p className="mt-1 text-ink/75">Plan an outfit, make an offer, and your same-day handover route will show up here.</p>
      <Link href="/plan" className="font-display pop mt-5 inline-block rounded-full border-2 border-ink bg-mustard px-6 py-2.5 font-bold shadow-pop-sm">
        Plan an outfit →
      </Link>
    </div>
  );
}

function SuccessScreen({ parcels, items }: { parcels: number; items: number }) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
      <div className="rounded-3xl border-2 border-ink bg-cream p-10 shadow-pop">
        <p className="text-7xl">🎉</p>
        <h1 className="font-display mt-3 text-3xl font-bold">All handovers confirmed!</h1>
        <p className="font-display mt-4 text-4xl font-bold text-forest">
          {parcels} parcel{parcels === 1 ? "" : "s"} avoided 🌱
        </p>
        <p className="mt-3 text-ink/75">
          {items} item{items === 1 ? "" : "s"} sorted. Enjoy the bop, you&apos;ll look great.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/profile" className="font-display pop rounded-full border-2 border-ink bg-forest px-5 py-2.5 font-semibold text-cream shadow-pop-sm">
            See your impact
          </Link>
          <Link href="/plan" className="font-display pop rounded-full border-2 border-ink bg-mustard px-5 py-2.5 font-semibold shadow-pop-sm">
            Plan another outfit
          </Link>
        </div>
      </div>
    </div>
  );
}
