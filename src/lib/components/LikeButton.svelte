<script lang="ts">
  // src/lib/components/LikeButton.svelte
  //
  // One heart for the whole post. Used on the feed card, the details page header
  // and (next step) the full-screen gallery. State lives in $lib/likes.svelte.ts.
  import { Heart } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import * as likes from '$lib/likes.svelte';

  let {
    promotionId,
    variant = 'card'
  }: {
    promotionId: number;
    /** card = small red heart, pill = labelled button, round = dark circle for overlays */
    variant?: 'card' | 'pill' | 'round';
  } = $props();

  const user = $derived(page.data.user);
  const liked = $derived(likes.isLiked(promotionId));

  // Every heart calls this; the store only fetches once per user.
  onMount(() => {
    if (user?.id) likes.load(user.id);
  });

  async function onclick(e: MouseEvent) {
    // The card wraps everything in an <a>: don't navigate when the heart is tapped.
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      goto('/login');
      return;
    }
    try {
      await likes.toggle(promotionId);
    } catch (err) {
      console.error('Like failed', err);
    }
  }
</script>

{#if variant === 'card'}
  <button
    type="button"
    {onclick}
    aria-pressed={liked}
    aria-label={liked ? 'Remover dos guardados' : 'Guardar'}
    class="shrink-0 text-red-500 hover:scale-110 transition-transform p-1"
  >
    <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
  </button>
{:else if variant === 'pill'}
  <button
    type="button"
    {onclick}
    aria-pressed={liked}
    class="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all shrink-0
           {liked
             ? 'bg-red-500/10 border-red-500/40 text-red-400'
             : 'bg-[#1E293B] border-gray-700 text-gray-300 hover:border-red-500/40 hover:text-white'}"
  >
    <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
    {liked ? 'Guardado' : 'Guardar'}
  </button>
{:else}
  <button
    type="button"
    {onclick}
    aria-pressed={liked}
    aria-label={liked ? 'Remover dos guardados' : 'Guardar'}
    class="w-9 h-9 flex items-center justify-center rounded-full bg-white/10
           hover:bg-white/20 transition-colors {liked ? 'text-red-500' : 'text-white'}"
  >
    <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
  </button>
{/if}