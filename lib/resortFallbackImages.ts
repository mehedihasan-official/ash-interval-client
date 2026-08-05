// Fallback photo pool used when a resort's own image URL(s) from the
// dataset are missing or broken (dead link, 404, host no longer serving
// the file, etc). The bulk-imported dataset (1,700+ resorts) has a
// meaningful chunk of rows with stale/broken `img` fields, and re-crawling
// or manually fixing each one isn't practical right now — so instead of
// ever showing a "broken image" box or a single repeated placeholder, we
// show a real, high-quality resort/vacation-property photo instead.
//
// Each entry is a real photograph (general resort/hotel/villa/pool
// exteriors and interiors — nothing tied to a specific named property),
// served from Unsplash's stable image CDN. `unsplash.com`'s source images
// are free to use and the URLs below pin a specific photo ID (not a
// search query), so the same URL always resolves to the same image.
//
// This is intentionally a flat list rather than anything resort-specific:
// we're not claiming "this is a photo of resort X", we're substituting a
// generic, real vacation-resort photo so the layout never shows a broken
// image icon. If per-resort photos are sourced later, this list can shrink
// or go away entirely.
export const RESORT_FALLBACK_IMAGES: string[] = [
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80&auto=format&fit=crop", // infinity pool over ocean
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80&auto=format&fit=crop", // resort pool with loungers
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80&auto=format&fit=crop", // overwater bungalows
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80&auto=format&fit=crop", // tropical resort pool
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80&auto=format&fit=crop", // hotel exterior with palms
  "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=1200&q=80&auto=format&fit=crop", // resort villa exterior
  "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=1200&q=80&auto=format&fit=crop", // beach resort aerial
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80&auto=format&fit=crop", // luxury hotel room
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&q=80&auto=format&fit=crop", // resort suite interior
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80&auto=format&fit=crop", // poolside cabana
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80&auto=format&fit=crop", // resort at sunset
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80&auto=format&fit=crop", // hotel pool deck
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80&auto=format&fit=crop", // mountain lodge resort
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80&auto=format&fit=crop", // beachfront resort walkway
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80&auto=format&fit=crop", // resort lobby / entrance
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80&auto=format&fit=crop", // tropical resort grounds
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200&q=80&auto=format&fit=crop", // resort balcony ocean view
  "https://images.unsplash.com/photo-1571417739689-05ecec5c9c95?w=1200&q=80&auto=format&fit=crop", // villa pool with palms
];

// Small, dependency-free string hash (djb2) so the same seed always maps
// to the same index — deterministic per resort, not random per render.
const hashSeed = (seed: string): number => {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  return Math.abs(hash);
};

/**
 * Picks a fallback photo for a resort. `seed` should be something stable
 * about the resort (its _id or name) so the same resort always gets the
 * same fallback across renders/reloads instead of a different random
 * image every time. `offset` lets a single resort's photo gallery show a
 * *different* fallback per broken slot (thumbnail 1, 2, 3...) rather than
 * repeating one image across every slot.
 */
export const getFallbackResortImage = (
  seed: string,
  offset = 0,
): string => {
  const index =
    (hashSeed(seed || "resort") + offset) % RESORT_FALLBACK_IMAGES.length;
  return RESORT_FALLBACK_IMAGES[index];
};
