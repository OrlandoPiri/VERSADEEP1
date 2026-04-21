/**
 * $lib/utils/cloudinary.ts
 *
 * Single source of truth for all Cloudinary URL transformations.
 *
 * Rules enforced everywhere:
 *   f_auto   — WebP/AVIF when browser supports it, JPEG fallback
 *   q_auto   — Cloudinary picks optimal quality per image content
 *   c_limit  — scales DOWN only, never crops, preserves aspect ratio
 *
 * Never use c_crop, c_fill, or c_thumb on promotion/logo images —
 * those modes discard content we can't predict from arbitrary uploads.
 */

function transform(url: string, params: string): string {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${params}/`);
}

/**
 * cardImage — primary image in PromotionCard (~700px display region).
 * c_limit: shrinks to fit, never crops a pixel.
 */
export function cardImage(url: string): string {
  return transform(url, 'w_700,h_460,c_limit,f_auto,q_auto:good');
}

/**
 * placeholderImage — 30px blur-up placeholder, ~300 bytes.
 * CSS scales it up + applies blur filter for the LQIP effect.
 */
export function placeholderImage(url: string): string {
  return transform(url, 'w_30,q_auto:low,f_auto');
}

/**
 * logoImage — merchant logo avatar (card strip, detail page).
 * c_limit preserves natural aspect ratio — no distortion ever.
 */
export function logoImage(url: string): string {
  return transform(url, 'w_120,h_120,c_limit,f_auto,q_auto:good');
}

/**
 * thumbImage — upload preview grid + Step 5 mini-card.
 * q_auto:eco trades minor quality for speed at thumbnail scale.
 */
export function thumbImage(url: string): string {
  return transform(url, 'w_320,h_220,c_limit,f_auto,q_auto:eco');
}

/**
 * galleryImage — full-screen lightbox / detail page hero.
 * Larger dims, q_auto:good — this is the primary viewing experience.
 */
export function galleryImage(url: string): string {
  return transform(url, 'w_1400,h_1000,c_limit,f_auto,q_auto:good');
}

// // src/lib/utils/cloudinary.ts
// //
// // Runtime image normalization via Cloudinary URL transforms.
// // No build step, no SDK — just URL manipulation.
// // Cloudinary resizes/compresses/converts on first request, then CDN-caches globally.

// /**
//  * Injects a Cloudinary transformation string into a raw upload URL.
//  * Safe to call multiple times — won't double-inject the same transforms.
//  */
// export function cld(url: string, transforms: string): string {
//   if (!url) return '';
//   if (url.includes(`/upload/${transforms}/`)) return url; // already applied
//   return url.replace('/upload/', `/upload/${transforms}/`);
// }

// /**
//  * Card thumbnail:
//  *  - c_fill   : crop to exact dimensions (no letterboxing)
//  *  - w_800    : 800px wide (2× for retina at 400px display)
//  *  - h_600    : 600px tall (4:3 ratio)
//  *  - g_auto   : smart gravity — keeps faces / salient content in frame
//  *  - f_auto   : serve WebP to Chrome, AVIF to supporting browsers, JPEG as fallback
//  *  - q_auto   : perceptual quality — Cloudinary picks the smallest file that looks good
//  */
// export function cardImage(url: string): string {
//   return cld(url, 'c_fill,w_800,h_600,g_auto,f_auto,q_auto');
// }

// /**
//  * Fullscreen gallery image:
//  *  - c_limit  : scale DOWN only, never upscale
//  *  - w_1600   : max 1600px wide (covers most phone screens at 2×)
//  *  - f_auto, q_auto : same format/quality logic
//  */
// export function galleryImage(url: string): string {
//   return cld(url, 'c_limit,w_1600,f_auto,q_auto');
// }

// /**
//  * Blur-up placeholder:
//  *  - 20px wide, matching 4:3 crop, extreme blur + low quality
//  *  - loads in ~200 bytes, shown instantly while full image loads
//  */
// export function placeholderImage(url: string): string {
//   return cld(url, 'c_fill,w_20,h_15,g_auto,f_auto,q_10,e_blur:1000');
// }
