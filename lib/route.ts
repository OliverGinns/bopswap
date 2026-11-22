import { DEFAULT_USER, Listing, distanceMetres } from "./seed";

export interface Leg {
  to: Listing;
  metres: number;
  mins: number;
}

/** Walk-time rule matches distanceInfo (80 m per minute); stops at the same spot cost 0. */
const minsFor = (metres: number) => (metres < 30 ? 0 : Math.max(1, Math.round(metres / 80)));

/** Nearest-neighbour walking route You -> each local stop. Online listings (no location) are skipped. */
export function planRoute(listings: Listing[]): { legs: Leg[]; totalMins: number } {
  const left = listings.filter((l) => !l.external && l.lat != null && l.lng != null);
  let lat = DEFAULT_USER.lat;
  let lng = DEFAULT_USER.lng;
  const legs: Leg[] = [];
  while (left.length) {
    let best = 0;
    let bestD = Infinity;
    left.forEach((l, i) => {
      const d = distanceMetres(lat, lng, l.lat!, l.lng!);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const [to] = left.splice(best, 1);
    legs.push({ to, metres: bestD, mins: minsFor(bestD) });
    lat = to.lat!;
    lng = to.lng!;
  }
  return { legs, totalMins: legs.reduce((s, l) => s + l.mins, 0) };
}
