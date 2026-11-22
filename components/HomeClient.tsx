"use client";

import { useMemo, useState } from "react";
import { ALL_LISTINGS, distanceInfo, Listing } from "@/lib/seed";
import ListingCard from "./ListingCard";

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

export default function HomeClient() {
  const [chip, setChip] = useState<string>("all");
  const [seller, setSeller] = useState<string>("all");
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const list = ALL_LISTINGS.filter((l) => matches(l, chip, seller, q.trim()));
    // Local listings first, nearest first; external after.
    return list.sort((a, b) => {
      const da = distanceInfo(a)?.metres ?? Infinity;
      const db = distanceInfo(b)?.metres ?? Infinity;
      return da - db;
    });
  }, [chip, seller, q]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16">
      <section className="py-8 text-center sm:py-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Swap it. Wear it. <span className="text-yellow">Same day.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-white/70">
          Trade clothes with students down the road. Meet on campus, hand over, bop.
        </p>
        <div className="mx-auto mt-6 max-w-xl">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search denim, shell suit, Keble…"
            aria-label="Search listings"
            className="w-full rounded-full border border-white/15 bg-navy-2 px-5 py-3 text-base outline-none placeholder:text-white/40 focus:border-pink"
          />
        </div>
      </section>

      <div className="mb-3 flex gap-2" role="group" aria-label="Seller type">
        {SELLERS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeller(s.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              seller === s.id
                ? "border-green-500 bg-green-500 text-navy"
                : "border-white/15 bg-navy-2 text-white/80 hover:border-green-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChip(c.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              chip === c.id
                ? "border-pink bg-pink text-white"
                : "border-white/15 bg-navy-2 text-white/80 hover:border-yellow"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-navy-2 p-10 text-center">
          <p className="text-4xl">🕺</p>
          <p className="mt-2 font-semibold">Nothing matches that — try another search!</p>
          <button
            onClick={() => {
              setQ("");
              setChip("all");
              setSeller("all");
            }}
            className="mt-4 rounded-full bg-yellow px-5 py-2 font-bold text-navy"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {results.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
