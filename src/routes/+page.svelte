<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { getPromotions, searchPromotions } from './promotions.remote';
  import PromotionCard from '$lib/components/PromotionCard.svelte';
  import { CATEGORIES } from '$lib/utils/categories';
  import { Loader2, MegaphoneOff, Search, SlidersHorizontal, X, MapPin } from 'lucide-svelte';
  import { slide } from 'svelte/transition';

	// 1. Reactive state for the toggle
	let isSearchOpen = $state(false);

  // Home feed resource — original pattern preserved
  const promos = getPromotions(undefined);

  // ── Filter state ───────────────────────────────────────────────────────────
  let searchQuery = $state('');
  let city        = $state('maputo');
  let category    = $state('all');  // 'all' = no category filter
  let sortOption  = $state<'smart' | 'newest' | 'discount' | 'ending'>('smart');
  let minDiscount = $state(0);
  let endingSoon  = $state(false);
  let featured    = $state(false);

  // isSearchMode: true when any non-default filter is active
  const isSearchMode = $derived(
  !!searchQuery.trim()  ||
  city !== 'maputo'     ||
  category !== 'all'    ||
  minDiscount > 0       ||
  endingSoon            ||
  featured              ||
  sortOption !== 'smart'
);

  // ── URL sync — history.replaceState avoids SvelteKit navigation cycle
  // which was causing focus loss on every keystroke
  function syncUrl() {
    const params = new URLSearchParams();
    if (searchQuery.trim())     params.set('q',           searchQuery.trim());
    if (city !== 'maputo')      params.set('city',        city);
    if (category !== 'all')     params.set('category',    category);
    if (sortOption !== 'smart') params.set('sort',        sortOption);
    if (minDiscount > 0)        params.set('minDiscount', String(minDiscount));
    if (endingSoon)             params.set('endingSoon',  'true');
    if (featured)               params.set('featured',    'true');
    const qs = params.toString();
    // Direct history API — no navigation, no re-render, no focus loss
    history.replaceState({}, '', qs ? `/?${qs}` : '/');
  }

  // ── Read URL params on mount ───────────────────────────────────────────────
  onMount(() => {
    const p = $page.url.searchParams;
    searchQuery = p.get('q')          ?? '';
    city        = p.get('city')       ?? 'maputo';
    category    = p.get('category')   ?? 'all';
    sortOption  = (p.get('sort') as typeof sortOption) || 'smart';
    minDiscount = Number(p.get('minDiscount') ?? 0);
    endingSoon  = p.get('endingSoon') === 'true';
    featured    = p.get('featured')   === 'true';
    if (isSearchMode) runSearch(false);
  });

  // ── Search results ─────────────────────────────────────────────────────────
  let searchItems   = $state<any[]>([]);
  let searchTotal   = $state(0);
  let searchLoading = $state(false);
  let searchOffset  = $state(0);
  const LIMIT       = 30;
  const hasMore     = $derived(searchItems.length < searchTotal);

  async function runSearch(append = false) {
    searchLoading = true;
    try {
      const result = await searchPromotions({
        query:       searchQuery.trim() || undefined,
        city: city !== 'maputo' ? city : undefined, //So default homepage behavior remains neutral
        category:    category !== 'all' ? category : undefined,
        featured:    featured    || undefined,
        endingSoon:  endingSoon  || undefined,
        minDiscount: minDiscount || undefined,
        sort:        sortOption,
        limit:       LIMIT,
        offset:      append ? searchOffset : 0,
      });
      if (append) {
        searchItems = [...searchItems, ...result.items];
      } else {
        searchItems  = result.items;
        searchOffset = 0;
      }
      searchTotal  = result.total;
      searchOffset = searchItems.length;
    } catch (err) {
      console.error('[search] error:', err);
    } finally {
      searchLoading = false;
    }
  }

  // ── Debounce — text input ONLY.
  // Correct flow: wait for typing to pause → runSearch() → THEN syncUrl().
  // This order prevents URL update from triggering re-renders mid-keystroke.
  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleSearchInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (isSearchMode) await runSearch(false);
      // syncUrl AFTER search completes — never during typing
      syncUrl();
    }, 350);
  }

  // ── Instant trigger for all non-text filters (city, category, sort, toggles)
  function triggerSearch() {
    syncUrl();
    if (isSearchMode) runSearch(false);
  }

  // ── Category click — instant, only resets category (not other filters)
  function selectCategory(slug: string) {
    category = slug;
    triggerSearch();
  }

  function clearAll() {
    searchQuery = '';  city = 'maputo';
 category = 'all'; minDiscount = 0;
    endingSoon = false; featured = false; sortOption = 'smart';

    syncUrl();
    // falls back to home feed — no search needed
  }


  let filtersOpen = $state(false);

  const SORT_OPTIONS = [
    { value: 'smart',    label: 'Relevância'     },
    { value: 'newest',   label: 'Mais recente'   },
    { value: 'discount', label: 'Maior desconto' },
    { value: 'ending',   label: 'A terminar'     },
  ] as const;

  const selectedCategory =
  $page.url.searchParams.get('category') ?? 'all';

  function buildCategoryHref(value: string) {
  const params = new URLSearchParams($page.url.searchParams);

  if (value === 'all') {
    params.delete('category'); // clean URL
  } else {
    params.set('category', value);
  }

  return `?${params.toString()}`;
}

function toggleSearch() {
		isSearchOpen = !isSearchOpen;
	}
</script>

<div class="space-y-0">

  {#if !isSearchMode && !searchQuery}
    <section class="text-center py-12 bg-linear-to-b from-orange-50 to-white rounded-3xl mx-0 mt-0">
      <h1 class="text-4xl font-black tracking-tighter sm:text-6xl mb-4">
        Promoções Directas <span class="text-orange-600">Hoje</span>
      </h1>
      <p class="text-gray-500 max-w-xl mx-auto">
        As melhores promoções de Maputo a Pemba, actualizadas em tempo real.  <a href="/signup" class="font-black tracking-tighter underline hover:text-orange-700">Cadastre-se Já!</a> 
      </p>
      <button onclick={toggleSearch} aria-expanded={isSearchOpen} class=" text-orange-500  onhover:text-orange-900 text-l transition-colors mt-6 inline-flex items-center gap-2 font-bold cursor-pointer">
        {#if isSearchOpen}
        Fechar <X size={20} />
        {:else}
        Pesquisar <Search size={20} />
        {/if}
</button>
</section>
{/if}

  <!-- ── Sticky search + filters shell ────────────────────────────────────── -->
   {#if isSearchOpen}
  <div class=" sticky top-(--header-height,64px) z-20 bg-white/90 backdrop-blur-xl border-b border-gray-50 shadow-none">

    <!-- Search row -->
    <div class="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">

      <!-- Search input — debounced, never loses focus -->
      <div class="relative flex-1">
        <Search size={15} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          bind:value={searchQuery}
          oninput={handleSearchInput}
          placeholder="Pesquisar promoções, lojas…"
          class="w-full pl-9 pr-8 py-2.5 rounded-xl bg-gray-100 border border-transparent text-sm text-gray-900
                 outline-none focus:bg-white focus:border-orange-300 transition-all placeholder:text-gray-400"
        />
        {#if searchQuery}
          <!-- onmousedown preventDefault keeps input focused when clicking X -->
          <button
            type="button"
            onmousedown={(e) => e.preventDefault()}
            onclick={() => { searchQuery = ''; syncUrl(); }}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={14} />
          </button>
        {/if}
      </div>

      <!-- Location selector — native select, NO custom chevron icon.
           The browser renders its own dropdown arrow aligned to the element on all screen sizes. -->
      <div class="relative shrink-0">
        <MapPin size={13} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none z-10" />
        <select
          bind:value={city}
          onchange={triggerSearch}
          aria-label="Selecionar cidade"
          class="pl-7 pr-3 py-2.5 rounded-xl bg-gray-100 border border-transparent
                 text-sm font-bold text-gray-700 outline-none cursor-pointer hover:bg-gray-200 transition-all"
        >
          <option value="maputo">Maputo</option>
          <option value="matola">Matola</option>
          <option value="beira">Beira</option>
          <option value="nampula">Nampula</option>
          <option value="pemba">Pemba</option>
          <option value="quelimane">Quelimane</option>
          <option value="inhambane">Inhambane</option>
          <option value="chimoio">Chimoio</option>
          <option value="tete">Tete</option>
          <option value="lichinga">Lichinga</option>
          <option value="xai-xai">Xai-Xai</option>
        </select>
      </div>

      <!-- Filters toggle -->
      <button
        type="button"
        onclick={() => { filtersOpen = !filtersOpen; }}
        class="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all
               {filtersOpen
                 ? 'bg-orange-50 border-orange-300 text-orange-600'
                 : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200'}"
        aria-label="Filtros"
      >
        <SlidersHorizontal size={15} />
        <span class="text-xs font-bold hidden sm:block">Filtros</span>
      </button>
    </div>

    <!-- Categories bar — horizontal scroll, positioned directly below search row -->
    <div class=" mx-auto px-4 pb-2 overflow-x-auto scrollbar-none">
      <div class="flex items-center gap-2 w-max">
        <!-- "All" chip — resets category only, keeps other filters intact -->
        <button
          type="button"
          onclick={() => selectCategory('all')}
          class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                 {category === 'all'
                   ? 'bg-orange-600 text-white'
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
        >
          Todas
        </button>
        {#each CATEGORIES as cat}
          <button
            type="button"
            onclick={() => selectCategory(cat.slug)}
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                   {category === cat.slug
                     ? 'bg-orange-600 text-white'
                     : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          >
            {cat.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Expanded filters row -->
    {#if filtersOpen}
      <div class="max-w-7xl mx-auto px-4 pb-3 pt-2 flex flex-wrap items-center gap-2 border-t border-gray-100">

        <select bind:value={sortOption} onchange={triggerSearch}
          class="px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 outline-none
                 focus:border-orange-300 transition-all cursor-pointer">
          {#each SORT_OPTIONS as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>

        {#each [
          { label: 'A terminar', active: endingSoon, toggle: () => { endingSoon = !endingSoon; triggerSearch(); } },
          { label: 'Destaque',   active: featured,   toggle: () => { featured   = !featured;   triggerSearch(); } },
        ] as chip}
          <button type="button" onclick={chip.toggle}
            class="px-3 py-2 rounded-xl border text-xs font-medium transition-all
                   {chip.active
                     ? 'bg-orange-50 border-orange-300 text-orange-600'
                     : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}">
            {chip.label}
          </button>
        {/each}

        <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200">
          <span class="text-xs text-gray-500 shrink-0">Mín. desconto</span>
          <input type="range" min="0" max="90" step="10" bind:value={minDiscount}
            onchange={triggerSearch} class="w-20 accent-orange-500" />
          <span class="text-xs font-bold text-gray-700 w-8 text-right">
            {minDiscount > 0 ? `${minDiscount}%` : 'Todos'}
          </span>
        </div>

        {#if endingSoon || featured || minDiscount > 0 || sortOption !== 'smart'}
          <button type="button" onclick={clearAll}
            class="px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-400
                   hover:text-gray-700 hover:border-gray-400 transition-all flex items-center gap-1">
            <X size={11} /> Limpar
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/if}
  <!-- ── Main Content ──────────────────────────────────────────────────────────── -->
  <div class=" mx-auto px-5 py-6 space-y-8">

    {#if isSearchMode}

      {#if !searchLoading}
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">
            {#if searchTotal === 0}
              Sem resultados{#if searchQuery} para "<span class="font-medium text-gray-800">{searchQuery}</span>"{/if}
            {:else}
              <span class="font-bold text-gray-800">{searchTotal}</span>
              promoç{searchTotal === 1 ? 'ão' : 'ões'}
              {#if searchQuery} para "<span class="font-medium text-gray-800">{searchQuery}</span>"{/if}
            {/if}
          </p>
          <select bind:value={sortOption} onchange={triggerSearch}
            class="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-600
                   outline-none focus:border-orange-300 cursor-pointer">
            {#each SORT_OPTIONS as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>
      {/if}

      {#if searchLoading && searchItems.length === 0}
        <div class="flex flex-col items-center justify-center py-20">
          <Loader2 class="animate-spin text-orange-600 mb-4" size={40} />
          <p class="text-sm font-medium text-gray-400">A pesquisar…</p>
        </div>

      {:else if !searchLoading && searchItems.length === 0}
        <div class="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
          <MegaphoneOff size={48} class="opacity-20" />
          <p class="text-center">Nenhuma promoção encontrada.<br>
            <span class="text-sm">Tente outras palavras ou ajuste os filtros.</span>
          </p>
          <button type="button" onclick={clearAll}
            class="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-all">
            Ver todas as promoções
          </button>
        </div>

      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {#each searchItems as promo (promo.id)}
            <PromotionCard {promo} />
          {/each}
        </div>

        {#if hasMore}
          <div class="flex justify-center mt-8">
            <button type="button"
              onclick={() => runSearch(true)}
              disabled={searchLoading}
              class="btn-secondary px-8 py-3 font-bold border-2 border-gray-100 hover:border-orange-600 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed">
              {searchLoading ? 'A carregar…' : 'Carregar mais ofertas'}
            </button>
          </div>
        {/if}
      {/if}

    {:else}

      {#if promos.loading && !promos.ready}
        <div class="flex flex-col items-center justify-center py-20">
          <Loader2 class="animate-spin text-orange-600 mb-4" size={40} />
          <p class="text-sm font-medium text-gray-400">Buscando as melhores promoções…</p>
        </div>

      {:else if promos.error}
        <div class="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <p class="text-red-600 font-bold">Erro ao carregar promoções. Verifique se a internet está activa?</p>
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

    {/if}

  </div>
</div>





<!-- 
  //After Netlify deployment - Before Search/Filter/Sort
<script lang="ts">
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
{/if} 

-->
