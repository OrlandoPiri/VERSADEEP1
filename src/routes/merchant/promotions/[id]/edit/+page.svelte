<script lang="ts">
  /**
   * /promotions/[id]/edit/+page.svelte
   *
   * Image handling is fully delegated to MediaUploader — this page only
   * owns the imageUrls array and passes it down with bind:imageUrls.
   * Payment methods and business hours are likewise delegated to their
   * own small components. Upload happens immediately on file selection
   * inside MediaUploader, so the hidden input below always holds resolved
   * Cloudinary URLs and the form submits normally via {...updatePromotion}.
   */
  import { updatePromotion } from '../../../../promotions.remote';
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { ArrowLeft } from 'lucide-svelte';
  import MediaUploader from '$lib/components/MediaUploader.svelte';
  import PaymentMethods from '$lib/components/PaymentMethods.svelte';
  import OpenHours from '$lib/components/OpenHours.svelte';

  import type { PageData } from './$types';

  // ── Props ──────────────────────────────────────────────────────────────────
  let { data } = $props<{ data: PageData }>();
  const p = untrack(() => data.promotion);

  // ── Toast ──────────────────────────────────────────────────────────────────
  let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    toast = { message, type };
    setTimeout(() => { toast = null; }, 4000);
  }

  // ── Result effect ──────────────────────────────────────────────────────────
   // ── Guard against stale remote-function state ───────────────────────────────
  // updatePromotion is a module-level singleton — its `.result` can still be
  // truthy from a previous successful edit on an earlier page visit (submit,
  // navigate away, come back to any edit page later in the same session).
  // Without this guard the effect below fires on mount using that leftover
  // result and redirects immediately — indistinguishable from an "auto
  // submit" even though no request was made. We snapshot whatever `.result`
  // is at mount and only act once it changes to something new relative to
  // that snapshot, i.e. an actual submit happened during *this* page's life.
  const initialResult = updatePromotion.result;

  // ── Result effect ──────────────────────────────────────────────────────────
  // $effect(() => {
  //   const result = updatePromotion.result;
  //   if (!result || result === initialResult) return;
  //   if (result.success) {
  //     showToast('Promoção actualizada!');
  //     goto(`/promotions/${p.id}`);
  //   } else {
  //     showToast('Erro ao actualizar promoção.', 'error');
  //   }
  // });
  // $effect(() => {

  //   if (!updatePromotion.result) return;
  //   if (updatePromotion.result.success) {
  //     showToast('Promoção actualizada!');
  //     goto(`/promotions/${p.id}`);
  //   } else {
  //     showToast('Erro ao actualizar promoção.', 'error');
  //   }
  // });


  // ── Form fields (prefilled) ────────────────────────────────────────────────
  let title              = $state(p.title ?? '');
  let description        = $state(p.description ?? '');
  let discountPercentage = $state(String(p.discountPercentage ?? ''));
  let locationAddress    = $state(p.location?.address ?? '');
  let contactPhone       = $state(p.contact?.phone ?? '');
  let contactWhatsapp    = $state(p.contact?.whatsapp ?? '');
  let contactEmail       = $state(p.contact?.email ?? '');
  let terms              = $state(p.terms ?? '');
  let selectedPayments   = $state<string[]>((p.paymentMethods as string[]) ?? []);
  // No editable UI for these two on this page — passed through unchanged so
  // the update never silently loses them. See header note above.
  let businessId = $state(p.businessId != null ? String(p.businessId) : '');
  let category   = $state(p.category ?? 'other');


  function toLocalInput(d: Date | string | null | undefined): string {
    if (!d) return '';
    return new Date(d).toISOString().slice(0, 16);
  }
  let startDate = $state(toLocalInput(p.startDate));
  let endDate   = $state(toLocalInput(p.endDate));

  const defaultHours = {
    monday: '', tuesday: '', wednesday: '', thursday: '',
    friday: '', saturday: '', sunday: '',
  };
  let openHoursState = $state<Record<string, string>>(
    typeof p.openHours === 'object' && p.openHours !== null
      ? { ...defaultHours, ...(p.openHours as Record<string, string>) }
      : { ...defaultHours }
  );

  // ── Images ─────────────────────────────────────────────────────────────────
  // Parent owns only the array. MediaUploader owns selection, validation,
  // upload, previews, removal, and drag-to-reorder.
  let imageUrls = $state<string[]>((p.imageUrls as string[]) ?? []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const dateError      = $derived(!!(endDate && startDate && endDate <= startDate));
  const isValid        = $derived(title.trim().length >= 3 && !!startDate && !!endDate && !dateError);
  const hiddenImages   = $derived(imageUrls.join(','));
  const hiddenPayments = $derived(selectedPayments.join(','));
  const hiddenHours    = $derived(JSON.stringify(openHoursState));
</script>

<!-- Toast -->
{#if toast}
  <div class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1E293B] text-sm font-medium border
              {toast.type === 'success' ? 'border-emerald-500/60 text-emerald-400' : 'border-red-500/60 text-red-400'}"
       transition:fly={{ y: 16, duration: 180 }}>
    {toast.message}
  </div>
{/if}

<div class="min-h-screen bg-[#080808] py-8 px-4 pb-28 md:pb-8">
  <div class="max-w-2xl mx-auto">

    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <a href="/promotions/{p.id}"
         class="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-800 text-gray-400
                hover:text-white hover:bg-gray-700 transition-colors">
        <ArrowLeft size={16} />
      </a>
      <div>
        <h1 class="text-xl font-black text-white uppercase tracking-tight">Editar Promoção</h1>
        <!-- was p.merchantName — that key doesn't exist on the query result,
             promotionColumns returns businessName. Was always rendering blank. -->
        <p class="text-xs text-gray-500 mt-0.5">ID #{p.id} · {p.businessName}</p>

      </div>
    </div>

    <!--
      No onsubmit override. Form submits normally via {...updatePromotion}.
      updatePromotion.result gets set → $effect fires → redirect.
    -->
    <form       {...updatePromotion.enhance(async ({ submit }) => {
        try {
          await submit();
          if (updatePromotion.result?.success) {
            showToast('Promoção actualizada!');
            goto(`/promotions/${p.id}`);
          } else {
            showToast('Erro ao actualizar promoção.', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Erro ao actualizar promoção.', 'error');
        }
      })}  class="space-y-5"    
    >
      <!-- Hidden fields — always present. Kept in the same order as
           createPromotionSchema's entries for easy side-by-side diffing
           against MerchantPromotionForm.svelte. -->
      <input type="hidden" name="id"              value={p.id} />
      <input type="hidden" name="businessId"      value={businessId} />
      <input type="hidden" name="title"           value={title} />
      <input type="hidden" name="description"     value={description} />
      <input type="hidden" name="discountPercentage" value={discountPercentage} />
      <input type="hidden" name="startDate"       value={startDate} />
      <input type="hidden" name="endDate"         value={endDate} />
      <input type="hidden" name="locationAddress" value={locationAddress} />
      <input type="hidden" name="contactPhone"    value={contactPhone} />
      <input type="hidden" name="contactWhatsapp" value={contactWhatsapp} />
      <input type="hidden" name="contactEmail"    value={contactEmail} />
      <input type="hidden" name="terms"           value={terms} />
      <input type="hidden" name="imageUrls"       value={hiddenImages} />
      <input type="hidden" name="paymentMethods"  value={hiddenPayments} />
      <input type="hidden" name="openHours"       value={hiddenHours} />
      <input type="hidden" name="category"        value={category} />

      <!-- Core -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-5">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Promoção</p>

        <div class="space-y-1.5">
          <label class="block">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
              Título <span class="text-[#8B5E3C]">*</span>
            </span>
            <input type="text" bind:value={title}
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border transition-all
                     {title.length > 0 && title.trim().length < 3 ? 'border-red-500/50' : 'border-transparent focus:border-[#8B5E3C]'}" />
          </label>
          {#if title.length > 0 && title.trim().length < 3}
            <p class="text-[10px] text-red-400 ml-1" transition:fade={{ duration: 100 }}>Mínimo 3 caracteres</p>
          {/if}
        </div>

        <label class="block">
          <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Desconto %</span>
          <div class="relative max-w-40">
            <input type="number" bind:value={discountPercentage}
              inputmode="numeric" min="1" max="100"
              class="w-full p-3 pr-8 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold pointer-events-none">%</span>
          </div>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
              Início <span class="text-[#8B5E3C]">*</span>
            </span>
            <input type="datetime-local" bind:value={startDate}
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
          </label>
          <label class="block">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
              Fim <span class="text-[#8B5E3C]">*</span>
            </span>
            <input type="datetime-local" bind:value={endDate} min={startDate}
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-xs outline-none border transition-all
                     {dateError ? 'border-red-500/50' : 'border-transparent focus:border-[#8B5E3C]'}" />
          </label>
        </div>
        {#if dateError}
          <p class="text-[10px] text-red-400" transition:fade={{ duration: 100 }}>A data de fim deve ser depois do início</p>
        {/if}
      </div>

      <!-- Images -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-4">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Imagens</p>
        <MediaUploader bind:imageUrls />
      </div>

      <!-- Description -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-3">
        <label class="block space-y-3">
          <span class="text-[10px] font-black uppercase tracking-widest text-gray-500 block">Descrição</span>
          <textarea bind:value={description} rows="4" placeholder="Descreva a promoção…"
            class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C] transition-all resize-none"></textarea>
        </label>
      </div>

      <!-- Location & Contacts -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-4">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Localização e Contactos</p>

        <label class="block space-y-1.5">
          <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Endereço</span>
          <input type="text" bind:value={locationAddress}
            placeholder="Ex: Av. Julius Nyerere, Maputo"
            class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
        </label>

        <div class="grid grid-cols-3 gap-2">
          <label class="block space-y-1.5">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Tel</span>
            <input type="tel" bind:value={contactPhone} placeholder="+258…"
              class="w-full p-2.5 rounded-lg bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
          </label>
          <label class="block space-y-1.5">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">WhatsApp</span>
            <input type="tel" bind:value={contactWhatsapp} placeholder="+258…"
              class="w-full p-2.5 rounded-lg bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
          </label>
          <label class="block space-y-1.5">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Email</span>
            <input type="email" bind:value={contactEmail} placeholder="email@…"
              class="w-full p-2.5 rounded-lg bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
          </label>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-4">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Formas de Pagamento</p>
        <PaymentMethods bind:selected={selectedPayments} />
      </div>

      <!-- Hours -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-4">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Horário</p>
        <OpenHours bind:hours={openHoursState} />
      </div>

      <!-- Terms -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-3">
        <label class="block space-y-3">
          <span class="text-[10px] font-black uppercase tracking-widest text-gray-500 block">Termos e Condições</span>
          <textarea bind:value={terms} rows="2" placeholder="Opcional"
            class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all resize-none"></textarea>
        </label>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-2">
        <a href="/promotions/{p.id}"
           class="flex-1 flex items-center justify-center py-3.5 rounded-2xl border border-gray-700
                  text-gray-400 font-bold text-sm hover:border-gray-500 hover:text-white transition-all">
          Cancelar
        </a>
        <button type="submit" disabled={!isValid}
          class="flex-1 py-3.5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-wider
                 hover:bg-gray-100 active:scale-[0.98] transition-all
                 disabled:opacity-40 disabled:cursor-not-allowed">
          Guardar Alterações
        </button>
      </div>

    </form>
  </div>
</div>


