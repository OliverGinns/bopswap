"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { THEMES } from "@/lib/directions";
import { distanceInfo } from "@/lib/seed";
import { useListings } from "@/lib/useListings";
import { useWardrobe } from "@/lib/useWardrobe";
import { DEMO_USER } from "@/lib/wardrobe";
import ListingCard from "./ListingCard";
import WardrobeThumb from "./WardrobeThumb";

export default function HomeClient() {
  const router = useRouter();
  const [text, setText] = useState("");
  const { items } = useWardrobe();
  const { all, user } = useListings();

  const fresh = useMemo(() => {
    const mine = new Set(user.map((l) => l.id));
    return all
      .filter((l) => !l.external)
      .sort((a, b) => {
        if (mine.has(a.id) !== mine.has(b.id)) return mine.has(a.id) ? -1 : 1;
        return (distanceInfo(a)?.metres ?? Infinity) - (distanceInfo(b)?.metres ?? Infinity);
      })
      .slice(0, 6);
  }, [all, user]);

  const go = (q: string) => {
    const t = q.trim();
    router.push(t ? `/plan?q=${encodeURIComponent(t)}` : "/plan");
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12">
      <section className="py-6 text-center sm:py-8">
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Welcome back, {DEMO_USER} <span className="wave" aria-hidden>👋</span>
          <span className="mt-1 block text-forest">Let&apos;s plan your next outfit.</span>
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(text);
          }}
          className="mx-auto mt-5 max-w-2xl"
        >
          <div className="rounded-2xl border-2 border-ink bg-cream p-2.5 shadow-pop">
            <label htmlFor="occasion" className="sr-only">
              What&apos;s the occasion?
            </label>
            <textarea
              id="occasion"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  go(text);
                }
              }}
              rows={1}
              maxLength={200}
              placeholder="What's the occasion?"
              className="font-display w-full resize-none rounded-2xl bg-transparent px-3 py-1.5 text-lg outline-none placeholder:text-stone"
            />
            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <span className="text-xs font-semibold text-stone">Tell BopBot what you&apos;re dressing for</span>
              <button
                type="submit"
                className="font-display pop rounded-full border-2 border-ink bg-forest px-4 py-1.5 text-sm font-semibold text-cream shadow-pop-sm"
              >
                Plan it →
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => router.push(`/plan?theme=${t.id}`)}
                className="pop rounded-full border-2 border-ink bg-sage px-3 py-1 text-xs font-bold shadow-pop-sm"
              >
                {t.label}
              </button>
            ))}
          </div>
        </form>
      </section>

      <section aria-label="Upcoming event" className="mb-4">
        <Link href="/plan" className="pop flex items-center gap-3 rounded-2xl border-2 border-ink bg-mustard/60 p-3 shadow-pop">
          <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-cream text-2xl">
            🪩
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-display block text-base font-semibold">College bop · Friday</span>
            <span className="block text-xs font-semibold text-ink/75">Outfit 2/5 sorted. Pick up where you left off.</span>
          </span>
          <span className="font-display shrink-0 text-sm font-semibold text-forest">Continue →</span>
        </Link>
      </section>

      <section aria-label="Your wardrobe" className="mb-6">
        <Link
          href="/wardrobe"
          className="pop flex items-center gap-3 rounded-2xl border-2 border-ink bg-cream p-3 shadow-pop"
        >
          <div className="shrink-0">
            <p className="font-display text-base font-semibold">
              Your wardrobe: <span className="text-forest">{items.length} items</span>
            </p>
            <p className="text-xs font-semibold text-stone">View &amp; edit →</p>
          </div>
          <div className="flex min-w-0 flex-1 justify-end -space-x-2 overflow-hidden">
            {items.slice(0, 8).map((i) => (
              <WardrobeThumb key={i.id} item={i} className="h-10 w-10 shrink-0 rounded-full border-2 border-ink text-lg" />
            ))}
          </div>
        </Link>
      </section>

      <section aria-label="Fresh near you">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Fresh near you</h2>
          <Link href="/browse" className="font-display text-sm font-semibold text-forest underline-offset-4 hover:underline">
            Browse everything →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {fresh.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>
    </div>
  );
}
