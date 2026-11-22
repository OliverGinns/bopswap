import { softFill } from "@/lib/theme";
import { WardrobeItem, itemEmoji } from "@/lib/wardrobe";

/** Square photo-or-emoji tile for a wardrobe item. */
export default function WardrobeThumb({ item, className = "" }: { item: WardrobeItem; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: softFill(item.id) }}
    >
      {item.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photo} alt={item.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{itemEmoji(item)}</span>
      )}
    </div>
  );
}
