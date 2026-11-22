"use client";

import { useEffect, useRef, useState } from "react";
import type { UiMsg } from "./types";

const CHIPS = ["Cheaper", "Closer", "Something warmer", "Swaps only", "Under £5"];

interface Props {
  open: boolean;
  onToggle: () => void;
  msgs: UiMsg[];
  /** The user's message while BopBot is still working on it. */
  pending?: string | null;
  onSend: (text: string) => void;
}

/** Docked "Ask BopBot": a small refinement chat that re-ranks / filters the feed. */
export default function DockChat({ open, onToggle, msgs, pending, onSend }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recent = msgs.slice(-8);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [open, msgs, pending]);

  const submit = (t: string) => {
    if (!t.trim() || pending) return;
    onSend(t.trim());
    setInput("");
  };

  return (
    <div className="pointer-events-none absolute bottom-8 right-3 z-30 flex flex-col items-end gap-2 sm:right-4">
      {open && (
        <section
          aria-label="Ask BopBot"
          className="pop-in pointer-events-auto flex h-[26rem] max-h-[60dvh] w-[min(22rem,calc(100vw-1.5rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl border-2 border-ink bg-cream shadow-pop"
        >
          <header className="flex items-center justify-between border-b-2 border-ink bg-sage px-4 py-2.5">
            <span className="font-display font-bold">🤖 Ask BopBot</span>
            <button onClick={onToggle} aria-label="Close chat" className="rounded-full px-2 text-lg leading-none hover:bg-cream">
              ✕
            </button>
          </header>
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            <p className="rounded-2xl rounded-bl-md bg-sage px-3 py-2">
              Tell me how to tune the feed: cheaper, closer, warmer, swaps only, a budget, a colour, or name a piece.
            </p>
            {recent.map((m) => (
              <p
                key={m.id}
                className={`w-fit max-w-[90%] whitespace-pre-line rounded-2xl px-3 py-2 ${
                  m.role === "user" ? "ml-auto rounded-br-md bg-forest text-cream" : "rounded-bl-md bg-sage"
                }`}
              >
                {m.text}
              </p>
            ))}
            {pending && (
              <>
                <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-forest px-3 py-2 text-cream">{pending}</p>
                <p className="w-fit rounded-2xl rounded-bl-md bg-sage px-3 py-2 text-stone" aria-live="polite">
                  BopBot is thinking…
                </p>
              </>
            )}
          </div>
          <div className="space-y-2 border-t-2 border-ink p-2.5">
            <div className="flex flex-wrap gap-1.5">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => submit(c)}
                  className="rounded-full border border-ink bg-canvas px-2.5 py-1 text-xs font-semibold hover:bg-mustard"
                >
                  {c}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. cheaper, in black…"
                className="min-w-0 flex-1 rounded-full border-2 border-ink bg-canvas px-3.5 py-2 text-sm outline-none placeholder:text-stone focus:border-forest"
              />
              <button
                type="submit"
                disabled={!input.trim() || !!pending}
                className="rounded-full border-2 border-ink bg-mustard px-4 py-2 text-sm font-bold disabled:opacity-40"
              >
                Ask
              </button>
            </form>
          </div>
        </section>
      )}
      {!open && (
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="pop pop-in pointer-events-auto rounded-full border-2 border-ink bg-forest px-4 py-2.5 text-sm font-bold text-cream shadow-pop"
        >
          🤖 Ask BopBot
        </button>
      )}
    </div>
  );
}
