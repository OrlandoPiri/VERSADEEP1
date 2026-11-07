<script lang="ts">
  // src/routes/liked/+page.svelte
  import PromotionCard from '$lib/components/PromotionCard.svelte';
  import * as likes from '$lib/likes.svelte';
  import { Heart } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Every row from the server is liked by definition. Once the likes store has
  // loaded, hide cards the user un-hearts on this page so they disappear instantly.
  const visible = $derived(
    likes.status.ready ? data.promotions.filter((p) => likes.isLiked(p.id)) : data.promotions
  );

  function isExpired(endDate: Date | string) {
    return new Date(endDate).getTime() < Date.now();
  }
</script>

<svelte:head>
  <title>Guardados — Vercenas</title>
</svelte:head>

<div class="mx-auto px-5 py-8 space-y-6">
  <header>
    <h1 class="text-3xl font-black tracking-tighter text-gray-900">Guardados</h1>
    {#if data.total > 0}
      <p class="text-sm text-gray-500 mt-1">
        {data.total} {data.total === 1 ? 'promoção guardada' : 'promoções guardadas'}
      </p>
    {/if}
  </header>

  {#if visible.length === 0}
    <div class="flex flex-col items-center justify-center py-24 text-center text-gray-400 gap-4">
      <Heart size={48} class="opacity-20" />
      <p>
        Ainda não guardou nenhuma promoção.<br />
        <span class="text-sm">Toque no coração de uma promoção para a encontrar aqui.</span>
      </p>
      <a
        href="/"
        class="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-all"
      >
        Ver promoções
      </a>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each visible as promo (promo.id)}
        <div class="relative {isExpired(promo.endDate) ? 'opacity-60' : ''}">
          <PromotionCard {promo} />
          {#if isExpired(promo.endDate)}
            <span
              class="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-gray-900/80 text-white text-[10px]
                     font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest pointer-events-none"
            >
              Expirada
            </span>
          {/if}
        </div>
      {/each}
    </div>

    {#if data.totalPages > 1}
      <nav class="flex items-center justify-between pt-4" aria-label="Paginação">
        {#if data.page > 1}
          <a href="/liked?page={data.page - 1}" class="text-xs font-bold uppercase text-gray-500 hover:text-orange-600">← Anterior</a>
        {:else}
          <span class="text-xs font-bold uppercase text-gray-300">← Anterior</span>
        {/if}

        <span class="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Página {data.page} / {data.totalPages}
        </span>

        {#if data.page < data.totalPages}
          <a href="/liked?page={data.page + 1}" class="text-xs font-bold uppercase text-gray-500 hover:text-orange-600">Seguinte →</a>
        {:else}
          <span class="text-xs font-bold uppercase text-gray-300">Seguinte →</span>
        {/if}
      </nav>
    {/if}
  {/if}
</div>