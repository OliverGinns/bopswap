"use client";

import { useMemo } from "react";
import type { Direction } from "@/lib/botTypes";
import { STRONG, candidatesFor, themeOf } from "@/lib/plan";
import type { Listing } from "@/lib/seed";
import { softFill } from "@/lib/theme";

interface Props {
  directions: Direction[];
  selectedId: string | null;
  /** Older direction sets stay visible but can't be tapped. */
  disabled?: boolean;
  onPick: (d: Direction) => void;
  all: Listing[];
  byId: (id: string) => Listing | undefined;
}

export default function DirectionCards({ directions, selectedId, disabled, onPick, all, byId }: Props) {
  // How many nearby listings could fill the pieces the user doesn't own yet.
  const stats = useMemo(
    () =>
      directions.map((d) => {
        const theme = themeOf(d.pieces, byId);
        const ids = new Set<string>();
        for (const p of d.pieces) {
          if (p.status === "have") continue;
          for (const c of candidatesFor(p, all, theme)) if (!c.listing.external && (c.pinned || c.score >= STRONG)) ids.add(c.listing.id);
        }
        return { have: d.pieces.filter((p) => p.status === "have").length, nearby: ids.size };
      }),
    [directions, all, byId]
  );

  return (
    <div className={`mt-2 grid gap-2 sm:grid-cols-2 ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      {directions.map((d, i) => {
        const sel = d.id === selectedId;
        return (
          <button
            key={d.id}
            type="button"
            disabled={disabled}
            aria-pressed={sel}
            onClick={() => onPick(d)}
            className={`pop flex flex-col gap-2 rounded-2xl border-2 border-ink p-3 text-left shadow-pop transition ${
              sel ? "bg-mustard/30 ring-4 ring-mustard" : "bg-cream"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink text-2xl"
                style={{ background: softFill(d.id) }}
              >
                {d.emoji}
              </span>
              <span className="min-w-0">
                <span className="font-display block text-base font-bold leading-tight">{d.title}</span>
                <span className="block text-xs leading-snug text-ink/75">{d.vibe}</span>
              </span>
            </span>

            <span className="flex flex-wrap gap-1.5">
              {d.pieces.map((p) => (
                <span
                  key={p.piece}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    p.status === "have" ? "bg-sage text-forest" : p.status === "missing" ? "bg-canvas text-stone" : "bg-canvas text-ink"
                  }`}
                >
                  {p.status === "have" ? "✓ " : ""}
                  {p.piece}
                </span>
              ))}
            </span>

            <span className="mt-auto flex items-center justify-between gap-2 text-xs font-bold">
              <span className="text-forest">
                ✓ You own {stats[i].have}/{d.pieces.length}
              </span>
              <span className="text-ink/75">📍 {stats[i].nearby} matches nearby</span>
            </span>
            <span
              className={`rounded-full border-2 border-ink py-1 text-center text-xs font-bold ${
                sel ? "bg-forest text-cream" : "bg-canvas text-ink"
              }`}
            >
              {sel ? "✓ Selected" : "Choose this look"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
