<script lang="ts">
  /**
   * /promotions/[id]/edit/+page.svelte
   *
   * Key architectural decision: images are uploaded to Cloudinary IMMEDIATELY
   * when files are selected — not at submit time. This means the form always
   * submits with clean URLs in the hidden input, no submit interception needed,
   * and updatePromotion.result fires reliably.
   *
   * This matches MerchantPromotionForm's pattern exactly.
   */
  import { updatePromotion, getUploadSignature } from '../../../../promotions.remote';
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { X, Upload, Check, ArrowLeft, GripVertical } from 'lucide-svelte';
  import { thumbImage } from '$lib/utils/cloudinary';
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
  // Matches MerchantPromotionForm's pattern: simple falsy guard, then redirect.
  // No submitting flag needed here — the form submits normally.
  $effect(() => {
    if (!updatePromotion.result) return;
    if (updatePromotion.result.success) {
      showToast('Promoção actualizada!');
      goto(`/promotions/${p.id}`);
    } else {
      showToast('Erro ao actualizar promoção.', 'error');
    }
  });

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

  // ── Image handling — EAGER UPLOAD ─────────────────────────────────────────
  // imageUrls is always a flat string[] of resolved Cloudinary URLs.
  // Files are uploaded immediately when picked. No File objects ever live here.
  // This means the hidden input always has valid URLs and no submit interception
  // is needed — the form just submits normally.
  let imageUrls    = $state<string[]>((p.imageUrls as string[]) ?? []);
  let imgUploading = $state(false);

  async function uploadToCloudinary(file: File): Promise<string> {
    const { signature, timestamp, apiKey, cloudName } = await getUploadSignature({ folder: 'promotions' });
    const fd = new FormData();
    fd.append('file', file);
    fd.append('signature', signature);
    fd.append('timestamp', String(timestamp));
    fd.append('api_key', apiKey);
    fd.append('folder', 'promotions');
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
    const json = await res.json();
    if (!json.secure_url) throw new Error('Upload failed');
    return json.secure_url as string;
  }

  async function addImages(files: FileList) {
    if (!files.length) return;
    imgUploading = true;
    try {
      const newUrls = await Promise.all(Array.from(files).map(uploadToCloudinary));
      imageUrls = [...imageUrls, ...newUrls];
    } catch {
      showToast('Upload de imagens falhou. Tente novamente.', 'error');
    } finally {
      imgUploading = false;
    }
  }

  function removeImage(i: number) {
    imageUrls = imageUrls.filter((_, idx) => idx !== i);
  }

  // ── Drag-to-reorder (HTML5, zero deps) ────────────────────────────────────
  let dragIdx = $state<number | null>(null);

  function onDragStart(i: number) { dragIdx = i; }
  function onDragOver(e: DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const arr = [...imageUrls];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(i, 0, moved);
    imageUrls = arr;
    dragIdx = i;
  }
  function onDragEnd() { dragIdx = null; }

  // ── Derived ────────────────────────────────────────────────────────────────
  const dateError      = $derived(!!(endDate && startDate && endDate <= startDate));
  const isValid        = $derived(title.trim().length >= 3 && !!startDate && !!endDate && !dateError);
  const hiddenImages   = $derived(imageUrls.join(','));
  const hiddenPayments = $derived(selectedPayments.join(','));
  const hiddenHours    = $derived(JSON.stringify(openHoursState));

  const PAYMENT_OPTIONS = ['CASH','M-PESA','E-MOLA','M-KESH','VISA','MASTERCARD','EFT','OTHER'];
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
        <p class="text-xs text-gray-500 mt-0.5">ID #{p.id} · {p.merchantName}</p>
      </div>
    </div>

    <!--
      No onsubmit override. Form submits normally via {...updatePromotion}.
      updatePromotion.result gets set → $effect fires → redirect.
    -->
    <form {...updatePromotion} class="space-y-5">

      <!-- Hidden fields — always present -->
      <input type="hidden" name="id"              value={p.id} />
      <input type="hidden" name="merchantName"    value={p.merchantName ?? ''} />
      <input type="hidden" name="startDate"       value={startDate} />
      <input type="hidden" name="endDate"         value={endDate} />
      <input type="hidden" name="description"     value={description} />
      <input type="hidden" name="terms"           value={terms} />
      <input type="hidden" name="discountPercentage" value={discountPercentage} />
      <input type="hidden" name="locationAddress" value={locationAddress} />
      <input type="hidden" name="contactPhone"    value={contactPhone} />
      <input type="hidden" name="contactWhatsapp" value={contactWhatsapp} />
      <input type="hidden" name="contactEmail"    value={contactEmail} />
      <input type="hidden" name="imageUrls"       value={hiddenImages} />
      <input type="hidden" name="paymentMethods"  value={hiddenPayments} />
      <input type="hidden" name="openHours"       value={hiddenHours} />

      <!-- Core -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-5">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Promoção</p>

        <div class="space-y-1.5">
          <label for="edit-title" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
            Título <span class="text-[#8B5E3C]">*</span>
          </label>
          <input id="edit-title" type="text" bind:value={title}
            class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border transition-all
                   {title.length > 0 && title.trim().length < 3 ? 'border-red-500/50' : 'border-transparent focus:border-[#8B5E3C]'}" />
          {#if title.length > 0 && title.trim().length < 3}
            <p class="text-[10px] text-red-400 ml-1" transition:fade={{ duration: 100 }}>Mínimo 3 caracteres</p>
          {/if}
        </div>

        <div class="space-y-1.5">
          <label for="edit-discount" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Desconto %</label>
          <div class="relative max-w-40">
            <input id="edit-discount" type="number" bind:value={discountPercentage}
              inputmode="numeric" min="1" max="100"
              class="w-full p-3 pr-8 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold pointer-events-none">%</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label for="edit-start" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              Início <span class="text-[#8B5E3C]">*</span>
            </label>
            <input id="edit-start" type="datetime-local" bind:value={startDate}
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
          </div>
          <div class="space-y-1.5">
            <label for="edit-end" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              Fim <span class="text-[#8B5E3C]">*</span>
            </label>
            <input id="edit-end" type="datetime-local" bind:value={endDate} min={startDate}
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-xs outline-none border transition-all
                     {dateError ? 'border-red-500/50' : 'border-transparent focus:border-[#8B5E3C]'}" />
          </div>
        </div>
        {#if dateError}
          <p class="text-[10px] text-red-400" transition:fade={{ duration: 100 }}>A data de fim deve ser depois do início</p>
        {/if}
      </div>

      <!-- Images — uploaded eagerly on pick -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Imagens</p>
          {#if imageUrls.length > 1}
            <span class="text-[10px] text-gray-600">Arraste para reordenar · Primeira = capa</span>
          {/if}
        </div>

        {#if imageUrls.length > 0}
          <div class="grid grid-cols-3 gap-2">
            {#each imageUrls as url, i (url)}
              <div
                draggable="true"
                role="button"
                tabindex="0"
                ondragstart={() => onDragStart(i)}
                ondragover={(e) => onDragOver(e, i)}
                ondragend={onDragEnd}
                class="relative rounded-xl overflow-hidden border bg-gray-900 group cursor-grab active:cursor-grabbing transition-all select-none
                       {dragIdx === i ? 'border-[#8B5E3C] opacity-60 scale-95' : 'border-gray-800'}"
                style="aspect-ratio: 4/3;"
              >
                <img src={thumbImage(url)} alt="Imagem {i + 1}"
                     class="w-full h-full object-contain pointer-events-none" loading="lazy" />
                {#if i === 0}
                  <span class="absolute top-1.5 left-1.5 bg-[#8B5E3C] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase pointer-events-none">Capa</span>
                {/if}
                <div class="absolute top-1.5 right-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <GripVertical size={13} class="text-white drop-shadow" />
                </div>
                <button type="button" onclick={() => removeImage(i)}
                  class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 border border-gray-700
                         text-gray-300 hover:text-white hover:bg-red-900/80 hover:border-red-500
                         flex items-center justify-center transition-all
                         opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Remover imagem {i + 1}">
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            {/each}
          </div>
        {/if}

        <!-- File picker — uploads immediately on change -->
        <label class="block cursor-pointer">
          <div class="border-2 border-dashed border-gray-800 rounded-xl p-5 text-center
                      hover:border-gray-600 hover:bg-white/2 transition-all">
            <input type="file" multiple accept="image/*" class="sr-only"
              disabled={imgUploading}
              onchange={(e) => e.currentTarget.files && addImages(e.currentTarget.files)} />
            <div class="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
              {#if imgUploading}
                <svg class="animate-spin w-4 h-4 text-[#8B5E3C]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="32" stroke-dashoffset="12"/>
                </svg>
                A carregar…
              {:else}
                <Upload size={14} /> Adicionar imagens
              {/if}
            </div>
          </div>
        </label>
      </div>

      <!-- Description -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-3">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Descrição</p>
        <textarea bind:value={description} rows="4" placeholder="Descreva a promoção…"
          class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C] transition-all resize-none"></textarea>
      </div>

      <!-- Location & Contacts -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-4">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Localização e Contactos</p>
        <div class="space-y-1.5">
          <label for="edit-address" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Endereço</label>
          <input id="edit-address" type="text" bind:value={locationAddress}
            placeholder="Ex: Av. Julius Nyerere, Maputo"
            class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div class="space-y-1.5">
            <label for="edit-phone" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Tel</label>
            <input id="edit-phone" type="tel" bind:value={contactPhone} placeholder="+258…"
              class="w-full p-2.5 rounded-lg bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
          </div>
          <div class="space-y-1.5">
            <label for="edit-wa" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">WhatsApp</label>
            <input id="edit-wa" type="tel" bind:value={contactWhatsapp} placeholder="+258…"
              class="w-full p-2.5 rounded-lg bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
          </div>
          <div class="space-y-1.5">
            <label for="edit-email" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Email</label>
            <input id="edit-email" type="email" bind:value={contactEmail} placeholder="email@…"
              class="w-full p-2.5 rounded-lg bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
          </div>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-4">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Formas de Pagamento</p>
        <div class="grid grid-cols-2 gap-2">
          {#each PAYMENT_OPTIONS as opt}
            {@const active = selectedPayments.includes(opt)}
            <label class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all select-none
                          {active ? 'bg-[#8B5E3C]/10 border-[#8B5E3C]/50 text-white' : 'bg-[#1E293B]/40 border-gray-800 text-gray-500 hover:border-gray-600'}">
              <input type="checkbox" value={opt} bind:group={selectedPayments} class="sr-only" />
              <div class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                          {active ? 'bg-[#8B5E3C] border-[#8B5E3C]' : 'border-gray-600'}">
                {#if active}<Check size={9} strokeWidth={3} class="text-white" />{/if}
              </div>
              <span class="text-[11px] font-medium">{opt}</span>
            </label>
          {/each}
        </div>
      </div>

      <!-- Hours -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-4">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Horário</p>
        <div class="grid grid-cols-2 gap-1.5">
          {#each Object.keys(openHoursState) as day}
            <div class="flex items-center gap-2 px-2.5 py-2 bg-[#1E293B]/40 rounded-lg border border-gray-800">
              <span class="text-[10px] text-gray-600 w-6 uppercase shrink-0 font-bold">{day.slice(0,3)}</span>
              <input type="text" bind:value={openHoursState[day]} placeholder="09:00–18:00"
                class="flex-1 bg-transparent text-white text-[11px] outline-none placeholder:text-gray-700" />
            </div>
          {/each}
        </div>
      </div>

      <!-- Terms -->
      <div class="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 space-y-3">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Termos e Condições</p>
        <textarea bind:value={terms} rows="2" placeholder="Opcional"
          class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all resize-none"></textarea>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-2">
        <a href="/promotions/{p.id}"
           class="flex-1 flex items-center justify-center py-3.5 rounded-2xl border border-gray-700
                  text-gray-400 font-bold text-sm hover:border-gray-500 hover:text-white transition-all">
          Cancelar
        </a>
        <button type="submit" disabled={!isValid || imgUploading}
          class="flex-1 py-3.5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-wider
                 hover:bg-gray-100 active:scale-[0.98] transition-all
                 disabled:opacity-40 disabled:cursor-not-allowed">
          {imgUploading ? 'A carregar imagens…' : 'Guardar Alterações'}
        </button>
      </div>

    </form>
  </div>
</div>