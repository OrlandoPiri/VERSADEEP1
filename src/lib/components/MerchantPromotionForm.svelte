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
   * Step 3 — Media              (images — delegated to MediaUploader)
   * Step 4 — Optional Details   (description, location, contacts, payments, hours)
   * Step 5 — Review + Submit
   */
  import {
  createPromotion,
  getUploadSignature,
  getMerchantBusinesses,
  createBusiness
} from '../../routes/promotions.remote';
  import { CATEGORIES } from '$lib/utils/categories';
  import { fly, fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { ChevronRight, ChevronLeft, Check, Upload } from 'lucide-svelte';
  import { thumbImage, logoImage } from '$lib/utils/cloudinary';
  import { onMount } from 'svelte';
  import MediaUploader from '$lib/components/MediaUploader.svelte';
  import PaymentMethods from '$lib/components/PaymentMethods.svelte';
  import OpenHours from '$lib/components/OpenHours.svelte';

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
  // Note: image-upload state now lives entirely inside MediaUploader.
  // Only the business-logo upload (a separate concern) is tracked here.
  let logoUploading = $state(false);
  const isUploading  = $derived(logoUploading);

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
  let category=$state('all');
let businesses = $state<any[]>([]);

let selectedBusinessId = $state('');

let creatingBusiness = $state(false);

let businessName = $state('');

let businessLogoUrl = $state('');


const selectedBusiness = $derived(
  businesses.find(
    (b) => String(b.id) === selectedBusinessId
  )
);

const reviewBusinessName = $derived(
  selectedBusiness?.name ||
  businessName ||
  ''
);

const reviewBusinessLogo = $derived(
  selectedBusiness?.logoUrl ||
  businessLogoUrl ||
  ''
);

const reviewBusinessInitial = $derived(
  reviewBusinessName?.charAt(0)?.toUpperCase() || '?'
);

  // ── Submit effect ──────────────────────────────────────────────────────────
  // $effect(() => {
  //   if (!createPromotion.result) return;
  //   const role = page.data.user?.role;
  //   if (role === 'merchant' || role === 'admin') {
  //     showToast('Promoção publicada!');
  //     goto('/merchant/dashboard');
  //   } else {
  //     showToast('Promoção publicada!', 'success', true);
  //   }
  // });



onMount(async () => {
  await loadBusinesses();
});

async function loadBusinesses() {
  businesses = await getMerchantBusinesses();
}

  // ── Derived ────────────────────────────────────────────────────────────────
  const dateError       = $derived(!!(endDate && startDate && endDate <= startDate));

  const stepValid = $derived.by(() => {
    switch (currentStep) {
      case 1:
  return !!selectedBusinessId;
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

  // ── Cloudinary upload (business logo only — promotion images are handled
  //    entirely inside MediaUploader) ─────────────────────────────────────────
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
    try { 
      businessLogoUrl = await uploadToCloudinary(files[0], 'promotions');
     }
    catch { showToast('Upload do logotipo falhou.', 'error'); }
    finally { logoUploading = false; }
  }

  async function handleCreateBusiness() {
  if (!businessName.trim()) return;

  creatingBusiness = true;

  try {
    const created = await createBusiness({
      name: businessName,
      logoUrl: businessLogoUrl
    });

    await loadBusinesses();

    selectedBusinessId = String(created.id);

    businessName = '';

    businessLogoUrl = '';
  } catch (e) {
    console.error(e);
    showToast('Erro ao criar negócio', 'error');
  } finally {
    creatingBusiness = false;
  }
}
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


        <form
      {...createPromotion.enhance(async ({ submit }) => {
        try {
          await submit();
          if (!createPromotion.result) {
            showToast('Erro ao publicar promoção.', 'error');
            return;
          }
          const role = page.data.user?.role;
          if (role === 'merchant' || role === 'admin') {
            showToast('Promoção publicada!');
            goto('/merchant/dashboard');
          } else {
            showToast('Promoção publicada!', 'success', true);
          }
        } catch (err) {
          console.error(err);
          showToast('Erro ao publicar promoção.', 'error');
        }
      })}
      class="rounded-2xl bg-[#0D0D0D] border border-gray-800 shadow-2xl overflow-hidden"
    >

      <!-- All hidden inputs always in DOM -->
       <input type="hidden" name="businessId" value={selectedBusinessId} />
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
      <input type="hidden" name="category"           value={category} />

      <!-- ── STEP 1: Business Identity ──────────────────────────────────── -->
{#if currentStep === 1}
       <div class="p-8 space-y-6" transition:fade={{ duration: 120 }}>

  <header>
    <h2 class="text-base font-black text-white uppercase tracking-tight">
      Negócio
    </h2>

    <p class="text-xs text-gray-500 mt-1">
      Escolha uma loja existente ou crie uma nova
    </p>
  </header>

  {#if businesses.length > 0}

    <div class="space-y-2">
      <label class="block">
        <span class="text-xs text-gray-400 font-bold uppercase block mb-2">
          Escolher negócio
        </span>
        <select
          bind:value={selectedBusinessId}
          class="w-full p-3 rounded-xl bg-[#1E293B] text-white"
        >
          <option value="">Selecionar</option>

          {#each businesses as biz}
            <option value={biz.id}>
              {biz.name}
            </option>
          {/each}
        </select>
      </label>
    </div>

    <div class="border-t border-gray-800 pt-5">
      <p class="text-[10px] text-gray-600 uppercase font-bold mb-3">
        Ou criar novo negócio
      </p>
    </div>

{/if}

  <div class="space-y-3">

    <input
      type="text"
      bind:value={businessName}
      placeholder="Nome do negócio"
      class="w-full p-3 rounded-xl bg-[#1E293B] text-white"
    />
<div class="space-y-3">

  <label
    class="block cursor-pointer"
  >
    <div
      class="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-[#8B5E3C] transition-all"
    >
    
      <input
        type="file"
        accept="image/*"
        class="hidden"
        disabled={logoUploading}
        onchange={(e) =>
          e.currentTarget.files &&
          uploadLogo(e.currentTarget.files)}
      />

      {#if logoUploading}
        <p class="text-sm text-gray-400">
          A carregar logotipo...
        </p>

      {:else if businessLogoUrl}
        <img
          src={logoImage(businessLogoUrl)}
          alt="Logotipo do negócio"
          class="w-20 h-20 object-contain mx-auto rounded-lg"
        />

        <p class="text-xs text-emerald-400 mt-2">
          Logotipo carregado
        </p>

      {:else}
        <div class="space-y-2">
          <Upload
            size={24}
            class="mx-auto text-gray-500"
          />

          <p class="text-sm text-gray-400">
            Carregar logotipo
          </p>
        </div>
      {/if}
    </div>
  </label>

</div>

    <button
      type="button"
      onclick={handleCreateBusiness}
      disabled={creatingBusiness}
      class="w-full bg-[#8B5E3C] text-white py-3 rounded-xl font-bold"
    >
      {creatingBusiness ? 'Criando...' : 'Criar negócio'}
    </button>

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
            <label class="block">
              <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
                Título <span class="text-[#8B5E3C]">*</span>
              </span>
              <input type="text" bind:value={title} placeholder="Ex: 30% de desconto em toda a ementa"
                class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border transition-all
                       {title.length > 0 && title.trim().length < 3 ? 'border-red-500/50' : 'border-transparent focus:border-[#8B5E3C]'}" />
            </label>
            {#if title.length > 0 && title.trim().length < 3}
              <p class="text-[10px] text-red-400 ml-1" transition:fade={{ duration: 100 }}>Mínimo 3 caracteres</p>
            {/if}
          </div>

          <label class="block">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Desconto %</span>
            <div class="relative">
              <input type="number" bind:value={discountPercentage} inputmode="numeric" min="1" max="100" placeholder="Ex: 30"
                class="w-full p-3 pr-10 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C] transition-all" />
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold pointer-events-none">%</span>
            </div>
          </label>

          <label class="block">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
              Categoria <span class="text-[#8B5E3C]">*</span>
            </span>
            <select
              bind:value={category}
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C]"
            >
              <option value="all">Todas</option>
              {#each CATEGORIES as cat (cat.slug)}
                <option value={cat.slug}>
                  {cat.label}
                </option>
              {/each}
            </select>
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

          <MediaUploader bind:imageUrls />
        </div>

      <!-- ── STEP 4: Optional Details ───────────────────────────────────── -->
      {:else if currentStep === 4}
        <div class="p-8 space-y-5" transition:fade={{ duration: 120 }}>
          <header>
            <h2 class="text-base font-black text-white uppercase tracking-tight">Detalhes</h2>
            <p class="text-xs text-gray-500 mt-1">Tudo opcional — mais detalhes aumentam conversão</p>
          </header>

          <label class="block space-y-1.5">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Descrição</span>
            <textarea bind:value={description} rows="3" placeholder="Descreva a promoção em detalhe…"
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-sm outline-none border border-transparent focus:border-[#8B5E3C] transition-all resize-none"></textarea>
          </label>

          <label class="block space-y-1.5">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Endereço</span>
            <input type="text" bind:value={locationAddress} placeholder="Ex: Av. Julius Nyerere, Maputo"
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

          <div class="space-y-2">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Formas de Pagamento</span>
            <PaymentMethods bind:selected={selectedPayments} />
          </div>

          <div class="space-y-2">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Horário</span>
            <OpenHours bind:hours={openHoursState} />
          </div>

          <label class="block space-y-1.5">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Termos e Condições</span>
            <textarea bind:value={terms} rows="2" placeholder="Opcional"
              class="w-full p-3 rounded-xl bg-[#1E293B] text-white text-xs outline-none border border-transparent focus:border-[#8B5E3C] transition-all resize-none"></textarea>
          </label>
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
                {#if reviewBusinessLogo}<img src={logoImage(reviewBusinessLogo)} alt="" class="w-full h-full object-contain" />
                {:else}<span class="text-xs font-black text-gray-500 select-none">{reviewBusinessInitial}</span>{/if}
              </div>
              <span class="text-xs font-black text-gray-300 truncate">{reviewBusinessName || 'Nome do negócio'}</span>
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
  {
    label: 'Nome do negócio',
    ok: reviewBusinessName.trim().length >= 2,
    val: reviewBusinessName || '—'
  },

  {
    label: 'Logotipo',
    ok: !!reviewBusinessLogo,
    val: reviewBusinessLogo
      ? 'Carregado'
      : 'Usando inicial'
  },
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



