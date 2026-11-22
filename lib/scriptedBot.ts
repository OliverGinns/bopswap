// Scripted BopBot: a small state machine that returns the same JSON shape as the live bot.
// It is stateless: the stage is derived from the conversation history the client sends.
//
//   stage "intro"  -> first user message (the event): propose 3-4 outfit directions
//   stage "pick"   -> any later message: confirm the chosen/refined direction and build its outfit
//
// Edit lib/directions.ts to change the demo looks.

import { BotReply, ChatMessage, Direction, OutfitPiece, WardrobeLite } from "./botTypes";
import { DEFS_90S, DEFS_FANCY, DirectionDef, PieceDef, parseBudget } from "./directions";
import { ALL_LISTINGS, Category, Listing, distanceInfo } from "./seed";

const has = (text: string, words: string[]) => words.some((w) => new RegExp(`\\b${w.replace(/[-]/g, "[- ]?")}`, "i").test(text));

const SEED_IDS = new Set(ALL_LISTINGS.map((l) => l.id));
const metres = (l: Listing) => distanceInfo(l)?.metres ?? Infinity;
const byDistance = (a: Listing, b: Listing) => metres(a) - metres(b);
/** Swap listings count as free for budget purposes. */
const affordable = (l: Listing, budget?: number) => budget == null || l.swapOrPrice === "swap" || l.swapOrPrice <= budget;

/** An uploaded (non-seed) listing matches by title/tag term, or by category when it is tagged 90s. */
function findUpload(def: { prefer: string[]; category?: Category }, pool: Listing[]): Listing | undefined {
  const uploads = pool.filter((l) => !SEED_IDS.has(l.id) && !l.external);
  for (const term of def.prefer) {
    const hit = uploads
      .filter((l) => l.tags.some((t) => t.toLowerCase() === term) || l.title.toLowerCase().includes(term))
      .sort(byDistance)[0];
    if (hit) return hit;
  }
  if (!def.category) return undefined;
  return uploads
    .filter((l) => l.category === def.category && (l.theme === "90s" || l.tags.includes("90s") || /90'?s/i.test(l.title)))
    .sort(byDistance)[0];
}

function findMatch(
  def: { prefer: string[]; charityFirst?: boolean; category?: Category },
  pool: Listing[],
  external: boolean,
  budget?: number
): Listing | undefined {
  const avail = pool.filter((l) => !!l.external === external && affordable(l, budget));
  // Student uploads beat seed listings.
  if (!external) {
    const up = findUpload(def, avail);
    if (up) return up;
  }
  if (def.charityFirst && !external) {
    const charity = findMatch({ prefer: def.prefer }, avail.filter((l) => l.sellerType === "charity"), false, budget);
    if (charity) return charity;
  }
  for (const term of def.prefer) {
    const hit = avail
      .filter((l) => l.tags.some((t) => t.toLowerCase() === term) || l.title.toLowerCase().includes(term))
      .sort(byDistance)[0];
    if (hit) return hit;
  }
  return undefined;
}

function buildOutfit(defs: PieceDef[], ownedText: string, inventory: Listing[], budget?: number): OutfitPiece[] {
  const used = new Set<string>();
  return defs.map((def): OutfitPiece => {
    if (ownedText && has(ownedText, def.have)) return { piece: def.piece, status: "have" };
    const pool = inventory.filter((l) => !used.has(l.id));
    // Local first (students + charity shops), external only if nothing local fits.
    const local = findMatch(def, pool, false, budget);
    if (local) {
      used.add(local.id);
      return { piece: def.piece, status: "local", listingId: local.id };
    }
    const ext = findMatch(def, pool, true, budget);
    if (ext) {
      used.add(ext.id);
      return { piece: def.piece, status: "external", listingId: ext.id };
    }
    return { piece: def.piece, status: "missing" };
  });
}

/** Which direction does this message ask for? Title first, then keywords. */
function matchDirection(text: string, defs: DirectionDef[]): DirectionDef | undefined {
  const t = text.toLowerCase();
  return defs.find((d) => t.includes(d.title.toLowerCase())) ?? defs.find((d) => d.keywords.some((k) => new RegExp(`\\b${k}`, "i").test(t)));
}

function toDirections(defs: DirectionDef[], ownedText: string, inventory: Listing[]): Direction[] {
  return defs.map((d) => ({ id: d.id, title: d.title, vibe: d.vibe, emoji: d.emoji, pieces: buildOutfit(d.pieces, ownedText, inventory) }));
}

const wardrobeText = (w: WardrobeLite[]) => w.map((i) => `${i.name} ${i.tags.join(" ")}`).join(" \n ");

export function scriptedReply(history: ChatMessage[], inventory: Listing[], wardrobe: WardrobeLite[] = []): BotReply {
  const userMsgs = history.filter((m) => m.role === "user").map((m) => m.content);
  const first = userMsgs[0] ?? "";
  const is90s = /\b(90'?s|nineties|1990s?)\b/i.test(first);

  // Event decides the pool of looks; a costume word in the first message pulls that look to the front.
  let pool = is90s ? DEFS_90S : DEFS_FANCY;
  const named = matchDirection(first, pool);
  if (named) pool = [named, ...pool.filter((d) => d !== named)];
  const defs = pool.slice(0, 4);

  // Owned = the wardrobe the client sent, plus anything they typed after the first message.
  const ownedText = [wardrobeText(wardrobe), ...userMsgs.slice(1)].join(" \n ");

  // Stage 1: only the event has been stated.
  if (userMsgs.length <= 1) {
    const directions = toDirections(defs, ownedText, inventory);
    const best = [...directions].sort((a, b) => b.pieces.filter((p) => p.status === "have").length - a.pieces.filter((p) => p.status === "have").length)[0];
    const owned = best.pieces.filter((p) => p.status === "have").length;
    return {
      message:
        (is90s ? "Good theme, the 90s are easy to dress for. " : "Sounds fun, here are some classics that always land at a bop. ") +
        `I've checked your wardrobe too${owned ? `: you're already ahead on ${best.title}` : ""}. Tap a look, or tell me what to tweak, like "more grunge, under £8".`,
      directions,
    };
  }

  // Stage 2: newest message that names a look wins; otherwise the first look.
  let chosen: DirectionDef | undefined;
  for (let i = userMsgs.length - 1; i >= 1 && !chosen; i--) chosen = matchDirection(userMsgs[i], pool);
  chosen ??= defs[0];
  let budget: number | undefined;
  for (let i = userMsgs.length - 1; i >= 1 && budget == null; i--) budget = parseBudget(userMsgs[i]);

  const outfit = buildOutfit(chosen.pieces, ownedText, inventory, budget);
  const haveN = outfit.filter((p) => p.status === "have").length;
  const missingN = outfit.filter((p) => p.status === "missing").length;
  const byId = new Map(inventory.map((l) => [l.id, l]));
  const near = outfit
    .filter((p) => p.status === "local" && p.listingId)
    .map((p) => byId.get(p.listingId!)!)
    .sort(byDistance)[0];

  const parts = [`${chosen.title} it is.`];
  if (haveN) parts.push(`You already own ${haveN} of the ${outfit.length} pieces.`);
  const d = near ? distanceInfo(near) : null;
  if (near && d) parts.push(`The closest match, ${near.title.toLowerCase()}, is a ${d.walkMins} min walk, so handover can be today.`);
  if (budget != null) parts.push(`I've kept it under £${budget}.`);
  if (missingN) parts.push(`${missingN === 1 ? "One piece has" : `${missingN} pieces have`} no great local match yet, I'll show you the closest.`);

  return { message: parts.join(" "), outfit, followUp: "Ready when you are, or tell me what to tweak first." };
}
