<script lang="ts">
  // src/lib/components/PromotionTable.svelte
  import { deletePromotion } from '../../routes/promotions.remote';
  import { thumbImage } from '$lib/utils/cloudinary';
  import type { AdminPromotion } from '../../routes/admin/promotions/+page.server';

  interface Props {
    promotions: AdminPromotion[];
    onFeedback: (message: string, type: 'success' | 'error') => void;
    /** Called after a successful delete so the parent can reload or step back a page. */
    onDeleted: () => void | Promise<void>;
  }

  let { promotions, onFeedback, onDeleted }: Props = $props();

  let confirmTarget = $state<AdminPromotion | null>(null);
  let pendingId = $state<number | null>(null);

  const STATUS_LABEL: Record<AdminPromotion['status'], string> = {
    active: 'Activa',
    expired: 'Expirada',
    banned: 'Banida'
  };

  const STATUS_CLASS: Record<AdminPromotion['status'], string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    expired: 'bg-gray-800 text-gray-400 border-gray-700',
    banned: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  async function confirmDelete() {
    const target = confirmTarget;
    if (!target) return;
    confirmTarget = null;
    pendingId = target.id;

    try {
      // Same command the merchant dashboard uses. The handler lets admins
      // delete any promotion and merchants only their own.
      await deletePromotion({ id: target.id });
      onFeedback('Promoção eliminada.', 'success');
      await onDeleted();
    } catch (err: any) {
      console.error(err);
      onFeedback(err?.body?.message ?? err?.message ?? 'Erro ao eliminar.', 'error');
    } finally {
      pendingId = null;
    }
  }
</script>

<!-- Confirmation dialog -->
{#if confirmTarget}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-title"
  >
    <div class="bg-[#1E293B] border border-gray-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
      <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Confirmar Acção</p>
      <h2 id="confirm-title" class="text-xl font-black text-white mb-2">Eliminar promoção?</h2>
      <p class="text-sm text-gray-400 mb-6">
        <span class="text-white font-bold">{confirmTarget.title}</span>
        será eliminada permanentemente, incluindo gostos e comentários. Esta acção não pode ser desfeita.
      </p>

      <div class="flex gap-3">
        <button
          type="button"
          onclick={() => (confirmTarget = null)}
          class="flex-1 py-3 rounded-2xl border border-gray-700 text-sm font-black text-gray-400 hover:border-gray-500 hover:text-white transition-all"
        >
          Cancelar
        </button>
        <button
          type="button"
          onclick={confirmDelete}
          class="flex-1 py-3 rounded-2xl text-sm font-black bg-red-500 hover:bg-red-400 text-white transition-all"
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Table -->
<div class="overflow-x-auto">
  <table class="min-w-full text-sm">
    <thead>
      <tr class="border-b border-gray-800 bg-[#0D0D0D]">
        <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Promoção</th>
        <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Negócio</th>
        <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Estado</th>
        <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Termina</th>
        <th class="px-6 py-4"></th>
      </tr>
    </thead>
    <tbody>
      {#each promotions as p (p.id)}
        {@const isPending = pendingId === p.id}
        <tr class="border-b border-gray-800/50 hover:bg-white/2 transition-colors {isPending ? 'opacity-40' : ''}">

          <!-- Image / title -->
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              {#if p.imageUrls?.[0]}
                <img src={thumbImage(p.imageUrls[0])} alt="" class="w-10 h-10 rounded-lg object-cover border border-gray-700 shrink-0" />
              {:else}
                <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-xs shrink-0">🖼️</div>
              {/if}
              <div class="min-w-0">
                <a href="/promotions/{p.id}" class="font-bold text-white hover:underline block truncate max-w-56">{p.title}</a>
                <p class="text-[10px] text-gray-600 font-mono mt-0.5">
                  #{p.id}{#if p.discountPercentage} · {p.discountPercentage}% off{/if}
                </p>
              </div>
            </div>
          </td>

          <!-- Business / owner -->
          <td class="px-6 py-4">
            <p class="text-gray-300 truncate max-w-48">{p.businessName ?? p.merchantName ?? '—'}</p>
            <p class="text-[10px] text-gray-600 mt-0.5 truncate max-w-48">
              {p.ownerName ?? '—'}{p.ownerEmail ? ` · ${p.ownerEmail}` : ''}
            </p>
          </td>

          <!-- Status -->
          <td class="px-6 py-4">
            <span class="border px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest {STATUS_CLASS[p.status]}">
              {STATUS_LABEL[p.status]}
            </span>
          </td>

          <!-- End date -->
          <td class="px-6 py-4 text-gray-600 text-xs">
            {new Date(p.endDate).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })}
          </td>

          <!-- Actions -->
          <td class="px-6 py-4">
            <div class="flex items-center justify-end gap-2">
              <a
                href="/promotions/{p.id}"
                class="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all"
              >
                Ver
              </a>
              <a
                href="/merchant/promotions/{p.id}/edit"
                class="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all"
              >
                Editar
              </a>
              <button
                type="button"
                onclick={() => (confirmTarget = p)}
                disabled={isPending}
                class="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {#if isPending}
                  <span class="animate-pulse">…</span>
                {:else}
                  Eliminar
                {/if}
              </button>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>