"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BotReply, Direction, OutfitPiece } from "@/lib/botTypes";
import { parseBudget, themeById } from "@/lib/directions";
import { setChosenLook } from "@/lib/lookChoice";
import { scriptedReply } from "@/lib/scriptedBot";
import { useListings } from "@/lib/useListings";
import { useWardrobe } from "@/lib/useWardrobe";
import ChatPlan from "./ChatPlan";
import ShopView from "./ShopView";
import type { UiMsg } from "./types";

const GREETING: UiMsg = {
  id: 0,
  role: "assistant",
  local: true,
  text: "Hey, I'm BopBot. Tell me what you're dressing for and I'll suggest a few looks, using what's already in your wardrobe and what's within walking distance.",
};

const DEMO_LINE = "College bop, 90s theme";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** /plan: one page, two phases. Plan (full-screen chat) -> Shop (feed + map with the chat docked). */
export default function PlanClient({ initialInput = "", themeId }: { initialInput?: string; themeId?: string }) {
  const { all, user, byId } = useListings();
  const { items: wardrobe, setItems: setWardrobe, ready: wardrobeReady } = useWardrobe();
  const theme = themeById(themeId);
  // A theme chip opens the planner with BopBot's intro + look cards already in place. This hidden first message keeps the bot in stage 2 afterwards.
  const seedRef = useRef<string | null>(theme?.query ?? null);

  const [phase, setPhase] = useState<"plan" | "shop">("plan");
  const [leaving, setLeaving] = useState(false);
  const [msgs, setMsgs] = useState<UiMsg[]>(theme ? [] : [GREETING]);
  const [input, setInput] = useState(initialInput);
  const [loading, setLoading] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [selectedDirId, setSelectedDirId] = useState<string | null>(null);

  const msgsRef = useRef<UiMsg[]>(theme ? [] : [GREETING]);
  const nextId = useRef(1);
  const runId = useRef(0);
  const userRef = useRef(user);
  const wardrobeRef = useRef(wardrobe);
  const allRef = useRef(all);
  useEffect(() => {
    userRef.current = user;
    wardrobeRef.current = wardrobe;
    allRef.current = all;
  }, [user, wardrobe, all]);

  const commit = useCallback((next: UiMsg[]) => {
    msgsRef.current = next;
    setMsgs(next);
  }, []);

  const seeded = useRef(false);
  useEffect(() => {
    if (!theme || !wardrobeReady || seeded.current) return;
    seeded.current = true;
    // Let the listings hook settle first so uploaded items can show up in the looks.
    setTimeout(() => {
      let msg: UiMsg = { id: nextId.current++, role: "assistant", text: theme.intro };
      try {
        const lite = wardrobeRef.current.map(({ name, category, colour, tags }) => ({ name, category, colour, tags }));
        const r = scriptedReply([{ role: "user", content: theme.query }], allRef.current, lite);
        msg = { ...msg, directions: r.directions };
      } catch {
        /* no cards: the chat box still works */
      }
      commit([msg]);
    }, 40);
  }, [theme, wardrobeReady, commit]);

  // The current plan: the newest outfit if it is newer than the newest directions, else the tapped direction.
  const { planPieces, canPlan } = useMemo(() => {
    let dirIdx = -1;
    let outIdx = -1;
    msgs.forEach((m, i) => {
      if (m.directions) dirIdx = i;
      if (m.outfit) outIdx = i;
    });
    const chosen = selectedDirId ? msgs[dirIdx]?.directions?.find((d) => d.id === selectedDirId) : undefined;
    const pieces: OutfitPiece[] | null = outIdx > dirIdx ? msgs[outIdx].outfit! : chosen?.pieces ?? null;
    return { planPieces: pieces, canPlan: !!pieces };
  }, [msgs, selectedDirId]);

  const budget = useMemo(() => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role !== "user") continue;
      const b = parseBudget(msgs[i].text);
      if (b != null) return b;
    }
    return undefined;
  }, [msgs]);

  // The look the user chose, so shop-phase copy can name it ("Fits your Beachy Chill look").
  const look = useMemo(() => {
    const dirs = [...msgs].reverse().find((m) => m.directions)?.directions;
    const d = selectedDirId ? dirs?.find((x) => x.id === selectedDirId) : undefined;
    return d ? { title: d.title, vibe: d.vibe } : undefined;
  }, [msgs, selectedDirId]);

  const planRef = useRef(planPieces);
  useEffect(() => {
    planRef.current = planPieces;
  }, [planPieces]);

  /** Sends a user message to the bot. Resolves with the reply (null if the chat was reset meanwhile). */
  const send = useCallback(
    async (text: string): Promise<BotReply | null> => {
      const clean = text.trim();
      if (!clean) return null;
      const myRun = runId.current;
      const withUser = [...msgsRef.current, { id: nextId.current++, role: "user" as const, text: clean }];
      commit(withUser);
      setInput("");
      setLoading(true);

      const seedMsg: UiMsg[] = seedRef.current ? [{ id: -1, role: "user", text: seedRef.current }] : [];
      const history = [...seedMsg, ...withUser.filter((m) => !m.local || m.role === "user")];
      const wardrobeLite = wardrobeRef.current.map(({ name, category, colour, tags }) => ({ name, category, colour, tags }));

      let reply: BotReply;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 30_000);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            messages: history
              .filter((m) => !(m.role === "assistant" && m.local))
              .map((m) => ({ role: m.role, content: m.text, outfit: m.outfit, directions: m.directions })),
            wardrobe: wardrobeLite,
            // Uploaded items, so BopBot can suggest them. Photos are left out: the bot only needs the text fields.
            uploads: userRef.current.map((l) => ({ ...l, imageUrl: undefined })),
          }),
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(String(res.status));
        reply = (await res.json()) as BotReply;
        if (typeof reply.message !== "string") throw new Error("bad shape");
      } catch {
        reply = { message: "I lost the thread for a second. Could you send that again?" };
      }

      // Fail soft: the very first reply must come with look cards, so borrow the scripted bot's if the live one didn't.
      const hadDirections = msgsRef.current.some((m) => m.directions);
      if (!reply.directions && !hadDirections && !reply.message.startsWith("I lost the thread")) {
        try {
          const fb = scriptedReply(
            history.map((m) => ({ role: m.role, content: m.text })),
            allRef.current,
            wardrobeLite
          );
          if (fb.directions) reply = { ...reply, directions: fb.directions };
        } catch {
          /* keep the reply as is */
        }
      }

      if (myRun !== runId.current) return null; // chat was reset meanwhile
      const latestDirs = [...msgsRef.current].reverse().find((m) => m.directions)?.directions;
      if (reply.directions) setSelectedDirId(null);
      else if (reply.outfit && latestDirs) {
        // A typed refinement ("more grunge") highlights the look it names.
        const t = clean.toLowerCase();
        const hit = latestDirs.find((d) => t.includes(d.title.toLowerCase()) || t.includes(d.id));
        if (hit) setSelectedDirId(hit.id);
      }
      commit([
        ...msgsRef.current,
        { id: nextId.current++, role: "assistant", text: reply.message, directions: reply.directions, outfit: reply.outfit, followUp: reply.followUp },
      ]);
      setLoading(false);
      return reply;
    },
    [commit]
  );

  const pickDirection = useCallback(
    (d: Direction) => {
      setSelectedDirId(d.id);
      setChosenLook(d.title);
      return send(`Let's go with ${d.title}`);
    },
    [send]
  );

  const goShop = useCallback(() => {
    if (!planRef.current) return;
    setLeaving(true);
    setTimeout(() => {
      setPhase("shop");
      setLeaving(false);
    }, 480);
  }, []);

  const reset = useCallback(() => {
    runId.current++;
    nextId.current = 1;
    seedRef.current = null;
    setDemoRunning(false);
    setLoading(false);
    setLeaving(false);
    setInput("");
    setSelectedDirId(null);
    setChosenLook(null);
    setPhase("plan");
    commit([GREETING]);
  }, [commit]);

  /** Plays phase 1 (types the event, gets looks, taps the first), then moves into phase 2. */
  const playDemo = async () => {
    reset();
    const myRun = runId.current;
    setDemoRunning(true);
    await sleep(400);
    for (let i = 1; i <= DEMO_LINE.length; i++) {
      if (myRun !== runId.current) return;
      setInput(DEMO_LINE.slice(0, i));
      await sleep(22);
    }
    await sleep(350);
    if (myRun !== runId.current) return;
    const first = await send(DEMO_LINE);
    const dir = first?.directions?.[0];
    if (!dir || myRun !== runId.current) return setDemoRunning(false);
    await sleep(1400);
    if (myRun !== runId.current) return;
    await pickDirection(dir);
    await sleep(1500);
    if (myRun !== runId.current) return;
    setDemoRunning(false);
    goShop();
  };

  /** Local-only exchange from the docked chat (filters are applied by ShopView). */
  const onExchange = useCallback(
    (user: string, bot: string) => {
      commit([
        ...msgsRef.current,
        { id: nextId.current++, role: "user", text: user, local: true },
        { id: nextId.current++, role: "assistant", text: bot, local: true },
      ]);
    },
    [commit]
  );

  const started = msgs.some((m) => m.role === "user");
  const lastDirMsgId = [...msgs].reverse().find((m) => m.directions)?.id;
  const outfitIsFresh = !!planPieces && (msgs.findLast((m) => m.outfit)?.id ?? -1) > (lastDirMsgId ?? -1);
  const canFind = !loading && !demoRunning && canPlan && (outfitIsFresh || !!selectedDirId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-2">
          <h1 className="font-display hidden text-lg font-bold sm:block sm:text-xl">
            🤖 Bop<span className="text-forest">Bot</span> <span className="hidden text-sm font-medium text-stone sm:inline">outfit planner</span>
          </h1>
          <ol className="flex items-center gap-1 text-xs font-bold" aria-label="Steps">
            <li className={`rounded-full border-2 border-ink px-2.5 py-0.5 ${phase === "plan" ? "bg-mustard" : "bg-sage"}`}>
              {phase === "shop" ? (
                <button onClick={() => setPhase("plan")} className="font-bold">
                  ← 1 Plan
                </button>
              ) : (
                "1 Plan"
              )}
            </li>
            <li className={`rounded-full border-2 border-ink px-2.5 py-0.5 ${phase === "shop" ? "bg-mustard" : "bg-cream text-stone"}`}>2 Shop</li>
          </ol>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void playDemo()}
            disabled={demoRunning}
            className="rounded-full border-2 border-ink bg-cream px-3 py-1.5 text-xs font-bold text-forest transition hover:bg-mustard hover:text-ink disabled:opacity-50"
          >
            ▶ Play 90s demo
          </button>
          {(started || phase === "shop") && (
            <button onClick={reset} className="rounded-full border-2 border-ink px-3 py-1.5 text-xs font-medium text-ink/75 hover:text-ink">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {phase === "plan" ? (
          <div
            className={`h-full origin-bottom-right transition-all duration-[480ms] ease-in ${
              leaving ? "pointer-events-none translate-y-6 scale-[0.1] opacity-0" : ""
            }`}
          >
            <ChatPlan
              msgs={msgs}
              loading={loading}
              demoRunning={demoRunning}
              input={input}
              setInput={setInput}
              onSend={(t) => void send(t)}
              selectedDirId={selectedDirId}
              onPickDirection={(d) => void pickDirection(d)}
              canFind={canFind}
              onFind={goShop}
              wardrobe={wardrobe}
              setWardrobe={setWardrobe}
              all={all}
              byId={byId}
            />
          </div>
        ) : (
          planPieces && (
            <div className="mx-auto h-full w-full max-w-[1600px]">
              <ShopView
                key={planPieces.map((p) => `${p.piece}:${p.listingId ?? ""}`).join("|")}
                pieces={planPieces}
                all={all}
                byId={byId}
                wardrobe={wardrobe}
                budget={budget}
                msgs={msgs}
                look={look}
                onExchange={onExchange}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
