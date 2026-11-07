<script lang="ts">
  /**
   * MediaUploader.svelte
   *
   * Self-contained image uploader for promotion media.
   * Owns everything: selection, validation, Cloudinary upload, previews,
   * removal, native HTML5 drag-to-reorder, and cover-image display.
   *
   * The parent only owns the array:
   *   let imageUrls = $state<string[]>([]);
   *   <MediaUploader bind:imageUrls />
   *
   * imageUrls[0] is always treated as the cover image — order is the
   * single source of truth, there is no separate "cover" state.
   *
   * Upload happens immediately on file selection (not at form submit),
   * so imageUrls always contains resolved Cloudinary URLs and the
   * consuming form's hidden input never needs special submit handling.
   */
  import { getUploadSignature } from '../../routes/promotions.remote';
  import { thumbImage } from '$lib/utils/cloudinary';
  import { fade } from 'svelte/transition';
  import { Upload, X, GripVertical } from 'lucide-svelte';

  let {
    imageUrls = $bindable([]),
    maxImages = 10,
    disabled = false
  }: {
    imageUrls: string[];
    maxImages?: number;
    disabled?: boolean;
  } = $props();

  const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB — reasonable protection, no need for more

  let uploading = $state(false);
  let error = $state<string | null>(null);
  let dragIdx = $state<number | null>(null);

  const atLimit = $derived(imageUrls.length >= maxImages);
  const inputDisabled = $derived(disabled || uploading || atLimit);

  // ── Validation ─────────────────────────────────────────────────────────────
  function validateFiles(files: File[]): { valid: File[]; rejectedMsg: string | null } {
    const valid: File[] = [];
    let rejectedMsg: string | null = null;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        rejectedMsg = `"${file.name}" não é uma imagem válida.`;
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejectedMsg = `"${file.name}" excede o limite de 8MB.`;
        continue;
      }
      valid.push(file);
    }

    return { valid, rejectedMsg };
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
  async function uploadToCloudinary(file: File): Promise<string> {
    const { signature, timestamp, apiKey, cloudName } = await getUploadSignature({ folder: 'promotions' });
    const fd = new FormData();
    fd.append('file', file);
    fd.append('signature', signature);
    fd.append('timestamp', String(timestamp));
    fd.append('api_key', apiKey);
    fd.append('folder', 'promotions');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: fd
    });
    const json = await res.json();
    if (!json.secure_url) throw new Error('Upload failed');
    return json.secure_url as string;
  }

  async function handleFiles(fileList: FileList) {
    error = null;

    const files = Array.from(fileList);
    const { valid, rejectedMsg } = validateFiles(files);
    if (rejectedMsg) error = rejectedMsg;
    if (!valid.length) return;

    const availableSlots = maxImages - imageUrls.length;
    if (availableSlots <= 0) {
      error = `Máximo de ${maxImages} imagens permitido.`;
      return;
    }

    const toUpload = valid.slice(0, availableSlots);
    if (valid.length > availableSlots) {
      error = `Máximo de ${maxImages} imagens permitido.`;
    }

    uploading = true;
    try {
      const urls = await Promise.all(toUpload.map(uploadToCloudinary));
      imageUrls = [...imageUrls, ...urls];
    } catch {
      error = 'Upload de imagens falhou. Tente novamente.';
    } finally {
      uploading = false;
    }
  }

  function onInputChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    if (input.files?.length) handleFiles(input.files);
    input.value = ''; // allow re-selecting the same file later
  }

  function removeImage(index: number) {
    imageUrls = imageUrls.filter((_, i) => i !== index);
  }

  // ── Drag-to-reorder (native HTML5, zero dependencies) ──────────────────────
  function onDragStart(index: number) {
    dragIdx = index;
  }

  function onDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === index) return;
    const arr = [...imageUrls];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(index, 0, moved);
    imageUrls = arr;
    dragIdx = index;
  }

  function onDragEnd() {
    dragIdx = null;
  }
</script>

<div class="space-y-3">
  {#if error}
    <p
      class="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
      transition:fade={{ duration: 100 }}
    >
      {error}
    </p>
  {/if}

  {#if imageUrls.length > 0}
    <div class="grid grid-cols-3 gap-2">
      {#each imageUrls as url, i (url)}
        <div
          draggable={!disabled}
          role="button"
          tabindex="0"
          ondragstart={() => onDragStart(i)}
          ondragover={(e) => onDragOver(e, i)}
          ondragend={onDragEnd}
          class="relative rounded-xl overflow-hidden border bg-gray-900 group select-none transition-all
                 {disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
                 {dragIdx === i ? 'border-[#8B5E3C] opacity-60 scale-95' : 'border-gray-800'}"
          style="aspect-ratio: 4/3;"
        >
          <img
            src={thumbImage(url)}
            alt="Imagem {i + 1}"
            class="w-full h-full object-contain pointer-events-none"
            loading="lazy"
          />

          {#if i === 0}
            <span
              class="absolute top-1.5 left-1.5 bg-[#8B5E3C] text-white text-[9px] font-black px-1.5 py-0.5
                     rounded-full uppercase tracking-wide pointer-events-none"
            >
              Capa
            </span>
          {/if}

          {#if imageUrls.length > 1 && !disabled}
            <div class="absolute top-1.5 right-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <GripVertical size={13} class="text-white drop-shadow" />
            </div>
          {/if}

          <button
            type="button"
            onclick={() => removeImage(i)}
            disabled={disabled}
            class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 border border-gray-700
                   text-gray-300 hover:text-white hover:bg-red-900/80 hover:border-red-500
                   flex items-center justify-center transition-all
                   opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Remover imagem {i + 1}"
          >
            <X size={12} strokeWidth={3} />
          </button>
        </div>
      {/each}
    </div>
  {/if}

  {#if atLimit}
    <p class="text-[11px] text-gray-500 bg-gray-800/40 border border-gray-800 rounded-lg px-3 py-2 text-center">
      Máximo de {maxImages} imagens permitido.
    </p>
  {:else}
    <label class="block cursor-pointer">
      <div
        class="relative border-2 border-dashed border-gray-800 rounded-2xl p-6 text-center
               hover:border-gray-600 hover:bg-white/2 transition-all group
               {inputDisabled ? 'opacity-50 pointer-events-none' : ''}"
      >
        <input
          type="file"
          multiple
          accept="image/*"
          class="sr-only"
          disabled={inputDisabled}
          onchange={onInputChange}
        />
        {#if uploading}
          <div class="flex flex-col items-center gap-3">
            <svg class="animate-spin w-7 h-7 text-[#8B5E3C]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="32" stroke-dashoffset="12" />
            </svg>
            <p class="text-xs text-gray-400">A carregar imagens…</p>
          </div>
        {:else}
          <div class="flex flex-col items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-gray-800 group-hover:bg-gray-700 transition-colors flex items-center justify-center">
              <Upload size={18} class="text-gray-400" />
            </div>
            <div>
              <p class="text-sm text-gray-300 font-medium">Clique ou arraste imagens</p>
              <p class="text-xs text-gray-600 mt-0.5">PNG, JPG, WEBP — múltiplos ficheiros</p>
            </div>
          </div>
        {/if}
      </div>
    </label>
  {/if}
</div>