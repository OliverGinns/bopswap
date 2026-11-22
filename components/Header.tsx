"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, useOffers } from "@/lib/offers";
import Logo from "./Logo";

const NAV = [
  { href: "/plan", label: "Plan" },
  { href: "/browse", label: "Browse" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/sell", label: "Sell" },
  { href: "/basket", label: "Basket" },
  { href: "/profile", label: "Profile" },
] as const;

export default function Header() {
  const path = usePathname() ?? "/";
  const { offers } = useOffers();
  const basketCount = offers.filter(isActive).length;
  return (
    <header className="sticky top-0 z-20 border-b-2 border-ink bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="leading-none">
            <span className="font-display block text-xl font-bold tracking-tight text-forest">BopSwap</span>
            <span className="hidden text-[11px] font-semibold text-stone sm:block">Swap it. Wear it. Same day.</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-0.5 sm:gap-1.5" aria-label="Main">
          {NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`font-display relative rounded-full border-2 px-2.5 py-1 text-sm font-semibold transition sm:px-3.5 ${
                  active
                    ? "border-ink bg-mustard text-ink shadow-pop-sm"
                    : "border-transparent text-ink/75 hover:border-ink hover:bg-sage"
                }`}
              >
                {n.label}
                {n.href === "/basket" && basketCount > 0 && (
                  <span
                    aria-label={`${basketCount} active offers`}
                    className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-coral px-1 align-middle text-[11px] font-bold leading-none text-cream"
                  >
                    {basketCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
