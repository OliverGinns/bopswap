"use client";

import { useMemo, useState } from "react";
import { distanceInfo, Listing } from "@/lib/seed";
import { useListings } from "@/lib/useListings";
import ListingCard from "./ListingCard";
import MapLoader from "./MapLoader";

const CHIPS = [
  { id: "all", label: "✨ All" },
  { id: "90s", label: "📼 90s" },
  { id: "fancy-dress", label: "🎭 Fancy dress" },
  { id: "swap", label: "🔁 Swap only" },
  { id: "local", label: "⚡ Same-day" },
  { id: "online", label: "📦 Online" },
] as const;

const SELLERS = [
  { id: "student", label: "Students" },
  { id: "charity", label: "💚 Charity shops" },
  { id: "all", label: "All" },
] as const;

function matches(l: Listing, chip: string, seller: string, q: string): boolean {
  if (seller === "charity" && l.sellerType !== "charity") return false;
  if (seller === "student" && l.sellerType !== "student") return false;
  if (chip === "90s" && l.theme !== "90s") return false;
  if (chip === "fancy-dress" && l.theme !== "fancy-dress") return false;
  if (chip === "swap" && l.swapOrPrice !== "swap") return false;
  if (chip === "local" && l.external) return false;
  if (chip === "online" && !l.external) return false;
  if (!q) return true;
  const hay = [l.title, l.description, l.category, l.college ?? "", l.sellerName, l.shop?.cause ?? "", ...l.tags].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

export default function BrowseClient() {
  const [chip, setChip] = useState<string>("all");
  const [seller, setSeller] = useState<string>("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "map">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { all, user } = useListings();

  const results = useMemo(() => {
    const fresh = new Set(user.map((l) => l.id));
    const list = all.filter((l) => matches(l, chip, seller, q.trim()));
    // Fresh uploads first, then local listings nearest first; external after.
    return list.sort((a, b) => {
      if (fresh.has(a.id) !== fresh.has(b.id)) return fresh.has(a.id) ? -1 : 1;
      const da = distanceInfo(a)?.metres ?? Infinity;
      const db = distanceInfo(b)?.metres ?? Infinity;
      return da - db;
    });
  }, [all, user, chip, seller, q]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12">
      <section className="py-4 text-center sm:py-6">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Browse <span className="text-forest">everything</span>
        </h1>
        <p className="mx-auto mt-1.5 max-w-xl text-sm text-ink/75">
          Trade clothes with students down the road. Meet on campus, hand over, bop.
        </p>
        <div className="mx-auto mt-3 max-w-xl">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search denim, shell suit, Keble…"
            aria-label="Search listings"
            className="w-full rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm outline-none placeholder:text-stone focus:border-forest"
          />
        </div>
      </section>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-2" role="group" aria-label="Seller type">
        {SELLERS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeller(s.id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              seller === s.id
                ? "border-ink bg-leaf text-ink"
                : "border-ink bg-cream text-ink/75 hover:border-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 rounded-full bg-sage p-1" role="group" aria-label="View">
        {(["grid", "map"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${view === v ? "bg-forest text-cream " : "text-stone hover:text-ink"}`}
          >
            {v === "grid" ? "▦ Grid" : "🗺️ Map"}
          </button>
        ))}
      </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChip(c.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              chip === c.id
                ? "border-ink bg-forest text-cream "
                : "border-ink bg-cream text-ink/75 hover:border-ink"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="rounded-3xl border-2 border-ink bg-cream shadow-pop p-10 text-center">
          <p className="text-4xl">🕺</p>
          <p className="mt-2 font-semibold">Nothing matches that — try another search!</p>
          <button
            onClick={() => {
              setQ("");
              setChip("all");
              setSeller("all");
            }}
            className="mt-4 rounded-full bg-mustard px-5 py-2 font-bold text-ink"
          >
            Clear filters
          </button>
        </div>
      ) : view === "map" ? (
        <>
          <div className="h-[65vh] min-h-[22rem]">
            <MapLoader listings={results} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <p className="mt-2 text-center text-xs text-stone">
            Coral = student swaps · green = charity shops · yellow = you at St Anne&apos;s. Online listings have no location, so they&apos;re not on the map.
          </p>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {results.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
