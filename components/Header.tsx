import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-navy/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="disco-spin text-3xl" aria-hidden>🪩</span>
          <span className="leading-tight">
            <span className="block text-xl font-extrabold tracking-tight">
              Bop<span className="text-pink">Swap</span>
            </span>
            <span className="block text-[11px] font-medium text-yellow">Swap it. Wear it. Same day.</span>
          </span>
        </Link>
        <span className="hidden rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 sm:inline">
          📍 St Anne&apos;s College, Oxford
        </span>
      </div>
    </header>
  );
}
