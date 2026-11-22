import { ALL_LISTINGS, Listing } from "./seed";
import { toListing } from "./userListings";

/**
 * Turn untrusted user-upload objects (sent by the client) into Listings. Anything malformed is dropped.
 * Photos are never trusted from the client here: the bot only needs the text fields.
 */
export function sanitizeUploads(raw: unknown): Listing[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 60)
    .map((r) => toListing(r && typeof r === "object" ? { ...r, imageUrl: undefined, image_url: undefined } : r))
    .filter((l): l is Listing => !!l);
}

/** Seed data plus any user uploads (uploads can't shadow a seed id). */
export function buildInventory(uploads?: unknown): Listing[] {
  const seedIds = new Set(ALL_LISTINGS.map((l) => l.id));
  return [...ALL_LISTINGS, ...sanitizeUploads(uploads).filter((u) => !seedIds.has(u.id))];
}
