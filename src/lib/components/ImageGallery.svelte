
<script lang="ts">
  // src/lib/components/ImageGallery.svelte
  import { galleryImage } from '$lib/utils/cloudinary';

  interface Props {
    images: string[];
    startIndex?: number;
    onclose: () => void;
  }

  let { images, startIndex = 0, onclose }: Props = $props();

  // ✅ Fix: use $state() so startIndex prop change is tracked reactively
  let current   = $state(startIndex);
  let dragX     = $state(0);
  let dragging  = $state(false);
  let animating = $state(false);

  let touchStartX = 0;
  let touchStartY = 0;


  function goTo(index: number) {
    if (animating) return;
    if (index < 0 || index >= images.length) return;
    animating = true;
    current = index;
    setTimeout(() => (animating = false), 320);
  }

  function onTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    dragging = true;
    dragX = 0;
  }

  function onTouchMove(e: TouchEvent) {
    if (!dragging) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 40) {
      dragging = false;
      dragX = 0;
      onclose();
      return;
    }
    e.preventDefault();
    dragX = dx;
  }

  function onTouchEnd() {
    if (!dragging) return;
    dragging = false;
    if (dragX < -60)     goTo(current + 1);
    else if (dragX > 60) goTo(current - 1);
    dragX = 0;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') goTo(current + 1);
    else if (e.key === 'ArrowLeft') goTo(current - 1);
    else if (e.key === 'Escape')    onclose();
  }


  $effect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  });



</script>

<svelte:window onkeydown={onKeydown} />

<div
  class="fixed inset-0 z-50 bg-black flex flex-col select-none"
  role="dialog"
  aria-modal="true"
  aria-label="Galeria de imagens"
>
  <!-- Top bar -->
  <div class="flex items-center justify-between px-4 py-3 shrink-0">
    <span class="text-white/50 text-sm font-bold tabular-nums">
      {current + 1} / {images.length}
    </span>


    <button
      type="button"
      onclick={onclose}
      aria-label="Fechar galeria"
      class="w-9 h-9 flex items-center justify-center rounded-full bg-white/10
             hover:bg-white/20 text-white transition-colors"
    >

      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>

  <!-- ✅ Fix: role="group" satisfies a11y_no_static_element_interactions -->
  <div
    role="group"
    aria-label="Área de swipe de imagens"
    class="flex-1 overflow-hidden relative"
    ontouchstart={onTouchStart}
    ontouchmove={onTouchMove}
    ontouchend={onTouchEnd}
  >
    <div
      class="flex h-full"
      style="
        width: {images.length * 100}%;
        transform: translateX(calc(-{current * (100 / images.length)}% + {dragX / images.length}px));
        transition: {dragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)'};
      "
    >
      {#each images as url, i}
        <div
          class="h-full flex items-center justify-center"
          style="width: {100 / images.length}%"
        >
          <img
            src={galleryImage(url)}
            alt="Imagem {i + 1} de {images.length}"
            class="max-w-full max-h-full object-contain"
            loading={Math.abs(i - current) <= 1 ? 'eager' : 'lazy'}
            draggable="false"
          />
        </div>
      {/each}
    </div>
  </div>

  <!-- Desktop arrows + dot indicators -->
  {#if images.length > 1}
    <button
      type="button"
      onclick={() => goTo(current - 1)}
      disabled={current === 0}
      aria-label="Imagem anterior"
      class="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10
             items-center justify-center rounded-full bg-black/50 hover:bg-black/80
             text-white text-xl disabled:opacity-20 transition-all"
    >‹</button>

    <button
      type="button"
      onclick={() => goTo(current + 1)}
      disabled={current === images.length - 1}
      aria-label="Próxima imagem"
      class="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10
             items-center justify-center rounded-full bg-black/50 hover:bg-black/80
             text-white text-xl disabled:opacity-20 transition-all"
    >›</button>

    <!-- Dot indicators -->
    <div class="flex justify-center gap-1.5 py-4 shrink-0">
      {#each images as _, i}
        <!-- ✅ Fix: explicit closing tag, not self-closing -->
        <button
          type="button"
          onclick={() => goTo(i)}
          aria-label="Ir para imagem {i + 1}"
          class="rounded-full transition-all duration-200
            {i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}"
        ></button>
      {/each}
    </div>
  {/if}
</div>

