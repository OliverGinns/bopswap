import type { Direction, OutfitPiece } from "@/lib/botTypes";

export interface UiMsg {
  id: number;
  role: "user" | "assistant";
  text: string;
  directions?: Direction[];
  outfit?: OutfitPiece[];
  followUp?: string;
  /** Local-only message (greeting, dock-chat replies): never sent to the API. */
  local?: boolean;
}

export type ChoiceKind = "handover" | "pickup" | "online" | "swap" | "offer";

/** What the user did for one outfit slot. Simulated: nothing is sent anywhere. */
export interface Choice {
  listingId: string;
  kind: ChoiceKind;
  /** Money out of the user's pocket for this piece (swap = 0). */
  cost: number;
  label: string;
  /** The saved offer behind this choice (so replacing the choice retracts it). */
  offerId?: string;
}
