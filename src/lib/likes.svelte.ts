// src/lib/likes.svelte.ts
//
// Client-side store for "which promotions has the current user liked".
// Every LikeButton reads from here, so the feed, the details page, the
// gallery and /liked always agree.
//
// Safe on the server: nothing ever populates it there (load() is browser-only),
// so the module-level state can never leak one user's likes into another's request.
import { browser } from '$app/environment';
import { SvelteSet } from 'svelte/reactivity';
import { getMyLikedIds, toggleLike } from '../routes/promotions.remote';

const liked = new SvelteSet<number>();
const pending = new Set<number>(); // ids with a request in flight
let loadedFor: string | null = null;

/** `ready` flips to true once the user's liked ids have been fetched. */
export const status = $state({ ready: false });

export function isLiked(id: number) {
  return liked.has(id);
}

/** Fetch the user's liked ids once per user. Safe to call from every heart. */
export async function load(userId: string) {
  if (!browser || loadedFor === userId) return;
  loadedFor = userId;
  try {
    const ids = await getMyLikedIds();
    liked.clear();
    for (const id of ids) liked.add(id);
    status.ready = true;
  } catch (err) {
    console.error('Could not load saved promotions', err);
    loadedFor = null; // allow a retry on the next heart that mounts
  }
}

/** Optimistic toggle: flips instantly, reconciles with the server, rolls back on failure. */
export async function toggle(id: number): Promise<void> {
  if (pending.has(id)) return; // ignore double-taps while a request is in flight
  pending.add(id);

  const wasLiked = liked.has(id);
  if (wasLiked) liked.delete(id);
  else liked.add(id);

  try {
    const res = await toggleLike({ promotionId: id });
    if (res.liked) liked.add(id);
    else liked.delete(id);
  } catch (err) {
    if (wasLiked) liked.add(id);
    else liked.delete(id);
    throw err;
  } finally {
    pending.delete(id);
  }
}
