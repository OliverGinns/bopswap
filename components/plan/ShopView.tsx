"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OutfitPiece } from "@/lib/botTypes";
import {
  Filters,
  NO_FILTERS,
  SortMode,
  applyFilters,
  candidatesFor,
  filterChips,
  interpretRefinement,
  isWarm,
  ownedItemFor,
  pieceEmoji,
  priceOf,
  reasonFor,
  themeOf,
  tokenize,
} from "@/lib/plan";
import { addOffer, retractOffer } from "@/lib/offers";
import type { RefineFilter, RefineReply } from "@/lib/refine";
import { Listing, SOURCE_LABEL, distanceInfo, formatPrice } from "@/lib/seed";
import type { WardrobeItem } from "@/lib/wardrobe";
import HandoverModal from "../HandoverModal";
import MapLoader from "../MapLoader";
import DockChat from "./DockChat";
import OfferModal from "./OfferModal";
import ProductCard from "./ProductCard";
import type { Choice, UiMsg } from "./types";

interface Props {
  pieces: OutfitPiece[];
  all: Listing[];
  byId: (id: string) => Listing | undefined;
  wardrobe: WardrobeItem[];
  budget?: number;
  msgs: UiMsg[];
  /** The look the user picked (title, vibe, pieces), if known. */
  look?: { title: string; vibe: string };
  onExchange: (user: string, bot: string) => void;
}

const gbp = (n: number) => `£${n.toFixed(2).replace(/\.00$/, "")}`;
const SORTS: { id: SortMode; label: string }[] = [
  { id: "best", label: "Best" },
  { id: "cheapest", label: "Cheapest" },
  { id: "closest", label: "Closest" },
];

type Modal = { kind: "handover"; l: Listing; slot: number } | { kind: "swap" | "offer"; l: Listing; slot: number } | null;

/** Phase 2: outfit bar on top, scrolling feed + live map, sticky summary, docked BopBot. */
export default function ShopView({ pieces, all, byId, wardrobe, budget, msgs, look, onExchange }: Props) {
  const theme = useMemo(() => themeOf(pieces, byId), [pieces, byId]);

  const slots = useMemo(
    () =>
      pieces.map((p) => {
        const isOwned = p.status === "have";
        return { piece: p, isOwned, owned: isOwned ? ownedItemFor(p.piece, wardrobe) : undefined, cands: candidatesFor(p, all, theme) };
      }),
    [pieces, all, wardrobe, theme]
  );
  const ownedForOutfit = useMemo(() => slots.map((s) => s.owned).filter((w): w is WardrobeItem => !!w), [slots]);

  const [active, setActive] = useState(() => Math.max(0, slots.findIndex((s) => !s.isOwned)));
  const [filters, setFilters] = useState<Filters>({ ...NO_FILTERS, maxPrice: budget });
  const [choices, setChoices] = useState<Record<number, Choice>>({});
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tab, setTab] = useState<"feed" | "map">("feed");
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [dockOpen, setDockOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  // Live-bot output: a best-first order for one slot, plus per-listing reasons. Never required for the feed to work.
  const [ranking, setRanking] = useState<{ slot: number; ids: string[] } | null>(null);
  const [aiReasons, setAiReasons] = useState<Record<string, string>>({});
  const dockRun = useRef(0);

  const feedRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingScroll = useRef<string | null>(null);

  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    dockRun.current++;
  }, []);

  const say = useCallback((text: string) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }, []);

  const visible = useMemo(
    () =>
      slots.map((s, i) => {
        const list = applyFilters(s.cands, filters);
        if (!ranking || ranking.slot !== i || filters.sort !== "best") return list;
        const pos = new Map(ranking.ids.map((id, k) => [id, k]));
        return [...list].sort((a, b) => (pos.get(a.listing.id) ?? 1e6) - (pos.get(b.listing.id) ?? 1e6)); // stable: unranked keep their order
      }),
    [slots, filters, ranking]
  );
  const feed = useMemo(() => visible[active] ?? [], [visible, active]);
  const slot = slots[active];

  const cheapestId = useMemo(() => {
    const priced = feed.filter((c) => priceOf(c.listing) > 0);
    return priced.length > 1 ? [...priced].sort((a, b) => priceOf(a.listing) - priceOf(b.listing))[0].listing.id : undefined;
  }, [feed]);
  const closestId = useMemo(() => {
    const local = feed.filter((c) => distanceInfo(c.listing));
    return local.length > 1 ? [...local].sort((a, b) => distanceInfo(a.listing)!.metres - distanceInfo(b.listing)!.metres)[0].listing.id : undefined;
  }, [feed]);

  const mapListings = useMemo(() => feed.map((c) => c.listing).filter((l) => !l.external), [feed]);

  const clearAll = () => {
    setFilters({ sort: "best" });
    setRanking(null);
  };

  const selectSlot = (i: number) => {
    setActive(i);
    setSelectedId(null);
    setHoverId(null);
    feedRef.current?.scrollTo({ top: 0 });
  };

  // Pin click -> scroll the feed to that card (on mobile, once the Feed tab is showing).
  const onMapSelect = (id: string | null) => {
    setSelectedId(id);
    if (id) pendingScroll.current = id;
  };
  useEffect(() => {
    const id = pendingScroll.current;
    if (!id) return;
    const visibleFeed = window.matchMedia("(min-width: 1024px)").matches || tab === "feed";
    if (!visibleFeed) return;
    pendingScroll.current = null;
    document.getElementById(`plan-card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedId, tab]);

  // Every choice is also saved as an offer (shared with /basket). Replacing a slot's choice retracts the old offer.
  const choose = (i: number, c: Choice, toastText: string, extra?: { swapWardrobeItemId?: string }) => {
    const prev = choices[i]?.offerId;
    if (prev) retractOffer(prev);
    const type = c.kind === "offer" ? "cash" : c.kind;
    const slot = c.kind === "pickup" ? "Pick up in store today, until 5pm" : undefined;
    const offer = addOffer({ listingId: c.listingId, type, amount: c.cost, slot, swapWardrobeItemId: extra?.swapWardrobeItemId });
    setChoices((p) => ({ ...p, [i]: { ...c, offerId: offer.id } }));
    say(toastText);
  };

  const onMain = (l: Listing) => {
    if (l.external) {
      choose(active, { listingId: l.id, kind: "online", cost: priceOf(l), label: "Ordered" }, `Added to your plan: ${l.title}, arriving in ${l.delivery ?? "2-4 days"}.`);
    } else if (l.sellerType === "charity") {
      choose(
        active,
        { listingId: l.id, kind: "pickup", cost: priceOf(l), label: "Reserved" },
        `Reserved at ${l.sellerName}. Pick it up in store today, open until 5pm.`
      );
    } else {
      setModal({ kind: "handover", l, slot: active });
    }
  };

  const toggleSave = (l: Listing) =>
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(l.id)) next.delete(l.id);
      else {
        next.add(l.id);
        say(`Saved ${l.title} ♥`);
      }
      return next;
    });

  // ----- dock chat -----
  /** Existing rule-based parser, unchanged. Also the fallback whenever the live bot is unavailable. */
  const ruleSend = (text: string, named: number, target: number) => {
    const r = interpretRefinement(text, filters);
    if (!r) {
      onExchange(
        text,
        named >= 0
          ? `Here's what I've got for ${slots[named].piece.piece.toLowerCase()}.`
          : "I can sort by cheaper or closer, put warmer pieces first, keep to swaps, charity or students, set a budget like under £5, or look for a colour. Or name a piece."
      );
      return;
    }
    setFilters(r.filters);
    setRanking(null);
    const list = applyFilters(slots[target].cands, r.filters);
    const piece = slots[target].piece.piece.toLowerCase();
    let tail = ` Showing ${list.length} for ${piece}.`;
    if (list.length === 0) tail = ` Nothing fits that for ${piece}, so try loosening it or say "reset".`;
    else if (r.filters.warm && !list.some((c) => isWarm(c.listing))) tail += " None of these are properly warm, so this is the best I've got.";
    onExchange(text, r.reply + tail);
  };

  /** Asks the live bot (/api/refine). Null on any failure or when no key is set. */
  const askRefine = async (text: string, target: number): Promise<RefineReply | null> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 14_000);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          message: text,
          look: look ? { title: look.title, vibe: look.vibe, pieces: pieces.map((p) => p.piece) } : null,
          activeSlot: slots[target].piece.piece,
          listings: applyFilters(slots[target].cands, filters)
            .slice(0, 40)
            .map(({ listing: l }) => {
              const d = distanceInfo(l);
              return {
                id: l.id,
                title: l.title,
                price: formatPrice(l.swapOrPrice),
                distance: d ? `${d.walkMins} min walk` : "online, delivery",
                source: l.external ? SOURCE_LABEL[l.source] : l.sellerType === "charity" ? "charity shop" : "student",
              };
            }),
          currentFilter: {
            maxPrice: filters.maxPrice,
            sellerType: filters.only,
            swapOnly: filters.swapOnly || undefined,
            sortBy: filters.sort,
          },
          wardrobe: wardrobe.map(({ name, category, colour, tags }) => ({ name, category, colour, tags })),
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as RefineReply & { fallback?: boolean };
      if (data.fallback || typeof data.message !== "string" || !data.message.trim()) return null;
      return data;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const dockSend = async (text: string) => {
    if (busy) return;
    // Naming a piece ("show me the jeans") jumps to that slot.
    const words = new Set(tokenize(text));
    const named = slots.findIndex((s) => tokenize(s.piece.piece).some((t) => words.has(t)));
    const target = named >= 0 ? named : active;
    if (named >= 0 && named !== active) selectSlot(named);

    const run = ++dockRun.current;
    setBusy(text);
    let live: RefineReply | null = null;
    try {
      live = await askRefine(text, target);
    } finally {
      if (run === dockRun.current) setBusy(null);
    }
    if (run !== dockRun.current) return; // unmounted or superseded
    if (!live) return ruleSend(text, named, target);

    try {
      if (live.filter) {
        const f: RefineFilter = live.filter;
        setFilters({ sort: f.sortBy ?? "best", maxPrice: f.maxPrice, only: f.sellerType, swapOnly: f.swapOnly });
      }
      setRanking(live.rankedListingIds ? { slot: target, ids: live.rankedListingIds } : live.filter ? null : ranking);
      if (live.reasons) setAiReasons((prev) => ({ ...prev, ...live.reasons }));
      onExchange(text, live.message);
    } catch {
      ruleSend(text, named, target);
    }
  };

  // ----- summary -----
  const chosenList = Object.entries(choices).map(([i, c]) => ({ i: Number(i), c, l: byId(c.listingId) }));
  const sortedCount = slots.filter((s, i) => s.isOwned || choices[i]).length;
  const total = chosenList.reduce((n, x) => n + x.c.cost, 0);
  const walkMins = chosenList.reduce((m, x) => Math.max(m, (x.l && distanceInfo(x.l)?.walkMins) || 0), 0);
  const hasOnline = chosenList.some((x) => x.c.kind === "online");
  const allSorted = sortedCount === slots.length;

  const chips = filterChips(filters);
  const ctxBase = { wardrobe, ownedForOutfit, theme, look };

  return (
    <div className="shop-in flex h-full min-h-0 flex-col">
      {/* Outfit bar: one slot per piece */}
      <nav aria-label="Outfit pieces" className="flex gap-2 overflow-x-auto px-4 pb-2 pt-0.5">
        {slots.map((s, i) => {
          const c = choices[i];
          const n = visible[i]?.length ?? 0;
          const on = i === active;
          return (
            <button
              key={`${s.piece.piece}-${i}`}
              type="button"
              onClick={() => selectSlot(i)}
              aria-pressed={on}
              className={`pop flex min-w-[8rem] shrink-0 items-center gap-2 rounded-xl border-2 border-ink px-2.5 py-1.5 text-left ${
                on ? "bg-mustard shadow-pop-sm" : c || s.isOwned ? "bg-sage" : "bg-cream"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {pieceEmoji(s.piece.piece)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold">{s.piece.piece}</span>
                <span className={`block truncate text-[11px] font-semibold ${c || s.isOwned ? "text-forest" : "text-ink/75"}`}>
                  {c ? `✓ ${c.label}${c.cost ? ` · ${gbp(c.cost)}` : ""}` : s.isOwned ? "✓ You own it" : `${n} ${n === 1 ? "match" : "matches"}`}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Feed + map */}
      <div className="relative flex min-h-0 flex-1 gap-3 px-4 pb-2">
        <section className={`min-h-0 flex-1 flex-col lg:flex lg:basis-[62%] ${tab === "feed" ? "flex" : "hidden"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5">
            <h2 className="font-display text-base font-bold">
              {slot.piece.piece} <span className="text-xs font-medium text-stone">· {feed.length} {feed.length === 1 ? "match" : "matches"}</span>
            </h2>
            <div className="flex items-center gap-2">
              <div role="group" aria-label="Sort" className="flex gap-1 rounded-full bg-sage p-1">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={filters.sort === s.id}
                    onClick={() => setFilters((f) => ({ ...f, sort: s.id }))}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${filters.sort === s.id ? "bg-forest text-cream" : "text-ink/75"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div role="tablist" aria-label="View" className="flex gap-1 rounded-full bg-sage p-1 lg:hidden">
                {(["feed", "map"] as const).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${tab === t ? "bg-forest text-cream" : "text-ink/75"}`}
                  >
                    {t === "feed" ? "Feed" : "🗺️ Map"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              {chips.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setFilters(c.clear(filters))}
                  className="rounded-full border border-ink bg-mustard/40 px-2.5 py-1 text-xs font-bold"
                  aria-label={`Remove filter ${c.label}`}
                >
                  {c.label} ✕
                </button>
              ))}
              <button onClick={() => clearAll()} className="text-xs font-bold text-forest hover:underline">
                Clear all
              </button>
            </div>
          )}

          <div ref={feedRef} className="min-h-0 flex-1 overflow-y-auto pb-16 pr-1">
            {slot.isOwned && (
              <p className="mb-3 rounded-2xl border-2 border-ink bg-sage px-4 py-3 text-sm font-semibold text-forest">
                ✓ You already own this{slot.owned ? `: ${slot.owned.name}` : ""}. Fancy a spare or an upgrade? Browse below.
              </p>
            )}
            {feed.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-ink bg-cream p-8 text-center">
                <p className="text-4xl">🔍</p>
                <p className="mt-2 font-bold">Nothing matches that for {slot.piece.piece.toLowerCase()}</p>
                <p className="text-sm text-stone">Loosen a filter, or ask BopBot for something different.</p>
                <button
                  onClick={() => clearAll()}
                  className="pop mt-3 rounded-full border-2 border-ink bg-mustard px-5 py-2 text-sm font-bold shadow-pop-sm"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {feed.map(({ listing: l }) => (
                  <ProductCard
                    key={l.id}
                    l={l}
                    reason={aiReasons[l.id] ?? reasonFor(l, { ...ctxBase, cheapestId, closestId })}
                    saved={saved.has(l.id)}
                    selected={selectedId === l.id}
                    chosen={choices[active]?.listingId === l.id ? choices[active] : undefined}
                    onSave={() => toggleSave(l)}
                    onSelect={() => setSelectedId(l.id)}
                    onHover={setHoverId}
                    onMain={() => onMain(l)}
                    onSwap={() => setModal({ kind: "swap", l, slot: active })}
                    onOffer={() => setModal({ kind: "offer", l, slot: active })}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className={`isolate min-h-0 flex-1 flex-col lg:flex lg:basis-[38%] ${tab === "map" ? "flex" : "hidden"}`}>
          <div className="min-h-0 flex-1 pb-1">
            <MapLoader
              listings={mapListings}
              selectedId={selectedId && mapListings.some((l) => l.id === selectedId) ? selectedId : null}
              onSelect={onMapSelect}
              hoverId={hoverId && mapListings.some((l) => l.id === hoverId) ? hoverId : null}
              emptyHint="No local matches for this piece. Check the online options in the feed."
            />
          </div>
        </aside>

        {toast && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4">
            <div
              key={toast.id}
              role="status"
              className="pop-in max-w-lg rounded-2xl border-2 border-ink bg-ink px-5 py-3 text-center text-sm font-semibold text-cream shadow-pop"
            >
              {toast.text}
            </div>
          </div>
        )}

        <DockChat open={dockOpen} onToggle={() => setDockOpen((o) => !o)} msgs={msgs} pending={busy} onSend={dockSend} />
      </div>

      {/* Sticky summary */}
      <footer className="shrink-0 border-t-2 border-ink bg-cream px-4 py-1.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-sm">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone">Pieces sorted</p>
            <p className="flex items-center gap-2 font-display text-sm font-bold sm:text-base">
              {allSorted ? "🎉 " : ""}
              {sortedCount}/{slots.length}
              <span className="hidden gap-1 sm:flex" aria-hidden>
                {slots.map((s, i) => (
                  <span key={i} className={`h-2.5 w-2.5 rounded-full border border-ink ${s.isOwned || choices[i] ? "bg-forest" : "bg-canvas"}`} />
                ))}
              </span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone">Total</p>
            <p className="font-display text-sm font-bold sm:text-base">{chosenList.length ? (total ? gbp(total) : "£0 · swaps") : "£0"}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone">Walk</p>
            <p className="font-display text-sm font-bold sm:text-base">
              {walkMins ? `Everything within ${walkMins} min` : hasOnline ? "Delivery items only" : "Pick your pieces"}
              {walkMins && hasOnline ? <span className="hidden text-xs font-medium text-stone sm:inline"> · online ships</span> : null}
            </p>
          </div>
        </div>
      </footer>

      {modal?.kind === "handover" && (
        <HandoverModal
          listing={modal.l}
          onClose={() => setModal(null)}
          onConfirm={({ offerId, kind }) => {
            const { l, slot: i } = modal;
            const prevOffer = choices[i]?.offerId;
            if (prevOffer && prevOffer !== offerId) retractOffer(prevOffer);
            setChoices((prev) => ({ ...prev, [i]: kind === "swap"
                ? { listingId: l.id, kind: "swap", cost: 0, label: "Swap offered", offerId }
                : { listingId: l.id, kind: "handover", cost: priceOf(l), label: "Handover booked", offerId },
            }));
            say(kind === "swap" ? `Swap requested with ${l.sellerName}.` : `Handover requested with ${l.sellerName}.`);
          }}
        />
      )}
      {modal?.kind === "swap" && (
        <OfferModal
          mode="swap"
          listing={modal.l}
          wardrobe={wardrobe}
          onClose={() => setModal(null)}
          onSwap={(item) => {
            const { l, slot: i } = modal;
            setModal(null);
            choose(i, { listingId: l.id, kind: "swap", cost: 0, label: "Swap offered" }, `Swap offered: your ${item.name.toLowerCase()} for ${l.sellerName}'s ${l.title.toLowerCase()}. They usually reply within the hour.`, { swapWardrobeItemId: item.id });
          }}
        />
      )}
      {modal?.kind === "offer" && (
        <OfferModal
          mode="offer"
          listing={modal.l}
          wardrobe={wardrobe}
          onClose={() => setModal(null)}
          onOffer={(amount) => {
            const { l, slot: i } = modal;
            setModal(null);
            choose(i, { listingId: l.id, kind: "offer", cost: amount, label: "Offer sent" }, `Offer of ${gbp(amount)} sent to ${l.sellerName}. They usually reply within the hour.`);
          }}
        />
      )}
    </div>
  );
}
