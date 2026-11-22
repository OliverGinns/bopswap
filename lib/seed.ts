// BopSwap seed data — single file, easy to edit.
// All sellers are fictional. Coordinates are approximate college locations in central Oxford.

export type Theme = "90s" | "fancy-dress";
export type Category = "Tops" | "Bottoms" | "Outerwear" | "Shoes" | "Accessories" | "Costume";
export type Condition = "New" | "Like new" | "Good" | "Well loved";
export type Source = "local" | "vinted" | "amazon" | "facebook";
export type SellerType = "student" | "charity";

/** Fictional charity shops (no real partnerships implied). */
export interface CharityShop {
  id: string;
  name: string;
  cause: string;
  hours: string;
  pickupNote: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: Category;
  theme: Theme;
  size: string;
  condition: Condition;
  tags: string[];
  /** "swap" or a price in GBP */
  swapOrPrice: "swap" | number;
  sellerName: string;
  sellerType: SellerType;
  /** Set for charity listings */
  shop?: CharityShop;
  college?: string;
  lat?: number;
  lng?: number;
  imageEmoji: string;
  /** Uploaded photo (Supabase public URL or a data URL). Seed listings use the emoji instead. */
  imageUrl?: string;
  /** Two CSS colours for the card gradient */
  gradient: [string, string];
  source: Source;
  external?: boolean;
  delivery?: string;
}

export const DEFAULT_USER = { name: "You", college: "St Anne's College", lat: 51.762, lng: -1.2641 };

// College coordinates (approx.)
const C = {
  stAnnes: { college: "St Anne's", lat: 51.762, lng: -1.2641 },
  keble: { college: "Keble", lat: 51.7596, lng: -1.2616 },
  univ: { college: "University College", lat: 51.7524, lng: -1.2528 },
  magdalen: { college: "Magdalen", lat: 51.7523, lng: -1.243 },
  jesus: { college: "Jesus", lat: 51.7536, lng: -1.257 },
  wadham: { college: "Wadham", lat: 51.7589, lng: -1.2543 },
  balliol: { college: "Balliol", lat: 51.7544, lng: -1.2564 },
  christChurch: { college: "Christ Church", lat: 51.7499, lng: -1.2562 },
  merton: { college: "Merton", lat: 51.7508, lng: -1.2512 },
  worcester: { college: "Worcester", lat: 51.755, lng: -1.264 },
  stJohns: { college: "St John's", lat: 51.7585, lng: -1.259 },
  somerville: { college: "Somerville", lat: 51.76, lng: -1.264 },
  lmh: { college: "Lady Margaret Hall", lat: 51.769, lng: -1.26 },
  brasenose: { college: "Brasenose", lat: 51.7536, lng: -1.2538 },
  oriel: { college: "Oriel", lat: 51.7511, lng: -1.2545 },
  queens: { college: "Queen's", lat: 51.7525, lng: -1.2509 },
  pembroke: { college: "Pembroke", lat: 51.75, lng: -1.26 },
  stHildas: { college: "St Hilda's", lat: 51.7466, lng: -1.2434 },
};

/** Pickup spots offered on /sell. */
export const COLLEGES = Object.values(C).sort((a, b) => a.college.localeCompare(b.college));

type LocalInput = Omit<Listing, "source" | "external" | "delivery" | "sellerType" | "shop">;
const local = (l: LocalInput): Listing => ({ ...l, source: "local", sellerType: "student" });

export const CHARITY_PICKUP = "Pick up in store today, open until 5pm";

export const SHOPS = {
  cowley: { id: "s1", name: "Cowley Road Charity Shop", cause: "Supporting local youth music projects", hours: "Mon–Sat 9am–5pm", pickupNote: CHARITY_PICKUP, address: "Cowley Road, East Oxford", lat: 51.7487, lng: -1.2397 },
  summertown: { id: "s2", name: "Summertown Hospice Shop", cause: "Funding end-of-life care at a local hospice", hours: "Mon–Sat 9:30am–5pm", pickupNote: CHARITY_PICKUP, address: "Banbury Road, Summertown", lat: 51.7745, lng: -1.2649 },
  jericho: { id: "s3", name: "Jericho Community Closet", cause: "Providing clothing and meals for people facing homelessness", hours: "Mon–Sat 10am–5pm", pickupNote: CHARITY_PICKUP, address: "Walton Street, Jericho", lat: 51.7568, lng: -1.2658 },
  stClements: { id: "s4", name: "St Clements Aid Shop", cause: "Supporting refugee families settling in Oxford", hours: "Mon–Sat 9am–5pm", pickupNote: CHARITY_PICKUP, address: "St Clements Street, East Oxford", lat: 51.7502, lng: -1.2395 },
} satisfies Record<string, CharityShop>;

type CharityInput = Omit<Listing, "source" | "external" | "delivery" | "sellerType" | "shop" | "sellerName" | "lat" | "lng" | "college" | "swapOrPrice"> & {
  shop: CharityShop;
  price: number;
};
// Charity items are fixed price, never swap.
const charity = ({ shop, price, ...l }: CharityInput): Listing => ({
  ...l,
  swapOrPrice: price,
  sellerName: shop.name,
  sellerType: "charity",
  shop,
  lat: shop.lat,
  lng: shop.lng,
  source: "local",
});

export const LOCAL_LISTINGS: Listing[] = [
  // ---------- 90s (20) ----------
  local({ id: "l01", title: "Oversized denim jacket", description: "Proper faded 90s wash with a bit of distressing on the cuffs. Warm, roomy, goes with everything.", category: "Outerwear", theme: "90s", size: "M", condition: "Good", tags: ["denim", "oversized", "vintage"], swapOrPrice: "swap", sellerName: "Maya Patel", ...C.keble, imageEmoji: "🧥", gradient: ["#3b82f6", "#1e3a8a"] }),
  local({ id: "l02", title: "Purple & teal shell suit", description: "Full shell suit, jacket + bottoms. Swishes beautifully. Worn once for a Bop night.", category: "Outerwear", theme: "90s", size: "L", condition: "Like new", tags: ["shell suit", "tracksuit", "retro"], swapOrPrice: 5, sellerName: "Tom Whitfield", ...C.univ, imageEmoji: "🏃", gradient: ["#a855f7", "#14b8a6"] }),
  local({ id: "l03", title: "Chunky platform trainers", description: "White platform trainers, thick sole, great for dancing. Size 5, slight scuff on left toe.", category: "Shoes", theme: "90s", size: "UK 5", condition: "Good", tags: ["platforms", "trainers", "spice girls"], swapOrPrice: 6, sellerName: "Imogen Clarke", ...C.stAnnes, imageEmoji: "👟", gradient: ["#f472b6", "#fde047"] }),
  local({ id: "l04", title: "Butterfly hair clips (set of 8)", description: "Glittery butterfly clips in assorted neon colours. Instant 1998.", category: "Accessories", theme: "90s", size: "One size", condition: "New", tags: ["hair", "butterfly", "glitter"], swapOrPrice: 2, sellerName: "Priya Nair", ...C.jesus, imageEmoji: "🦋", gradient: ["#ec4899", "#8b5cf6"] }),
  local({ id: "l05", title: "Reversible bucket hat", description: "Reversible leopard print / plain black. Classic Britpop festival energy.", category: "Accessories", theme: "90s", size: "One size", condition: "Good", tags: ["bucket hat", "britpop", "festival"], swapOrPrice: "swap", sellerName: "Callum Reid", ...C.wadham, imageEmoji: "🎩", gradient: ["#facc15", "#f97316"] }),
  local({ id: "l06", title: "Baggy light-wash jeans", description: "Super baggy, low rise, long enough to drag. Authentic skater fit.", category: "Bottoms", theme: "90s", size: "W30 L32", condition: "Good", tags: ["jeans", "baggy", "skater"], swapOrPrice: 5, sellerName: "Jordan Mensah", ...C.balliol, imageEmoji: "👖", gradient: ["#60a5fa", "#1d4ed8"] }),
  local({ id: "l07", title: "Scrunchie bundle (10)", description: "Velvet and satin scrunchies in every colour. Ten for the price of three.", category: "Accessories", theme: "90s", size: "One size", condition: "New", tags: ["scrunchie", "hair", "velvet"], swapOrPrice: 2, sellerName: "Freya Lindqvist", ...C.christChurch, imageEmoji: "🎀", gradient: ["#fb7185", "#f472b6"] }),
  local({ id: "l08", title: "Black velvet choker", description: "Classic stretch tattoo choker, three-pack. Perfect with a slip dress.", category: "Accessories", theme: "90s", size: "One size", condition: "New", tags: ["choker", "tattoo", "goth"], swapOrPrice: "swap", sellerName: "Aisha Rahman", ...C.magdalen, imageEmoji: "📿", gradient: ["#1f2937", "#6d28d9"] }),
  local({ id: "l09", title: "Neon windbreaker", description: "Lime and pink colour-block windbreaker. Rustles. Packs into its own pocket.", category: "Outerwear", theme: "90s", size: "M", condition: "Like new", tags: ["windbreaker", "neon", "colour block"], swapOrPrice: 5, sellerName: "Ben Okafor", ...C.merton, imageEmoji: "🧥", gradient: ["#a3e635", "#ec4899"] }),
  local({ id: "l10", title: "Red check flannel shirt", description: "Grunge staple. Soft from a thousand washes. Tie it round your waist.", category: "Tops", theme: "90s", size: "L", condition: "Well loved", tags: ["flannel", "grunge", "check"], swapOrPrice: "swap", sellerName: "Sam Hartley", ...C.worcester, imageEmoji: "👔", gradient: ["#ef4444", "#7f1d1d"] }),
  local({ id: "l11", title: "Slip dress, champagne satin", description: "Bias-cut satin slip dress with thin straps. Kate Moss approved.", category: "Tops", theme: "90s", size: "S", condition: "Like new", tags: ["slip dress", "satin", "going out"], swapOrPrice: 6, sellerName: "Sophie Wang", ...C.somerville, imageEmoji: "👗", gradient: ["#fde68a", "#f9a8d4"] }),
  local({ id: "l12", title: "Striped rugby shirt", description: "Chunky striped rugby shirt, navy/red/white. Thick cotton, collared.", category: "Tops", theme: "90s", size: "M", condition: "Good", tags: ["rugby", "stripes", "preppy"], swapOrPrice: 4, sellerName: "Oscar Bellamy", ...C.stJohns, imageEmoji: "🏉", gradient: ["#1e40af", "#dc2626"] }),
  local({ id: "l13", title: "Tinted round sunglasses", description: "Small round lenses in orange tint. Very Matrix, very 90s.", category: "Accessories", theme: "90s", size: "One size", condition: "Good", tags: ["sunglasses", "round", "tinted"], swapOrPrice: 2, sellerName: "Leila Haddad", ...C.lmh, imageEmoji: "🕶️", gradient: ["#fb923c", "#facc15"] }),
  local({ id: "l14", title: "Cherry red 8-eye boots", description: "Cherry red leather boots, broken in and comfy. Slight creasing, loads of life left.", category: "Shoes", theme: "90s", size: "UK 6", condition: "Good", tags: ["boots", "grunge", "leather"], swapOrPrice: 6, sellerName: "Ruby Thornton", ...C.brasenose, imageEmoji: "🥾", gradient: ["#b91c1c", "#450a0a"] }),
  local({ id: "l15", title: "Tie-dye baby tee", description: "Cropped baby tee in pink/yellow tie-dye. Soft and stretchy.", category: "Tops", theme: "90s", size: "S", condition: "Like new", tags: ["tie-dye", "crop", "tee"], swapOrPrice: 3, sellerName: "Nadia Kowalski", ...C.oriel, imageEmoji: "👚", gradient: ["#f472b6", "#fde047"] }),
  local({ id: "l16", title: "Popper track pants", description: "Navy popper-side track pants with white stripes. Dance-floor ready.", category: "Bottoms", theme: "90s", size: "M", condition: "Good", tags: ["tracksuit", "poppers", "sporty"], swapOrPrice: "swap", sellerName: "Daniel Foster", ...C.queens, imageEmoji: "🩳", gradient: ["#1e3a8a", "#0ea5e9"] }),
  local({ id: "l17", title: "Mini backpack, holographic", description: "Tiny holographic backpack that fits phone, keys, lip gloss and nothing else.", category: "Accessories", theme: "90s", size: "One size", condition: "Like new", tags: ["bag", "holographic", "mini"], swapOrPrice: 4, sellerName: "Chloe Banerjee", ...C.pembroke, imageEmoji: "🎒", gradient: ["#67e8f9", "#c084fc"] }),
  local({ id: "l18", title: "Bootcut flares, dark denim", description: "Dark indigo flares, high waist. Rarely worn, really flattering.", category: "Bottoms", theme: "90s", size: "W28 L30", condition: "Like new", tags: ["flares", "denim", "bootcut"], swapOrPrice: 5, sellerName: "Hannah Doyle", ...C.stHildas, imageEmoji: "👖", gradient: ["#312e81", "#6366f1"] }),
  local({ id: "l19", title: "Britpop parka", description: "Olive parka with fur-trim hood. Proper festival-queue energy.", category: "Outerwear", theme: "90s", size: "L", condition: "Good", tags: ["parka", "britpop", "winter"], swapOrPrice: 6, sellerName: "Liam Gallagher-Smith", ...C.keble, imageEmoji: "🧥", gradient: ["#65a30d", "#365314"] }),
  local({ id: "l20", title: "Glitter jelly sandals", description: "Pink glitter jelly sandals, waterproof and shamelessly fun.", category: "Shoes", theme: "90s", size: "UK 4", condition: "Good", tags: ["jelly", "glitter", "summer"], swapOrPrice: "swap", sellerName: "Zara Ahmed", ...C.stAnnes, imageEmoji: "👡", gradient: ["#f9a8d4", "#e879f9"] }),

  // ---------- Other themes (10) ----------
  local({ id: "l21", title: "Pirate captain hat", description: "Felt tricorn with skull badge and feather. Arrr you coming to the bop?", category: "Costume", theme: "fancy-dress", size: "One size", condition: "Good", tags: ["pirate", "hat", "fancy dress"], swapOrPrice: 3, sellerName: "Archie Pemberton", ...C.univ, imageEmoji: "🏴‍☠️", gradient: ["#1f2937", "#b45309"] }),
  local({ id: "l22", title: "Roman toga (bedsheet style)", description: "Proper bedsheet toga with gold-rope belt and laurel wreath included.", category: "Costume", theme: "fancy-dress", size: "One size", condition: "Good", tags: ["toga", "roman", "classics"], swapOrPrice: "swap", sellerName: "Marcus Aurelio-Jones", ...C.balliol, imageEmoji: "🏛️", gradient: ["#f5f5f4", "#facc15"] }),
  local({ id: "l23", title: "Cowboy hat, tan suede", description: "Wide brim, braided band. Yeehaw. Very sturdy, survives a mosh pit.", category: "Costume", theme: "fancy-dress", size: "One size", condition: "Like new", tags: ["cowboy", "western", "hat"], swapOrPrice: 4, sellerName: "Jess Calloway", ...C.jesus, imageEmoji: "🤠", gradient: ["#d97706", "#78350f"] }),
  local({ id: "l24", title: "Pink tulle tutu", description: "Layered hot pink tutu, elastic waist. Fits most sizes, full and fluffy.", category: "Costume", theme: "fancy-dress", size: "One size", condition: "Like new", tags: ["tutu", "ballet", "tulle"], swapOrPrice: 3, sellerName: "Eleanor Voss", ...C.magdalen, imageEmoji: "🩰", gradient: ["#f472b6", "#fbcfe8"] }),
  local({ id: "l25", title: "Superhero cape, red satin", description: "Floor-length red satin cape with gold clasp. Add your own initial.", category: "Costume", theme: "fancy-dress", size: "One size", condition: "Good", tags: ["superhero", "cape", "satin"], swapOrPrice: "swap", sellerName: "Rohan Desai", ...C.christChurch, imageEmoji: "🦸", gradient: ["#dc2626", "#fbbf24"] }),
  local({ id: "l26", title: "Wizard robe & hat set", description: "Midnight blue with silver stars. Includes pointy hat and a wand (slightly bent).", category: "Costume", theme: "fancy-dress", size: "M/L", condition: "Good", tags: ["wizard", "stars", "robe"], swapOrPrice: 5, sellerName: "Fern Whitaker", ...C.wadham, imageEmoji: "🧙", gradient: ["#1e3a8a", "#7c3aed"] }),
  local({ id: "l27", title: "Inflatable dinosaur costume", description: "T-rex inflatable suit with built-in fan. Hilarious. Batteries included.", category: "Costume", theme: "fancy-dress", size: "One size", condition: "Like new", tags: ["dinosaur", "inflatable", "funny"], swapOrPrice: 6, sellerName: "Gabe Lindholm", ...C.merton, imageEmoji: "🦖", gradient: ["#22c55e", "#14532d"] }),
  local({ id: "l28", title: "Angel wings & halo", description: "Feathery white wings on elastic straps, plus light-up halo headband.", category: "Costume", theme: "fancy-dress", size: "One size", condition: "Good", tags: ["angel", "wings", "halo"], swapOrPrice: 3, sellerName: "Tilly Grant", ...C.worcester, imageEmoji: "😇", gradient: ["#e0f2fe", "#fef9c3"] }),
  local({ id: "l29", title: "Viking helmet with braids", description: "Horned helmet with attached plaited ginger wig. Skål!", category: "Costume", theme: "fancy-dress", size: "One size", condition: "Well loved", tags: ["viking", "helmet", "wig"], swapOrPrice: "swap", sellerName: "Erik Solberg", ...C.stJohns, imageEmoji: "⚔️", gradient: ["#64748b", "#b45309"] }),
  local({ id: "l30", title: "Disco jumpsuit, silver sequins", description: "Full-length sequinned flares jumpsuit. Heavy, sparkly and extremely fun.", category: "Costume", theme: "fancy-dress", size: "M", condition: "Like new", tags: ["disco", "sequins", "70s"], swapOrPrice: 6, sellerName: "Bella Rossi", ...C.somerville, imageEmoji: "🪩", gradient: ["#cbd5e1", "#f472b6"] }),
];

export const CHARITY_LISTINGS: Listing[] = [
  charity({ id: "c01", shop: SHOPS.cowley, title: "90s denim bundle: jacket + baggy jeans", description: "Two-piece 90s denim set: faded jacket and baggy light-wash jeans, donated and sorted by volunteers.", category: "Outerwear", theme: "90s", size: "M / W30", condition: "Good", tags: ["denim", "90s", "bundle"], price: 6, imageEmoji: "🧥", gradient: ["#3b82f6", "#1e3a8a"] }),
  charity({ id: "c02", shop: SHOPS.cowley, title: "Disco set: sequin top, flares & platform boots", description: "Three pieces for a 70s disco night: sparkly sequin top, flared trousers and silver platform boots.", category: "Costume", theme: "fancy-dress", size: "S–M", condition: "Good", tags: ["disco", "sequins", "70s"], price: 8, imageEmoji: "🪩", gradient: ["#cbd5e1", "#f472b6"] }),
  charity({ id: "c03", shop: SHOPS.summertown, title: "Shell suit + bucket hat combo", description: "Bright retro shell suit with a matching reversible bucket hat. Full Britpop weekend look.", category: "Outerwear", theme: "90s", size: "L", condition: "Like new", tags: ["shell suit", "bucket hat", "retro"], price: 7, imageEmoji: "🏃", gradient: ["#a855f7", "#14b8a6"] }),
  charity({ id: "c04", shop: SHOPS.summertown, title: "Pirate kit: coat, hat & belt", description: "Velvet-trim pirate coat, tricorn hat and wide buckle belt. Arrr.", category: "Costume", theme: "fancy-dress", size: "M/L", condition: "Good", tags: ["pirate", "hat", "fancy dress"], price: 6, imageEmoji: "🏴‍☠️", gradient: ["#1f2937", "#b45309"] }),
  charity({ id: "c05", shop: SHOPS.jericho, title: "Grunge pack: flannel, band tee & boots", description: "Red check flannel, faded band tee and scuffed black boots. Peak 1994.", category: "Tops", theme: "90s", size: "M / UK 6", condition: "Well loved", tags: ["grunge", "flannel", "boots"], price: 7, imageEmoji: "👔", gradient: ["#ef4444", "#7f1d1d"] }),
  charity({ id: "c06", shop: SHOPS.jericho, title: "Toga party set: toga, wreath & sandals", description: "Clean white toga, gold laurel wreath and strappy sandals. Ready for the quad.", category: "Costume", theme: "fancy-dress", size: "One size", condition: "Good", tags: ["toga", "roman", "classics"], price: 3, imageEmoji: "🏛️", gradient: ["#f5f5f4", "#facc15"] }),
  charity({ id: "c07", shop: SHOPS.stClements, title: "Slip dress, choker & butterfly clips", description: "Satin slip dress with a velvet choker and a handful of butterfly clips: the full going-out look.", category: "Tops", theme: "90s", size: "S–M", condition: "Like new", tags: ["slip dress", "choker", "butterfly"], price: 5, imageEmoji: "👗", gradient: ["#fde68a", "#f9a8d4"] }),
  charity({ id: "c08", shop: SHOPS.stClements, title: "Superhero bundle: cape, mask & boots", description: "Red satin cape, matching mask and shiny red boots. Add your own initial.", category: "Costume", theme: "fancy-dress", size: "One size / UK 7", condition: "Good", tags: ["superhero", "cape", "mask"], price: 5, imageEmoji: "🦸", gradient: ["#dc2626", "#fbbf24"] }),
];

type ExtInput = Pick<
  Listing,
  "id" | "title" | "description" | "category" | "theme" | "size" | "condition" | "tags" | "sellerName" | "imageEmoji" | "gradient"
> & { source: Exclude<Source, "local">; price: number };
const ext = ({ price, ...l }: ExtInput): Listing => ({ ...l, sellerType: "student", swapOrPrice: price, external: true, delivery: "2-4 days" });

export const EXTERNAL_LISTINGS: Listing[] = [
  ext({ id: "e01", title: "Vintage 90s denim jacket", description: "Pre-loved stonewash denim jacket, shipped from a private seller.", category: "Outerwear", theme: "90s", size: "M", condition: "Good", tags: ["denim", "vintage"], sellerName: "vinted_seller_92", imageEmoji: "🧥", gradient: ["#3b82f6", "#1e3a8a"], source: "vinted", price: 10 }),
  ext({ id: "e02", title: "Retro shell suit, full set", description: "Multicoloured shell suit tracksuit set, next-day dispatch.", category: "Outerwear", theme: "90s", size: "L", condition: "New", tags: ["shell suit", "retro"], sellerName: "RetroRaves", imageEmoji: "🏃", gradient: ["#a855f7", "#14b8a6"], source: "amazon", price: 12 }),
  ext({ id: "e03", title: "Chunky platform trainers", description: "Platform trainers in white, listed in a local marketplace group.", category: "Shoes", theme: "90s", size: "UK 6", condition: "Like new", tags: ["platforms", "trainers"], sellerName: "Marketplace seller", imageEmoji: "👟", gradient: ["#f472b6", "#fde047"], source: "facebook", price: 11 }),
  ext({ id: "e04", title: "Butterfly clips mega pack", description: "50 butterfly hair clips, assorted colours.", category: "Accessories", theme: "90s", size: "One size", condition: "New", tags: ["hair", "butterfly"], sellerName: "ClipCo", imageEmoji: "🦋", gradient: ["#ec4899", "#8b5cf6"], source: "amazon", price: 4 }),
  ext({ id: "e05", title: "Pirate costume full set", description: "Hat, coat, belt and eyepatch, adult size.", category: "Costume", theme: "fancy-dress", size: "M", condition: "New", tags: ["pirate", "costume"], sellerName: "PartyHeaven", imageEmoji: "🏴‍☠️", gradient: ["#1f2937", "#b45309"], source: "amazon", price: 11 }),
  ext({ id: "e06", title: "Baggy jeans, wide leg", description: "Wide-leg baggy jeans, barely worn.", category: "Bottoms", theme: "90s", size: "W32", condition: "Like new", tags: ["jeans", "baggy"], sellerName: "vinted_denimqueen", imageEmoji: "👖", gradient: ["#60a5fa", "#1d4ed8"], source: "vinted", price: 8 }),
  ext({ id: "e07", title: "Superhero cape set", description: "Cape and mask, adult size, satin finish.", category: "Costume", theme: "fancy-dress", size: "One size", condition: "New", tags: ["superhero", "cape"], sellerName: "CostumeKing", imageEmoji: "🦸", gradient: ["#dc2626", "#fbbf24"], source: "amazon", price: 7 }),
  ext({ id: "e08", title: "Flannel shirt, grunge check", description: "Oversized flannel from a clear-out group post.", category: "Tops", theme: "90s", size: "XL", condition: "Good", tags: ["flannel", "grunge"], sellerName: "Marketplace seller", imageEmoji: "👔", gradient: ["#ef4444", "#7f1d1d"], source: "facebook", price: 5 }),
  ext({ id: "e09", title: "Neon windbreaker jacket", description: "Colour-block neon windbreaker, lightly worn.", category: "Outerwear", theme: "90s", size: "S", condition: "Like new", tags: ["windbreaker", "neon"], sellerName: "vinted_retrofits", imageEmoji: "🧥", gradient: ["#a3e635", "#ec4899"], source: "vinted", price: 9 }),
  ext({ id: "e10", title: "Chunky gold hoop earrings", description: "Thick 90s-style gold hoops, pair, posted from a private seller.", category: "Accessories", theme: "90s", size: "One size", condition: "New", tags: ["hoops", "earrings", "gold"], sellerName: "vinted_goldie", imageEmoji: "⭕", gradient: ["#fde047", "#f59e0b"], source: "vinted", price: 5 }),
];

export const ALL_LISTINGS: Listing[] = [...LOCAL_LISTINGS, ...CHARITY_LISTINGS, ...EXTERNAL_LISTINGS];

export const SOURCE_LABEL: Record<Source, string> = {
  local: "BopSwap local",
  vinted: "Vinted",
  amazon: "Amazon",
  facebook: "Facebook Marketplace",
};

export function getListing(id: string): Listing | undefined {
  return ALL_LISTINGS.find((l) => l.id === id);
}

/** Great-circle distance in metres. */
export function distanceMetres(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distance + walking time (~4.8 km/h) from the default user location. Null for external listings. */
export function distanceInfo(l: Listing): { metres: number; label: string; walkMins: number } | null {
  if (l.lat == null || l.lng == null) return null;
  const metres = distanceMetres(DEFAULT_USER.lat, DEFAULT_USER.lng, l.lat, l.lng);
  const walkMins = Math.max(1, Math.round(metres / 80));
  const label = metres < 1000 ? `${Math.max(10, Math.round(metres / 10) * 10)} m` : `${(metres / 1000).toFixed(1)} km`;
  return { metres, label, walkMins };
}

export function formatPrice(p: "swap" | number): string {
  return p === "swap" ? "Swap" : `£${p.toFixed(2).replace(/\.00$/, "")}`;
}

/** Map pin colour: charity shops green, student listings pink. */
export const PIN_COLOUR: Record<SellerType, string> = { student: "#E8745A", charity: "#2F5D3A" };
