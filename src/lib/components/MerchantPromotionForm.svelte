<script lang="ts">
  /**
   * MerchantPromotionForm.svelte
   *
   * Multi-step wizard open to ALL authenticated users.
   * Role-aware post-submit feedback:
   *   merchant/admin → success toast → redirect to dashboard
   *   user           → success + upgrade nudge modal (no hard redirect)
   *
   * Step 1 — Business Identity  (name + logo)
   * Step 2 — Promotion Core     (title, discount, dates)
   * Step 3 — Media              (images)
   * Step 4 — Optional Details   (description, location, contacts, payments, hours)
   * Step 5 — Review + Submit
   */
  import { createPromotion, getUploadSignature } from '../../routes/promotions.remote';
  import { fly, fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { X, ChevronRight, ChevronLeft, Check, Upload } from 'lucide-svelte';
  import { thumbImage, logoImage } from '$lib/utils/cloudinary';

  // ── Steps ──────────────────────────────────────────────────────────────────
  const STEPS = [
    { id: 1, label: 'Negócio'  },
    { id: 2, label: 'Promoção' },
    { id: 3, label: 'Imagens'  },
    { id: 4, label: 'Detalhes' },
    { id: 5, label: 'Publicar' },
  ] as const;

  let currentStep = $state(1);
  const TOTAL = STEPS.length;

  // ── Upload flags ───────────────────────────────────────────────────────────
  let logoUploading   = $state(false);
  let imagesUploading = $state(false);
  const isUploading   = $derived(logoUploading || imagesUploading);

  // ── Toast / modal ──────────────────────────────────────────────────────────
  let toast = $state<{
    message: string;
    type: 'success' | 'error';
    showUpgrade?: boolean;
  } | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success', showUpgrade = false) {
    toast = { message, type, showUpgrade };
    if (!showUpgrade) setTimeout(() => { toast = null; }, 4000);
  }

  // ── Form data ──────────────────────────────────────────────────────────────
  let merchantName    = $state('');
  let merchantLogoUrl = $state('');
  let title               = $state('');
  let discountPercentage  = $state('');
  let startDate           = $state('');
  let endDate             = $state('');
  let imageUrls           = $state<string[]>([]);
  let description         = $state('');
  let locationAddress     = $state('');
  let contactPhone        = $state('');
  let contactWhatsapp     = $state('');
  let contactEmail        = $state('');
  let terms               = $state('');
  let selectedPayments    = $state<string[]>([]);
  let openHoursState      = $state({
    monday: '', tuesday: '', wednesday: '', thursday: '',
    friday: '', saturday: '', sunday: '',
  });

  // ── Submit effect ──────────────────────────────────────────────────────────
  $effect(() => {
    if (!createPromotion.result) return;
    const role = page.data.user?.role;
    if (role === 'merchant' || role === 'admin') {
      showToast('Promoção publicada!');
      goto('/merchant/dashboard');
    } else {
      showToast('Promoção publicada!', 'success', true);
    }
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  const merchantInitial = $derived(merchantName.trim().charAt(0).toUpperCase() || '?');
  const dateError       = $derived(!!(endDate && startDate && endDate <= startDate));

  const stepValid = $derived.by(() => {
    switch (currentStep) {
      case 1: return merchantName.trim().length >= 2;
      case 2: return title.trim().length >= 3 && !!startDate && !!endDate && !dateError;
      default: return true;
    }
  });

  const hiddenImageUrls      = $derived(imageUrls.join(','));
  const hiddenPaymentMethods = $derived(selectedPayments.join(','));
  const hiddenOpenHours      = $derived(JSON.stringify(openHoursState));

  // ── Navigation ─────────────────────────────────────────────────────────────
  function next() { if (stepValid && !isUploading && currentStep < TOTAL) currentStep++; }
  function back() { if (currentStep > 1) currentStep--; }

  // ── Cloudinary upload ──────────────────────────────────────────────────────
  async function uploadToCloudinary(file: File, folder: string): Promise<string> {
    const { signature, timestamp, apiKey, cloudName } = await getUploadSignature({ folder });
    const fd = new FormData();
    fd.append('file', file);
    fd.append('signature', signature);
    fd.append('timestamp', String(timestamp));
    fd.append('api_key', apiKey);
    fd.append('folder', folder);
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.secure_url) throw new Error('Upload failed');
    return data.secure_url as string;
  }

  async function uploadLogo(files: FileList) {
    if (!files.length) return;
    logoUploading = true;
    try { merchantLogoUrl = await uploadToCloudinary(files[0], 'promotions'); }
    catch { showToast('Upload do logotipo falhou.', 'error'); }
    finally { logoUploading = false; }
  }

  async function uploadImages(files: FileList) {
    if (!files.length) return;
    imagesUploading = true;
    try {
      const urls = await Promise.all(Array.from(files).map((f) => uploadToCloudinary(f, 'promotions')));
      imageUrls = [...imageUrls, ...urls];
    } catch { showToast('Upload de imagens falhou.', 'error'); }
    finally { imagesUploading = false; }
  }

  function removeImage(url: string) { imageUrls = imageUrls.filter((i) => i !== url); }

  const PAYMENT_OPTIONS = ['CASH','M-PESA','E-MOLA','M-KESH','VISA','MASTERCARD','EFT','OTHER'];
</script>

<!-- ── Upgrade nudge modal (regular users only, post-submit) ──────────────── -->
{#if toast?.showUpgrade}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" transition:fade={{ duration: 200 }}>
    <div class="w-full max-w-sm bg-[#1E293B] border border-gray-700 rounded-3xl p-8 text-center space-y-5">
      <div class="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
        <Check size={28} class="text-emerald-400" strokeWidth={2.5} />
      </div>
      <div>
        <h3 class="text-lg font-black text-white">Promoção publicada!</h3>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">
          A sua promoção está no ar, mas tem menor visibilidade do que publicações de comerciantes verificados.
        </p>
      </div>
      <div class="bg-[#0D0D0D] border border-[#8B5E3C]/30 rounded-2xl p-4 text-left space-y-1.5">
        <p class="text-[11px] font-black text-[#8B5E3C] uppercase tracking-widest">Quer mais visibilidade?</p>
        <p class="text-xs text-gray-400 leading-relaxed">
          Comerciantes verificados aparecem no topo dos resultados e têm um selo de confiança.
        </p>
      </div>
      <div class="flex flex-col gap-2">
        <a href="/merchant/upgrade"
           class="w-full bg-white text-black font-black py-3 rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-100 transition-all text-center block">
          Tornar-me Comerciante
        </a>
        <button type="button" onclick={() => { toast = null; goto('/'); }}
          class="w-full text-gray-500 text-xs font-medium py-2 hover:text-white transition-colors">
          Continuar sem upgrade
        </button>
      </div>
    </div>
  </div>

<!-- ── Regular toast ─────────────────────────────────────────────────────── -->
{:else if toast}
  <div class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1E293B] text-sm font-medium border
              {toast.type === 'success' ? 'border-emerald-500/60 text-emerald-400' : 'border-red-500/60 text-red-400'}"
       transition:fly={{ y: 16, duration: 180 }}>
    {toast.message}
  </div>
{/if}

<!-- ── Wizard shell ────────────────────────────────────────────────────────── -->
<div class="min-h-screen flex items-start justify-center px-4 py-10 bg-[#080808]">
  <div class="w-full max-w-lg">

    <!-- Step indicator -->
    <nav class="flex items-center mb-8 px-1" aria-label="Progresso do formulário">
      {#each STEPS as step, i}
        <div class="flex flex-col items-center gap-1.5 flex-none">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black
                      transition-all duration-300 select-none
                      {currentStep === step.id
                        ? 'bg-white text-black scale-110 shadow-[0_0_0_3px_rgba(255,255,255,0.15)]'
                        : currentStep > step.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-800 text-gray-500'}">
            {#if currentStep > step.id}<Check size={13} strokeWidth={3} />{:else}{step.id}{/if}
          </div>
          <span class="text-[9px] font-bold uppercase tracking-wider hidden sm:block
                       {currentStep === step.id ? 'text-white' : 'text-gray-600'}">{step.label}</span>
        </div>
        {#if i < STEPS.length - 1}
          <div class="h-px flex-1 mx-1.5 mb-5 transition-colors duration-300
                      {currentStep > step.id ? 'bg-emerald-500/40' : 'bg-gray-800'}"></div>
        {/if}
      {/each}
    </nav>

    <form {...createPromotion} class="rounded-2xl bg-[#0D0D0D] border border-gray-800 shadow-2xl overflow-hidden">

      <!-- All hidden inputs always in DOM -->
      <input type="hidden" name="merchantName"       value={merchantName} />
      <input type="hidden" name="merchantLogoUrl"    value={merchantLogoUrl} />
      <input type="hidden" name="title"              value={title} />
      <input type="hidden" name="description"        value={description} />
      <input type="hidden" name="discountPercentage" value={discountPercentage} />
      <input type="hidden" name="startDate"          value={startDate} />
      <input type="hidden" name="endDate"            value={endDate} />
      <input type="hidden" name="locationAddress"    value={locationAddress} />
      <input type="hidden" name="contactPhone"       value={contactPhone} />
      <input type="hidden" name="contactWhatsapp"    value={contactWhatsapp} />
      <input type="hidden" name="contactEmail"       value={contactEmail} />
      <input type="hidden" name="terms"              value={terms} />
      <input type="hidden" name="imageUrls"          value={hiddenImageUrls} />
      <input type="hidden" name="paymentMethods"     value={hiddenPaymentMethods} />
      <input type="hidden" name="openHours"          value={hiddenOpenHours} />

      <!-- ── STEP 1: Business Identity ──────────────────────────────────── -->
      {#if currentStep === 1}
        <div class="p-8 space-y-6" transition:fade={{ duration: 120 }}>
          <header>
            <h2 class="text-base font-black text-white uppercase tracking-tight">Identidade do Negócio</h2>
            <p class="text-xs text-gray-500 mt-1">Como aparece nas promoções publicadas</p>
          </header>
          <div class="flex items-start gap-5">
            <div class="relative shrink-0">
              <div class="w-20 h-20 rounded-full border-2 border-gray-700 bg-[#1E293B] overflow-hidden flex items-center justify-center">
                {#if logoUploading}
                  <svg class="animate-spin w-6 h-6 text-[#8B5E3C]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="32" stroke-dashoffset="12"/>
                  </svg>
                {:else if merchantLogoUrl}
                  <img src={logoImage(merchantLogoUrl)} alt="Logotipo" class="w-full h-full object-contain" />
                {:else}
                  <span class="text-3xl font-black text-gray-600 select-none leading-none">{merchantInitial}</span>
                {/if}
              </div>
              {#if merchantLogoUrl && !logoUploading}
                <button type="button" onclick={() => { merchantLogoUrl = ''; }}
                  class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-900 border border-gray-700
                         text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Remover logotipo"><X size={11} strokeWidth={3} /></button>
              {/if}
            </div>
            <div class="flex-1 space-y-2.5 pt-1">
              <label class="block cursor-pointer">
                <div class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed
                            border-gray-700 hover:border-gray-500 hover:bg-white/5 transition-all text-xs text-gray-400 font-medium">
                  <Upload size={13} />{logoUploading ? 'A carregar…' : 'Carregar logotipo'}
                </div>
                <input type="file" accept="image/*" class="sr-only"
                  onchange={(e) => e.currentTarget.files && uploadLogo(e.currentTarget.files)} />
              </label>
              <input type="url" bind:value={merchantLogoUrl} placeholder="Ou cole o URL do logotipo"
                class="w-full px-3 py-2.5 text-xs rounded-xl bg-[#1E293B] border border-gray-800 text-white
                       outline-none focus:border-[#8B5E3C] transition-all placeholder:text-gray-600" />
              <p class="text-[10px] text-gray-600">PNG, JPG ou SVG. Qualquer tamanho.</p>
            </div>
          </div>
          <div class="space-y-1.5">
            <label for="biz-name" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              Nome do Negócio <span class="text-[#8B5E3C]">*</span>
            </label>
            <input id="biz-name" type="text" bind:value={merchantName} placeholder="Ex: Restaurante Maputo"
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border transition-all
                     {merchantName.length > 0 && merchantName.trim().length < 2
                       ? 'border-red-500/50' : 'border-transparent focus:border-[#8B5E3C]'}" />
            {#if merchantName.length > 0 && merchantName.trim().length < 2}
              <p class="text-[10px] text-red-400 ml-1" transition:fade={{ duration: 100 }}>Mínimo 2 caracteres</p>
            {/if}
          </div>
        </div>

      <!-- ── STEP 2: Promotion Core ──────────────────────────────────────── -->
      {:else if currentStep === 2}
        <div class="p-8 space-y-5" transition:fade={{ duration: 120 }}>
          <header>
            <h2 class="text-base font-black text-white uppercase tracking-tight">A Promoção</h2>
            <p class="text-xs text-gray-500 mt-1">O essencial que os clientes vão ver primeiro</p>
          </header>
          <div class="space-y-1.5">
            <label for="promo-title" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              Título <span class="text-[#8B5E3C]">*</span>
            </label>
            <input id="promo-title" type="text" bind:value={title} placeholder="Ex: 30% de desconto em toda a ementa"
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border transition-all
                     {title.length > 0 && title.trim().length < 3 ? 'border-red-500/50' : 'border-transparent focus:border-[#8B5E3C]'}" />
            {#if title.length > 0 && title.trim().length < 3}
              <p class="text-[10px] text-red-400 ml-1" transition:fade={{ duration: 100 }}>Mínimo 3 caracteres</p>
            {/if}
          </div>
          <div class="space-y-1.5">
            <label for="discount" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Desconto %</label>
            <div class="relative">
              <input id="discount" type="number" bind:value={discountPercentage} inputmode="numeric" min="1" max="100" placeholder="Ex: 30"
                class="w-full p-3 pr-10 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold pointer-events-none">%</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label for="start-date" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                Início <span class="text-[#8B5E3C]">*</span>
              </label>
              <input id="start-date" type="datetime-local" bind:value={startDate}
                class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
            </div>
            <div class="space-y-1.5">
              <label for="end-date" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                Fim <span class="text-[#8B5E3C]">*</span>
              </label>
              <input id="end-date" type="datetime-local" bind:value={endDate} min={startDate}
                class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-xs outline-none border transition-all
                       {dateError ? 'border-red-500/50' : 'border-transparent focus:border-[#8B5E3C]'}" />
            </div>
          </div>
          {#if dateError}
            <p class="text-[10px] text-red-400 -mt-2" transition:fade={{ duration: 100 }}>A data de fim deve ser depois do início</p>
          {/if}
        </div>

      <!-- ── STEP 3: Media ───────────────────────────────────────────────── -->
      {:else if currentStep === 3}
        <div class="p-8 space-y-5" transition:fade={{ duration: 120 }}>
          <header>
            <h2 class="text-base font-black text-white uppercase tracking-tight">Imagens</h2>
            <p class="text-xs text-gray-500 mt-1">
              A primeira imagem é a capa.
              {#if imageUrls.length > 0}
                <span class="text-emerald-400 font-medium">{imageUrls.length} adicionada{imageUrls.length !== 1 ? 's' : ''}.</span>
              {/if}
            </p>
          </header>
          <label class="block cursor-pointer">
            <div class="relative border-2 border-dashed border-gray-800 rounded-2xl p-10 text-center
                        hover:border-gray-600 hover:bg-white/2 transition-all group">
              <input type="file" multiple accept="image/*" class="sr-only" disabled={imagesUploading}
                onchange={(e) => e.currentTarget.files && uploadImages(e.currentTarget.files)} />
              {#if imagesUploading}
                <div class="flex flex-col items-center gap-3">
                  <svg class="animate-spin w-8 h-8 text-[#8B5E3C]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="32" stroke-dashoffset="12"/>
                  </svg>
                  <p class="text-xs text-gray-400">A carregar imagens…</p>
                </div>
              {:else}
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-gray-800 group-hover:bg-gray-700 transition-colors flex items-center justify-center">
                    <Upload size={20} class="text-gray-400" />
                  </div>
                  <div>
                    <p class="text-sm text-gray-300 font-medium">Clique ou arraste imagens</p>
                    <p class="text-xs text-gray-600 mt-0.5">PNG, JPG, WEBP — múltiplos ficheiros</p>
                  </div>
                </div>
              {/if}
            </div>
          </label>
          {#if imageUrls.length > 0}
            <div class="grid grid-cols-3 gap-2">
              {#each imageUrls as url, i (url)}
                <div class="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-900 group" style="aspect-ratio: 4/3;">
                  <img src={thumbImage(url)} alt="Imagem {i + 1}" class="w-full h-full object-contain" loading="lazy" />
                  {#if i === 0}
                    <span class="absolute top-1.5 left-1.5 bg-[#8B5E3C] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide pointer-events-none">Capa</span>
                  {/if}
                  <button type="button" onclick={() => removeImage(url)}
                    class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 border border-gray-700
                           text-gray-300 hover:text-white hover:bg-red-900/80 hover:border-red-500
                           flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Remover imagem {i + 1}"><X size={12} strokeWidth={3} /></button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

      <!-- ── STEP 4: Optional Details ───────────────────────────────────── -->
      {:else if currentStep === 4}
        <div class="p-8 space-y-5" transition:fade={{ duration: 120 }}>
          <header>
            <h2 class="text-base font-black text-white uppercase tracking-tight">Detalhes</h2>
            <p class="text-xs text-gray-500 mt-1">Tudo opcional — mais detalhes aumentam conversão</p>
          </header>
          <div class="space-y-1.5">
            <label for="desc" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Descrição</label>
            <textarea id="desc" bind:value={description} rows="3" placeholder="Descreva a promoção em detalhe…"
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C] transition-all resize-none"></textarea>
          </div>
          <div class="space-y-1.5">
            <label for="address" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Endereço</label>
            <input id="address" type="text" bind:value={locationAddress} placeholder="Ex: Av. Julius Nyerere, Maputo"
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="space-y-1.5">
              <label for="phone" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Tel</label>
              <input id="phone" type="tel" bind:value={contactPhone} placeholder="+258…"
                class="w-full p-2.5 rounded-lg bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
            </div>
            <div class="space-y-1.5">
              <label for="whatsapp" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">WhatsApp</label>
              <input id="whatsapp" type="tel" bind:value={contactWhatsapp} placeholder="+258…"
                class="w-full p-2.5 rounded-lg bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
            </div>
            <div class="space-y-1.5">
              <label for="email" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Email</label>
              <input id="email" type="email" bind:value={contactEmail} placeholder="email@…"
                class="w-full p-2.5 rounded-lg bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
            </div>
          </div>
          <div class="space-y-2">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Formas de Pagamento</span>
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
          <div class="space-y-2">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Horário</span>
            <div class="grid grid-cols-2 gap-1.5">
              {#each Object.keys(openHoursState) as day}
                <div class="flex items-center gap-2 px-2.5 py-2 bg-[#1E293B]/40 rounded-lg border border-gray-800">
                  <span class="text-[10px] text-gray-600 w-6 uppercase shrink-0 font-bold">{day.slice(0,3)}</span>
                  <input type="text" bind:value={openHoursState[day as keyof typeof openHoursState]} placeholder="09:00–18:00"
                    class="flex-1 bg-transparent text-white text-[11px] outline-none placeholder:text-gray-700" />
                </div>
              {/each}
            </div>
          </div>
          <div class="space-y-1.5">
            <label for="terms" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Termos e Condições</label>
            <textarea id="terms" bind:value={terms} rows="2" placeholder="Opcional"
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all resize-none"></textarea>
          </div>
        </div>

      <!-- ── STEP 5: Review + Submit ─────────────────────────────────────── -->
      {:else if currentStep === 5}
        <div class="p-8 space-y-6" transition:fade={{ duration: 120 }}>
          <header>
            <h2 class="text-base font-black text-white uppercase tracking-tight">Rever e Publicar</h2>
            <p class="text-xs text-gray-500 mt-1">Confirme antes de publicar</p>
          </header>
          <div class="rounded-2xl overflow-hidden border border-gray-700 bg-[#1E293B]">
            <div class="relative bg-gray-900 overflow-hidden" style="height: 190px;">
              {#if imageUrls.length}
                <img src={thumbImage(imageUrls[0])} alt={title} class="w-full h-full object-contain" />
              {:else}
                <div class="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-700">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  <span class="text-xs">Sem imagens</span>
                </div>
              {/if}
              {#if discountPercentage}
                <span class="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest pointer-events-none">
                  {discountPercentage}% OFF
                </span>
              {/if}
            </div>
            <div class="flex items-center gap-2.5 px-3 py-2 border-b border-gray-700/50">
              <div class="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                {#if merchantLogoUrl}<img src={logoImage(merchantLogoUrl)} alt="" class="w-full h-full object-contain" />
                {:else}<span class="text-xs font-black text-gray-500 select-none">{merchantInitial}</span>{/if}
              </div>
              <span class="text-xs font-black text-gray-300 truncate">{merchantName || 'Nome do negócio'}</span>
            </div>
            <div class="px-3 py-2.5">
              <p class="text-sm font-bold text-white truncate">{title || 'Título da promoção'}</p>
              {#if locationAddress}<p class="text-[11px] text-gray-500 mt-0.5 truncate">📍 {locationAddress}</p>{/if}
              {#if endDate}
                <p class="text-[10px] text-gray-600 mt-1">
                  Até {new Date(endDate).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: '2-digit' })}
                </p>
              {/if}
            </div>
          </div>
          <div class="space-y-0.5">
            {#each [
              { label: 'Nome do negócio', ok: merchantName.trim().length >= 2, val: merchantName || '—' },
              { label: 'Logotipo',        ok: !!merchantLogoUrl,                val: merchantLogoUrl ? 'Carregado' : 'Usando inicial' },
              { label: 'Título',          ok: title.trim().length >= 3,         val: title || '—' },
              { label: 'Desconto',        ok: !!discountPercentage,             val: discountPercentage ? `${discountPercentage}%` : 'Não definido' },
              { label: 'Imagens',         ok: imageUrls.length > 0,            val: imageUrls.length ? `${imageUrls.length} foto(s)` : 'Sem imagens' },
              { label: 'Localização',     ok: !!locationAddress,                val: locationAddress || 'Não definida' },
            ] as row}
              <div class="flex items-center justify-between py-2 border-b border-gray-800/50">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded-full flex items-center justify-center shrink-0
                              {row.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-600'}">
                    {#if row.ok}<Check size={9} strokeWidth={3} />{:else}<span class="text-[9px] leading-none">–</span>{/if}
                  </div>
                  <span class="text-xs text-gray-500 font-medium">{row.label}</span>
                </div>
                <span class="text-xs text-gray-400 truncate max-w-40 text-right">{row.val}</span>
              </div>
            {/each}
          </div>
          <button type="submit" disabled={isUploading}
            class="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-widest text-[11px]
                   hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {isUploading ? 'Aguarde…' : 'Confirmar e Publicar'}
          </button>
        </div>
      {/if}

      <!-- Navigation footer -->
      <div class="flex items-center justify-between px-8 pb-8">
        <button type="button" onclick={back} disabled={currentStep === 1}
          class="flex items-center gap-1 text-xs text-gray-500 font-bold uppercase tracking-wide
                 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
          <ChevronLeft size={14} />{currentStep === 5 ? 'Editar' : 'Anterior'}
        </button>
        {#if currentStep < TOTAL}
          <button type="button" onclick={next} disabled={!stepValid || isUploading}
            class="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-white text-black text-xs font-black
                   uppercase tracking-wider hover:bg-gray-100 active:scale-[0.98] transition-all
                   disabled:opacity-30 disabled:cursor-not-allowed">
            {currentStep === TOTAL - 1 ? 'Rever' : 'Continuar'}<ChevronRight size={14} />
          </button>
        {/if}
      </div>
    </form>

    <p class="text-center text-[10px] text-gray-700 mt-4 font-bold uppercase tracking-widest">
      Passo {currentStep} / {TOTAL}
    </p>
  </div>
</div>

