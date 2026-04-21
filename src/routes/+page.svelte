<script lang="ts">
  import { getPromotions } from './promotions.remote';
  import PromotionCard from '$lib/components/PromotionCard.svelte';
  import { Loader2, MegaphoneOff } from 'lucide-svelte';
  

  // 1. Initialize the promotions resource. 
  // We pass 'undefined' because the cursor is optional.
  const promos = getPromotions(undefined);

  // 2. Access the data reactively using Svelte 5 logic
</script>

<div class="space-y-8">
  <section class="text-center py-12 bg-linear-to-b from-orange-50 to-white rounded-3xl">
    <h1 class="text-4xl font-black tracking-tighter sm:text-6xl mb-4">
      Ofertas Frescas <span class="text-orange-600">Hoje</span>
    </h1>
    <p class="text-gray-500 max-w-xl mx-auto">
      As melhores promoções de Maputo a Pemba, atualizadas em tempo real.
    </p>
  </section>

  {#if promos.loading && !promos.ready}
    <div class="flex flex-col items-center justify-center py-20">
      <Loader2 class="animate-spin text-orange-600 mb-4" size={40} />
      <p class="text-sm font-medium text-gray-400">Buscando as melhores ofertas...</p>
    </div>
  {:else if promos.error}
    <div class="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
      <p class="text-red-600 font-bold">Erro ao carregar promoções.</p>
      <button onclick={() => location.reload()} class="mt-2 text-sm underline">Tentar de novo</button>
    </div>
  {:else if promos.ready}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each promos.current.items as promo}
        <PromotionCard {promo} />

      {/each}
    </div> 

    {#if promos.current.items.length === 0}
      <div class="flex flex-col items-center justify-center py-20 text-gray-400">
        <MegaphoneOff size={48} class="mb-4 opacity-20" />
        <p>Nenhuma promoção ativa no momento.</p>
      </div>
    {/if}
    
    {#if promos.current.nextCursor}
      <div class="flex justify-center mt-12">
        <button class="btn-secondary px-8 py-3 font-bold border-2 border-gray-100 hover:border-orange-600 transition-all">
          Carregar mais ofertas
        </button>
      </div>
    {/if}
  {/if}
</div>



<!-- <script lang="ts">
  import { getPromotions } from './promotions.remote';
  import PromotionCard from '$lib/components/PromotionCard.svelte';

  let items = $state([]);

  let nextCursor = $state(null);
  let loading = $state(false);
  let hasMore = $state(true);

  async function loadMore() {
    if (loading || !hasMore) return;
    loading = true;
    const result = await getPromotions(nextCursor);
    items = [...items, ...result.items];
    nextCursor = result.nextCursor;
    hasMore = !!nextCursor;
    loading = false;
  }

  await loadMore();

  let sentinel: HTMLElement;
  $effect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    });
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  });
</script> -->
<!-- <script lang="ts">
  import { getPromotions } from './promotions.remote';
  import PromotionCard from '$lib/components/PromotionCard.svelte';

  let items = $state([]);
  let nextCursor = $state(null);
  let loading = $state(false);
  let hasMore = $state(true);

  // FIX 1: Use $state(null) for the sentinel binding
  let sentinel = $state<HTMLElement | null>(null);

  async function loadMore() {
    if (loading || !hasMore) return;
    loading = true;
    try {
      const result = await getPromotions(nextCursor);
      items = [...items, ...result.items];
      nextCursor = result.nextCursor;
      hasMore = !!nextCursor;
    } finally {
      loading = false;
    }
  }

  // FIX 2: Svelte 5 doesn't allow top-level 'await' in script tags like this.
  // Use $effect or an onMount-style pattern.
  $effect(() => {
    loadMore();
  });

  $effect(() => {
    if (!sentinel) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    });
    
    observer.observe(sentinel);
    return () => observer.disconnect();
  });
</script>

<div bind:this={sentinel} class="h-10"></div>
<svelte:head>
  <title>Versa - Promoções em Moçambique</title>
</svelte:head>


<div class="mb-8">
  <h1 class="text-4xl font-bold mb-2" style="color: var(--primary);">Promoções recentes</h1>
  <p class="text-gray-600">Encontre as melhores ofertas perto de si</p>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {#each items as promo (promo.id)}
    <PromotionCard {promo} />
  {/each}
</div>

{#if hasMore}
  <div bind:this={sentinel} class="h-20 flex justify-center items-center">
    {#if loading}
      <span class="text-gray-500">Carregando...</span>
    {/if}
  </div>
{/if} -->
