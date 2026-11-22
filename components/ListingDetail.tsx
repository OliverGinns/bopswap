import { softFill } from "@/lib/theme";
import { Listing, SOURCE_LABEL, distanceInfo, formatPrice } from "@/lib/seed";
import ListingActions from "./ListingActions";

export default function ListingDetail({ listing: l }: { listing: Listing }) {
  const d = distanceInfo(l);
  return (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div
            className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border-2 border-ink shadow-pop text-[9rem]"
            style={{ background: softFill(l.id) }}
          >
            {l.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.imageUrl} alt={l.title} className="h-full w-full object-cover" />
            ) : (
              <span className="drop-shadow-xl">{l.imageEmoji}</span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              {l.sellerType === "charity" && (
                <span className="mb-2 inline-block rounded-full bg-leaf px-3 py-1 text-xs font-bold text-ink">
                  💚 Charity shop
                </span>
              )}
              <h1 className="text-3xl font-extrabold">{l.title}</h1>
              <p className="mt-1 text-2xl font-bold text-forest">
                {l.swapOrPrice === "swap" ? "🔁 Swap" : formatPrice(l.swapOrPrice)}
              </p>
            </div>

            <p className="text-ink/75">{l.description}</p>

            <dl className="grid grid-cols-3 gap-2 text-center text-sm">
              <Fact label="Size" value={l.size} />
              <Fact label="Condition" value={l.condition} />
              <Fact label="Category" value={l.category} />
            </dl>

            <div className="flex flex-wrap gap-2">
              {l.tags.map((t) => (
                <span key={t} className="rounded-full bg-sage px-3 py-1 text-xs">
                  #{t.replace(/\s+/g, "")}
                </span>
              ))}
            </div>

            <div className="rounded-2xl border-2 border-ink bg-cream p-4 text-sm">
              <p className="font-bold">{l.sellerName}</p>
              {d && l.shop ? (
                <>
                  <p className="text-ink/75">
                    {l.shop.address} · 📍 {d.label} · 🚶 {d.walkMins} min walk
                  </p>
                  <p className="mt-1 text-ink/75">🕘 {l.shop.hours}</p>
                  <p className="mt-1 text-ink/75">
                    <span className="font-semibold text-forest">Cause:</span> {l.shop.cause}
                  </p>
                  <p className="mt-2 rounded-xl bg-sage px-3 py-2 text-xs font-semibold text-forest">
                    💚 All proceeds go to charity, supporting a local cause.
                  </p>
                </>
              ) : d ? (
                <>
                  <p className="text-ink/75">
                    {l.college} · 📍 {d.label} · 🚶 {d.walkMins} min walk
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-sage px-3 py-1 text-xs font-bold text-forest">
                    ⚡ Same-day handover
                  </span>
                </>
              ) : (
                <p className="text-ink/75">
                  {SOURCE_LABEL[l.source]} · 📦 Delivery {l.delivery}
                </p>
              )}
            </div>

            <ListingActions listing={l} />
          </div>
        </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream p-3">
      <dt className="text-xs text-stone">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
