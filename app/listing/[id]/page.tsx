import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import ListingActions from "@/components/ListingActions";
import { ALL_LISTINGS, SOURCE_LABEL, distanceInfo, formatPrice, getListing } from "@/lib/seed";

export const instant = false;

export function generateStaticParams() {
  return ALL_LISTINGS.map((l) => ({ id: l.id }));
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = getListing(id);
  if (!l) notFound();
  const d = distanceInfo(l);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <Link href="/" className="text-sm text-white/60 hover:text-yellow">
          ← Back to listings
        </Link>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div
            className="flex aspect-square items-center justify-center rounded-3xl text-[9rem]"
            style={{ background: `linear-gradient(135deg, ${l.gradient[0]}, ${l.gradient[1]})` }}
          >
            <span className="drop-shadow-xl">{l.imageEmoji}</span>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              {l.sellerType === "charity" && (
                <span className="mb-2 inline-block rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-navy">
                  💚 Charity shop
                </span>
              )}
              <h1 className="text-3xl font-extrabold">{l.title}</h1>
              <p className="mt-1 text-2xl font-bold text-yellow">
                {l.swapOrPrice === "swap" ? "🔁 Swap" : formatPrice(l.swapOrPrice)}
              </p>
            </div>

            <p className="text-white/80">{l.description}</p>

            <dl className="grid grid-cols-3 gap-2 text-center text-sm">
              <Fact label="Size" value={l.size} />
              <Fact label="Condition" value={l.condition} />
              <Fact label="Category" value={l.category} />
            </dl>

            <div className="flex flex-wrap gap-2">
              {l.tags.map((t) => (
                <span key={t} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  #{t.replace(/\s+/g, "")}
                </span>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-navy-2 p-4 text-sm">
              <p className="font-bold">{l.sellerName}</p>
              {d && l.shop ? (
                <>
                  <p className="text-white/70">
                    {l.shop.address} · 📍 {d.label} · 🚶 {d.walkMins} min walk
                  </p>
                  <p className="mt-1 text-white/70">🕘 {l.shop.hours}</p>
                  <p className="mt-1 text-white/70">
                    <span className="font-semibold text-green-400">Cause:</span> {l.shop.cause}
                  </p>
                  <p className="mt-2 rounded-xl bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-400">
                    💚 All proceeds go to charity, supporting a local cause.
                  </p>
                </>
              ) : d ? (
                <>
                  <p className="text-white/70">
                    {l.college} · 📍 {d.label} · 🚶 {d.walkMins} min walk
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-pink/15 px-3 py-1 text-xs font-bold text-pink">
                    ⚡ Same-day handover
                  </span>
                </>
              ) : (
                <p className="text-white/70">
                  {SOURCE_LABEL[l.source]} · 📦 Delivery {l.delivery}
                </p>
              )}
            </div>

            <ListingActions listing={l} />
          </div>
        </div>
      </main>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-navy-2 p-3">
      <dt className="text-xs text-white/50">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
