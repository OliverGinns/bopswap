// Natural, cartoon palette helpers. Tokens themselves live in app/globals.css.

export const PALETTE = {
  canvas: "#F4EFE6",
  cream: "#FBF8F1",
  ink: "#2B2B2B",
  forest: "#2F5D3A",
  leaf: "#5B9A5B",
  sage: "#CFE0C8",
  stone: "#8A877E",
  mustard: "#E9B949",
  coral: "#E8745A",
} as const;

/** Soft pastel fills for listing/wardrobe placeholders (replaces the old neon seed gradients). */
const SOFT_FILLS = ["#CFE0C8", "#F3DFA2", "#F4C9BC", "#DCE8D2", "#EFE3C8", "#C5DCCB"];

export function softFill(key: string): string {
  let h = 7;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return SOFT_FILLS[h % SOFT_FILLS.length];
}
