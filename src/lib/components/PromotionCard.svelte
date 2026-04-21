

 <script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { MapPin, Heart } from 'lucide-svelte';
  import { cardImage, placeholderImage, logoImage } from '$lib/utils/cloudinary';

  // ── Types ──────────────────────────────────────────────────────────────────
  interface Promotion {
    id: number;
    title: string;
    description: string | null;
    discountPercentage: number | null;
    endDate: Date | string;
    imageUrls: string[] | null;
    location: { address?: string; lat?: number; lng?: number } | null;
    paymentMethods: string[] | null;
    merchantId: number;
    merchantName?: string | null;
    merchantLogo?: string | null;
  }

  // ── Props ──────────────────────────────────────────────────────────────────
  let { promo } = $props<{ promo: Promotion }>();

  // ── State ──────────────────────────────────────────────────────────────────
  let liked       = $state(false);
  let liking      = $state(false);
  let imageLoaded = $state(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const images = $derived(promo.imageUrls?.filter(Boolean) ?? []);

  const isEndingSoon = $derived(
    new Date(promo.endDate).getTime() < Date.now() + 3 * 24 * 60 * 60 * 1000
  );

  const merchantInitial = $derived(
    promo.merchantName?.trim().charAt(0).toUpperCase() ?? '?'
  );

  const detailUrl = $derived(`/promotions/${promo.id}`);

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleLike(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!$page.data.user) { goto('/login'); return; }
    if (liking) return;
    liking = true;
    try {
      const res = await fetch(`/promotions/${promo.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
      liked = (await res.json()).liked;
    } catch {
      console.error('Like failed');
    } finally {
      liking = false;
    }
  }
</script>

<!--
  All screen sizes: card click → detail page → tap image → full-screen gallery.
  Pure <a> tag navigation, zero JS interception. No device detection needed.
-->
<article
  class="glass-card flex flex-col overflow-hidden transition-transform hover:-translate-y-1"
  style="height: 495px;"
>
  <a href={detailUrl} class="flex flex-col h-full pb-2" aria-label={promo.title}>

    <!-- ── Image region (~80%) ────────────────────────────────────────────── -->
    <div class="relative overflow-hidden bg-gray-900" style="flex: 0 0 80%;">

      {#if images.length}
        <img
          src={placeholderImage(images[0])}
          alt=""
          aria-hidden="true"
          class="absolute inset-0 w-full h-full object-cover scale-110 blur-md"
          fetchpriority="low"
        />
        <img
          src={cardImage(images[0])}
          alt={promo.title}
          loading="lazy"
          decoding="async"
          onload={() => (imageLoaded = true)}
          class="absolute inset-0 w-full h-full object-contain transition-opacity duration-500
                 {imageLoaded ? 'opacity-100' : 'opacity-0'}"
        />
        {#if images.length > 1}
          <span class="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60
                       backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-full
                       pointer-events-none">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="3"  y="3"  width="7" height="7" rx="1"/>
              <rect x="14" y="3"  width="7" height="7" rx="1"/>
              <rect x="3"  y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            {images.length}
          </span>
        {/if}

      {:else}
        <div class="absolute inset-0 flex items-center justify-center text-gray-700">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </div>
      {/if}

      <div class="absolute top-1 left-1.5 right-2 flex justify-between items-start pointer-events-none">
        {#if promo.discountPercentage}
          <span class="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
            {promo.discountPercentage}% OFF
          </span>
        {:else}
          <span></span>
        {/if}
        {#if isEndingSoon}
          <span class="badge-hot">A terminar</span>
        {/if}
      </div>
    </div>

    <!-- ── Merchant strip (~7%) ───────────────────────────────────────────── -->
    <div
      class="flex items-center justify-between px-3 border-b border-gray-100/10 bg-white/3"
      style="flex: 0 0 7%;"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200/20
                    bg-gray-800 flex items-center justify-center">
          {#if promo.merchantLogo}
            <img
              src={logoImage(promo.merchantLogo)}
              alt={promo.merchantName ?? 'Merchant'}
              class="w-full h-full object-contain"
              loading="lazy"
            />
          {:else}
            <span class="text-xs font-black text-gray-400 leading-none select-none">
              {merchantInitial}
            </span>
          {/if}
        </div>
        <span class="text-[11px] font-black truncate leading-tight" style="color: var(--primary);">
          {promo.merchantName ?? 'Comerciante'}
        </span>
      </div>

      <button
        type="button"
        onclick={handleLike}
        disabled={liking}
        aria-label={liked ? 'Remover dos favoritos' : 'Guardar'}
        class="shrink-0 text-red-500 hover:scale-110 transition-transform disabled:opacity-40 p-1"
      >
        <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
      </button>
    </div>

    <!-- ── Info region (~13%) ─────────────────────────────────────────────── -->
    <div class="flex flex-col justify-between px-3 py-1 overflow-hidden" style="flex: 0 0 13%;">
      <h2 class="font-bold text-sm leading-tight line-clamp-1 min-w-0" style="color: var(--primary);">
        {promo.title}
      </h2>

      <div class="flex flex-col gap-0.5">
        <div class="flex justify-between text-[11px] text-gray-500">
          <span class="flex items-center gap-0.5 truncate min-w-0">
            <MapPin size={11} class="shrink-0" />
            {promo.location?.address?.slice(0, 30) || 'Vários locais'}
          </span>
          <span class="shrink-0 text-gray-400 tabular-nums ml-2">
            Validade: {new Date(promo.endDate).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: '2-digit' })}
          </span>
        </div>

        {#if promo.paymentMethods?.length}
          <div class="flex items-center gap-1">
            <span class="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-500 uppercase shrink-0">
              Aceitamos:
            </span>
            {#each promo.paymentMethods.slice(0, 4) as method}
              <span class="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-500 uppercase">
                {method}
              </span>
            {/each}
            {#if promo.paymentMethods.length > 4}
              <span class="text-[9px] text-gray-400 font-bold">+{promo.paymentMethods.length - 4}</span>
            {/if}
          </div>
        {/if}
      </div>
    </div>

  </a>
</article> 

