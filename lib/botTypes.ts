// Shared shapes for BopBot. Both the live (Claude) and scripted bots return BotReply,
// so the UI can't tell which one answered.

export type PieceStatus = "have" | "local" | "external" | "missing";

export interface OutfitPiece {
  piece: string;
  status: PieceStatus;
  listingId?: string;
}

/** One outfit idea shown as a tappable card in the Plan phase. */
export interface Direction {
  id: string;
  title: string;
  /** One-line vibe. */
  vibe: string;
  emoji: string;
  pieces: OutfitPiece[];
}

export interface BotReply {
  message: string;
  directions?: Direction[];
  outfit?: OutfitPiece[];
  followUp?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Only on assistant messages: lets the live bot see its own earlier JSON. */
  outfit?: OutfitPiece[];
  directions?: Direction[];
}

/** The slice of a wardrobe item BopBot needs (no photos). */
export interface WardrobeLite {
  name: string;
  category: string;
  colour: string;
  tags: string[];
}

export type BotMode = "live" | "scripted";
