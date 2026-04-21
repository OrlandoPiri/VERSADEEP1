<script lang="ts">
  import { MapPin, Phone, Mail, CreditCard, Smartphone, Landmark, Clock, ChevronLeft, ChevronRight, Pencil } from 'lucide-svelte';
  import type { PageData } from './$types';
  import MapPreview from '$lib/components/MapPreview2.svelte';
  import ImageGallery from '$lib/components/ImageGallery.svelte';
  import { galleryImage, placeholderImage, thumbImage, logoImage } from '$lib/utils/cloudinary';

  let { data } = $props<{ data: PageData }>();
  const promotion = $derived(data.promotion);
  const canEdit   = $derived(data.canEdit);   // ← from +page.server.ts, no client guessing
  const images    = $derived(promotion.imageUrls?.filter(Boolean) ?? []);

  // ── Image viewer state ─────────────────────────────────────────────────────
  let activeIdx   = $state(0);
  let mainLoaded  = $state(false);
  let galleryOpen = $state(false);

  function prev() { if (activeIdx > 0) { mainLoaded = false; activeIdx--; } }
  function next() { if (activeIdx < images.length - 1) { mainLoaded = false; activeIdx++; } }

  function openGallery() { galleryOpen = true; }

  // ── Payment icons ──────────────────────────────────────────────────────────
  const paymentIcons: Record<string, any> = {
    'CASH': Landmark, 'VISA': CreditCard, 'MASTERCARD': CreditCard,
    'M-PESA': Smartphone, 'E-MOLA': Smartphone, 'M-KESH': Smartphone,
    'EFT': Landmark, 'OTHER': Smartphone,
  };

  // ── Hours ──────────────────────────────────────────────────────────────────
  const hours = $derived(promotion.openHours
    ? (typeof promotion.openHours === 'string' ? JSON.parse(promotion.openHours) : promotion.openHours)
    : null
  );
  const daysOfTheWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const sortedHours = $derived(hours
    ? Object.entries(hours).sort(([a], [b]) => {
        const ai = daysOfTheWeek.findIndex(d => d.toLowerCase() === a.toLowerCase());
        const bi = daysOfTheWeek.findIndex(d => d.toLowerCase() === b.toLowerCase());
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
    : []
  );

  const merchantInitial = $derived(
    promotion.merchantName?.trim().charAt(0).toUpperCase() ?? '?'
  );
</script>

<svelte:head>
  <title>{promotion.title} - Versa</title>
</svelte:head>

{#if galleryOpen && images.length}
  <ImageGallery
    {images}
    startIndex={activeIdx}
    onclose={() => (galleryOpen = false)}
  />
{/if}

<div class="min-h-screen bg-[#0D0D0D] py-8 px-4">

  <!-- Merchant identity + Edit button -->
  <div class="max-w-4xl mx-auto mb-6 flex items-center justify-between gap-4">
    <div class="flex items-center gap-4 min-w-0">
      <div class="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-gray-700
                  bg-gray-800 flex items-center justify-center">
        {#if promotion.merchantLogo}
          <img src={logoImage(promotion.merchantLogo)} alt={promotion.merchantName ?? 'Merchant'} class="w-full h-full object-contain" />
        {:else}
          <span class="text-lg font-black text-gray-500 leading-none select-none">{merchantInitial}</span>
        {/if}
      </div>
      <span class="text-xl font-black text-white truncate leading-tight">
        {promotion.merchantName ?? 'Comerciante'}
      </span>
    </div>

    <!-- Edit button — only rendered when canEdit is true (set server-side) -->
    {#if canEdit}
      <a
        href="/merchant/promotions/{promotion.id}/edit"
        class="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E293B] border border-gray-700
               text-sm font-bold text-gray-300 hover:border-[#8B5E3C] hover:text-white transition-all shrink-0"
      >
        <Pencil size={14} />
        Editar
      </a>
    {/if}
  </div>

  <article class="max-w-4xl mx-auto">

    <!-- ── Image viewer ────────────────────────────────────────────────────── -->
    {#if images.length}
      <div class="mb-6">
        <div class="relative w-full aspect-4/3 bg-[#0D0D0D] rounded-4xl overflow-hidden border border-gray-800">
          <img src={placeholderImage(images[activeIdx])} alt="" aria-hidden="true"
               class="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-40" />
          <button type="button" onclick={openGallery} aria-label="Ver galeria em ecrã completo"
                  class="absolute inset-0 w-full h-full bg-transparent border-0 p-0 cursor-zoom-in">
            <img src={galleryImage(images[activeIdx])} alt={promotion.title}
                 loading="eager" decoding="async" onload={() => (mainLoaded = true)}
                 class="w-full h-full object-contain transition-opacity duration-300
                        {mainLoaded ? 'opacity-100' : 'opacity-0'}" />
          </button>
          {#if images.length > 1}
            <button type="button" onclick={(e) => { e.stopPropagation(); prev(); }} disabled={activeIdx === 0}
                    aria-label="Imagem anterior"
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center
                           rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80
                           disabled:opacity-20 transition-all z-10">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onclick={(e) => { e.stopPropagation(); next(); }} disabled={activeIdx === images.length - 1}
                    aria-label="Próxima imagem"
                    class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center
                           rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80
                           disabled:opacity-20 transition-all z-10">
              <ChevronRight size={20} />
            </button>
            <span class="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white
                         text-[10px] font-black px-2.5 py-1 rounded-full tabular-nums pointer-events-none">
              {activeIdx + 1} / {images.length}
            </span>
          {/if}
        </div>

        {#if images.length > 1}
          <div class="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            {#each images as url, i}
              <button type="button" onclick={() => { mainLoaded = false; activeIdx = i; }}
                      aria-label="Ver imagem {i + 1}"
                      class="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all
                             {i === activeIdx ? 'border-orange-500 opacity-100' : 'border-gray-800 opacity-50 hover:opacity-80'}">
                <img src={thumbImage(url)} alt="Miniatura {i + 1}" loading="lazy" class="w-full h-full object-contain" />
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- ── Main card ───────────────────────────────────────────────────────── -->
    <div class="bg-[#1E293B] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div class="p-8 md:p-12">

        <header class="mb-10">
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {promotion.status}
            </span>
            {#if promotion.discountPercentage}
              <span class="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {promotion.discountPercentage}% OFF
              </span>
            {/if}
          </div>
          <h1 class="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter leading-tight">
            {promotion.title}
          </h1>
          <p class="text-gray-400 text-lg leading-relaxed max-w-2xl">{promotion.description}</p>
          <div class="flex justify-between items-center mt-4 pt-2 border-t border-gray-800/50">
            <span class="text-[14px] text-gray-300 uppercase tracking-tighter">
              Promoção válida até: {new Date(promotion.endDate).toLocaleDateString()}
            </span>
          </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div class="lg:col-span-2 space-y-10">
            {#if promotion.paymentMethods?.length}
              <section>
                <h2 class="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Pagamentos Aceites</h2>
                <div class="flex flex-wrap gap-3">
                  {#each promotion.paymentMethods as method}
                    <div class="flex items-center bg-[#0D0D0D] border border-gray-800 px-5 py-3 rounded-2xl">
                      {#if paymentIcons[method]}
                        {@const Icon = paymentIcons[method]}
                        <Icon size={18} class="mr-3 text-gray-500" />
                      {/if}
                      <span class="text-sm font-bold text-gray-200">{method}</span>
                    </div>
                  {/each}
                </div>
              </section>
            {/if}
            {#if promotion.location}
              <section>
                <h2 class="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                  <MapPin size={14} class="text-orange-500" /> Onde Encontrar
                </h2>
                <MapPreview address={promotion.location.address} />
              </section>
            {/if}
          </div>

          <div class="space-y-8">
            {#if sortedHours.length}
              <section class="bg-[#0D0D0D] p-6 rounded-3xl border border-gray-800">
                <h2 class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                  <Clock size={14} /> Horário
                </h2>
                <ol class="space-y-3">
                  {#each sortedHours as [day, time]}
                    <li class="flex justify-between text-sm">
                      <span class="text-gray-500 capitalize">{day}</span>
                      <span class="text-white font-bold">{time}</span>
                    </li>
                  {/each}
                </ol>
              </section>
            {/if}
            {#if promotion.contact}
              <section class="space-y-3">
                {#if promotion.contact.phone}
                  <a href="tel:{promotion.contact.phone}"
                     class="flex items-center justify-center gap-3 w-full bg-white text-black py-4 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">
                    <Phone size={18} /> {promotion.contact.phone}
                  </a>
                {/if}
                {#if promotion.contact.whatsapp}
                  <a href="https://wa.me/{promotion.contact.whatsapp}"
                     class="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-sm hover:opacity-90 transition-all">
                    <Smartphone size={18} /> {promotion.contact.whatsapp}
                  </a>
                {/if}
                {#if promotion.contact.email}
                  <a href="mailto:{promotion.contact.email}"
                     class="flex items-center justify-center gap-3 w-full bg-white text-black py-4 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">
                    <Mail size={18} /> {promotion.contact.email}
                  </a>
                {/if}
              </section>
            {/if}
          </div>
        </div>

        {#if promotion.terms}
          <footer class="mt-16 pt-8 border-t border-gray-800/50">
            <p class="text-[10px] text-gray-600 uppercase tracking-widest mb-2 font-bold">Termos e Condições</p>
            <p class="text-xs text-gray-500 italic leading-relaxed">{promotion.terms}</p>
          </footer>
        {/if}

      </div>
    </div>
  </article>
</div>