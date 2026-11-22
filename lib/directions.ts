// Outfit-direction definitions for the scripted bot, plus the term lists the Plan page uses to find
// extra candidates for each piece. Edit here to change the demo looks.

import type { Category } from "./seed";

export interface PieceDef {
  piece: string;
  /** Words that mean the user already owns this piece (matched against wardrobe names/tags). */
  have: string[];
  /** Tag/title terms to look for in the inventory, best first. */
  prefer: string[];
  /** Look at charity-shop stock before student listings for this piece. */
  charityFirst?: boolean;
  category?: Category;
}

export interface DirectionDef {
  id: string;
  title: string;
  vibe: string;
  emoji: string;
  /** Words in a user message that mean "this direction". */
  keywords: string[];
  pieces: PieceDef[];
}

export const DEFS_90S: DirectionDef[] = [
  {
    id: "grunge",
    title: "Grunge",
    vibe: "Flannel, baggy jeans and boots. Lived-in and a bit moody.",
    emoji: "🎸",
    keywords: ["grunge", "flannel", "nirvana", "moody"],
    pieces: [
      { piece: "Flannel shirt", have: ["flannel"], prefer: ["flannel", "grunge", "check"], category: "Tops" },
      { piece: "Baggy jeans", have: ["baggy"], prefer: ["baggy", "jeans", "flares"], category: "Bottoms" },
      { piece: "Lace-up boots", have: ["boots"], prefer: ["boots", "grunge"], category: "Shoes" },
      { piece: "Denim jacket", have: ["denim jacket"], prefer: ["denim", "windbreaker", "parka"], category: "Outerwear" },
    ],
  },
  {
    id: "britpop",
    title: "Britpop",
    vibe: "Parka, bucket hat and tinted shades. Festival queue energy.",
    emoji: "🎩",
    keywords: ["britpop", "parka", "bucket hat", "oasis", "blur", "festival"],
    pieces: [
      { piece: "Parka", have: ["parka"], prefer: ["parka", "windbreaker"], category: "Outerwear" },
      { piece: "Bucket hat", have: ["bucket hat"], prefer: ["bucket hat", "britpop"], category: "Accessories" },
      { piece: "Tinted sunglasses", have: ["sunglasses", "shades"], prefer: ["sunglasses", "tinted"], category: "Accessories" },
      { piece: "Striped top", have: ["striped", "stripes", "rugby"], prefer: ["rugby", "stripes"], category: "Tops" },
      { piece: "Jeans", have: ["jeans"], prefer: ["jeans", "baggy", "flares"], category: "Bottoms" },
    ],
  },
  {
    id: "pop-star",
    title: "Pop star",
    vibe: "Platforms, slip dress and butterfly clips. Spice Girls on a night out.",
    emoji: "🦋",
    keywords: ["pop star", "popstar", "pop", "spice", "slip dress", "butterfly", "girly"],
    pieces: [
      { piece: "Platform trainers", have: ["platform"], prefer: ["platforms", "trainers"], category: "Shoes" },
      { piece: "Slip dress", have: ["slip dress"], prefer: ["slip dress"], charityFirst: true, category: "Tops" },
      { piece: "Butterfly clips", have: ["butterfly"], prefer: ["butterfly"], category: "Accessories" },
      { piece: "Scrunchies", have: ["scrunchie"], prefer: ["scrunchie"], category: "Accessories" },
      { piece: "Velvet choker", have: ["choker"], prefer: ["choker"], category: "Accessories" },
    ],
  },
  {
    id: "rave-kid",
    title: "Rave kid",
    vibe: "Shell suit and neon windbreaker. Loud on purpose.",
    emoji: "🪩",
    keywords: ["rave", "neon", "shell suit", "shellsuit", "tracksuit", "windbreaker", "loud"],
    pieces: [
      { piece: "Shell suit", have: ["shell suit", "tracksuit"], prefer: ["shell suit", "tracksuit"], category: "Outerwear" },
      { piece: "Neon windbreaker", have: ["windbreaker"], prefer: ["windbreaker", "neon"], category: "Outerwear" },
      { piece: "Track pants", have: ["track pants"], prefer: ["poppers", "tracksuit"], category: "Bottoms" },
      { piece: "Chunky trainers", have: ["trainers"], prefer: ["platforms", "trainers"], category: "Shoes" },
      { piece: "Mini backpack", have: ["backpack"], prefer: ["bag", "mini"], category: "Accessories" },
    ],
  },
];

export const DEFS_FANCY: DirectionDef[] = [
  {
    id: "pirate",
    title: "Pirate",
    vibe: "Tricorn hat, striped top and a proper belt. Arrr.",
    emoji: "🏴‍☠️",
    keywords: ["pirate", "arrr"],
    pieces: [
      { piece: "Pirate hat", have: ["tricorn"], prefer: ["pirate", "hat"], category: "Costume" },
      { piece: "Pirate coat", have: ["pirate coat"], prefer: ["pirate"], category: "Costume" },
      { piece: "Striped top", have: ["striped", "stripes"], prefer: ["stripes", "rugby"], category: "Tops" },
      { piece: "Leather belt", have: ["belt"], prefer: ["belt"], category: "Accessories" },
    ],
  },
  {
    id: "toga",
    title: "Toga party",
    vibe: "White sheet, gold belt and a laurel wreath. Very Classics.",
    emoji: "🏛️",
    keywords: ["toga", "roman", "classics", "greek"],
    pieces: [
      { piece: "Toga", have: ["toga"], prefer: ["toga", "roman"], category: "Costume" },
      { piece: "Laurel wreath", have: ["wreath"], prefer: ["wreath", "toga"], category: "Costume" },
      { piece: "Gold rope belt", have: ["belt"], prefer: ["belt"], category: "Accessories" },
      { piece: "Sandals", have: ["sandals"], prefer: ["sandals", "jelly"], category: "Shoes" },
    ],
  },
  {
    id: "superhero",
    title: "Superhero",
    vibe: "Cape, mask and boots. Add your own initial.",
    emoji: "🦸",
    keywords: ["superhero", "hero", "cape", "batman", "marvel"],
    pieces: [
      { piece: "Cape", have: ["cape"], prefer: ["cape", "superhero"], category: "Costume" },
      { piece: "Mask", have: ["mask"], prefer: ["mask", "superhero"], category: "Costume" },
      { piece: "Red boots", have: ["boots"], prefer: ["boots", "superhero"], category: "Shoes" },
      { piece: "Plain tee", have: ["tee", "t-shirt"], prefer: ["tee"], category: "Tops" },
    ],
  },
  {
    id: "disco",
    title: "Disco",
    vibe: "Sequins, flares and platform boots. Straight off the 70s dance floor.",
    emoji: "🪩",
    keywords: ["disco", "sequin", "70s", "abba", "glitter"],
    pieces: [
      { piece: "Sequin outfit", have: ["sequin"], prefer: ["disco", "sequins"], category: "Costume" },
      { piece: "Flares", have: ["flares"], prefer: ["flares", "disco"], category: "Bottoms" },
      { piece: "Platform boots", have: ["platform boots"], prefer: ["platforms", "boots"], category: "Shoes" },
      { piece: "Hoop earrings", have: ["hoops"], prefer: ["hoops", "earrings"], category: "Accessories" },
    ],
  },
  {
    id: "wizard",
    title: "Wizard",
    vibe: "Starry robe, pointy hat and one slightly bent wand.",
    emoji: "🧙",
    keywords: ["wizard", "witch", "harry potter", "magic", "halloween"],
    pieces: [
      { piece: "Wizard robe", have: ["robe"], prefer: ["wizard", "robe"], category: "Costume" },
      { piece: "Pointy hat", have: ["pointy hat"], prefer: ["wizard", "hat"], category: "Costume" },
      { piece: "Black boots", have: ["boots"], prefer: ["boots"], category: "Shoes" },
    ],
  },
  {
    id: "cowboy",
    title: "Cowboy",
    vibe: "Wide-brim hat, check shirt and boots. Yeehaw.",
    emoji: "🤠",
    keywords: ["cowboy", "western", "yeehaw", "cowgirl"],
    pieces: [
      { piece: "Cowboy hat", have: ["cowboy hat"], prefer: ["cowboy", "hat"], category: "Costume" },
      { piece: "Check shirt", have: ["flannel", "check"], prefer: ["flannel", "check"], category: "Tops" },
      { piece: "Boots", have: ["boots"], prefer: ["boots"], category: "Shoes" },
      { piece: "Jeans", have: ["jeans"], prefer: ["jeans", "baggy"], category: "Bottoms" },
    ],
  },
];

/** Lower-cased piece name -> extra search terms + category, used by the Plan page's matcher. */
export const PIECE_HINTS = new Map<string, { prefer: string[]; category?: Category }>(
  [...DEFS_90S, ...DEFS_FANCY].flatMap((d) =>
    d.pieces.map((p) => [p.piece.toLowerCase(), { prefer: p.prefer, category: p.category }] as const)
  )
);

/** "under £20", "max 15", "budget of £30", "£10 max". Returns undefined when no budget was named. */
export function parseBudget(text: string): number | undefined {
  const a = /(?:under|below|less than|max(?:imum)?|up to|within|budget(?: of)?|no more than|<)\s*£?\s*(\d+(?:\.\d+)?)/i.exec(text);
  const b = /£\s*(\d+(?:\.\d+)?)\s*(?:budget|max|or less|limit|tops)/i.exec(text);
  const n = Number((a ?? b)?.[1]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Theme chips on the home page. Each one opens /plan?theme=<id> with the looks already shown (no typed message). */
export interface ThemeDef {
  id: string;
  label: string;
  /** Fed to the scripted bot to pick and order the looks (never shown as a user message). */
  query: string;
  /** BopBot's one-line intro above the look cards. */
  intro: string;
}

export const THEMES: ThemeDef[] = [
  { id: "college-bop-90s", label: "College bop – 90s", query: "College bop, 90s theme", intro: "Good theme, the 90s are easy to dress for. Here are four looks, checked against your wardrobe and what's within walking distance." },
  { id: "pirate-night", label: "Pirate night", query: "Pirate night", intro: "Arrr, pirate night. Here are a few looks, starting with the classic, checked against your wardrobe and what's nearby." },
  { id: "halloween", label: "Halloween", query: "Halloween", intro: "Spooky season. Here are a few looks that work for Halloween, checked against your wardrobe and what's nearby." },
  { id: "western", label: "Western", query: "Western night", intro: "Yeehaw. Here are a few looks, cowboy first, checked against your wardrobe and what's within walking distance." },
  { id: "toga-party", label: "Toga party", query: "Toga party", intro: "Very Classics. Here are a few looks, toga first, checked against your wardrobe and what's nearby." },
  { id: "disco", label: "Disco", query: "Disco night", intro: "Sequins at the ready. Here are a few looks, disco first, checked against your wardrobe and what's nearby." },
];

export const themeById = (id?: string | null) => THEMES.find((t) => t.id === id);
