"use client";

import { useEffect, useRef } from "react";
import type { Direction } from "@/lib/botTypes";
import type { Listing } from "@/lib/seed";
import type { WardrobeItem } from "@/lib/wardrobe";
import DirectionCards from "./DirectionCards";
import WardrobePanel from "./WardrobePanel";
import type { UiMsg } from "./types";

const STARTERS = ["College bop, 90s theme", "Fancy dress night", "Toga party"];

interface Props {
  msgs: UiMsg[];
  loading: boolean;
  demoRunning: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: (text: string) => void;
  selectedDirId: string | null;
  onPickDirection: (d: Direction) => void;
  canFind: boolean;
  onFind: () => void;
  wardrobe: WardrobeItem[];
  setWardrobe: (items: WardrobeItem[]) => void;
  all: Listing[];
  byId: (id: string) => Listing | undefined;
}

/** Phase 1: full-width, roomy chat. Directions arrive as tappable cards under BopBot's message. */
export default function ChatPlan(p: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = p.msgs.some((m) => m.role === "user");
  const lastDirId = [...p.msgs].reverse().find((m) => m.directions)?.id;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [p.msgs, p.loading]);

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-2 px-4 pb-3">
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border-2 border-ink bg-sage/50">
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
          {p.msgs.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user" ? "max-w-[88%] rounded-br-lg bg-forest text-cream sm:max-w-[75%]" : "max-w-[95%] rounded-bl-lg bg-sage sm:max-w-[85%]"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                {m.followUp && <p className="mt-2 text-ink/75">{m.followUp}</p>}
              </div>
              {m.directions && (
                <DirectionCards
                  directions={m.directions}
                  selectedId={p.selectedDirId}
                  disabled={m.id !== lastDirId || p.loading || p.demoRunning}
                  onPick={p.onPickDirection}
                  all={p.all}
                  byId={p.byId}
                />
              )}
            </div>
          ))}
          {p.loading && (
            <div aria-label="BopBot is typing" className="flex w-fit items-center gap-1.5 rounded-3xl rounded-bl-lg bg-sage px-5 py-4">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-cream" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t-2 border-ink bg-sage/60 p-2.5 sm:p-3">
          {p.canFind && (
            <div className="pop-in flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-mustard/30 p-3">
              <span className="text-xs font-semibold">Happy with this look? I&apos;ll line up the pieces nearby.</span>
              <button
                type="button"
                onClick={p.onFind}
                className="pop rounded-full border-2 border-ink bg-forest px-5 py-2 text-sm font-bold text-cream shadow-pop-sm"
              >
                Find my pieces →
              </button>
            </div>
          )}

          <WardrobePanel items={p.wardrobe} onChange={p.setWardrobe} />

          {!started && (
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  disabled={p.loading || p.demoRunning}
                  onClick={() => p.onSend(s)}
                  className="rounded-full border-2 border-ink bg-cream px-3 py-1 text-xs font-medium text-ink/75 transition hover:text-forest disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!p.loading && !p.demoRunning) p.onSend(p.input);
            }}
            className="flex gap-2"
          >
            <input
              value={p.input}
              onChange={(e) => p.setInput(e.target.value)}
              readOnly={p.demoRunning}
              placeholder={started ? "Refine it: more grunge, under £8…" : "What are you dressing for? e.g. college bop, 90s theme"}
              className="min-w-0 flex-1 rounded-full border-2 border-ink bg-canvas px-4 py-2 text-sm outline-none placeholder:text-stone focus:border-forest"
            />
            <button
              type="submit"
              disabled={p.loading || p.demoRunning || !p.input.trim()}
              className="rounded-full border-2 border-ink bg-mustard px-5 py-2 text-sm font-bold text-ink transition disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
