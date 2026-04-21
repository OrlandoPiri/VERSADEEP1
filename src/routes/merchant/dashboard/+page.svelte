<script lang="ts">
  import { fade } from 'svelte/transition';
  import { deletePromotion } from '../../promotions.remote';
  import { invalidateAll } from '$app/navigation';

  // Use 'any' to stop TypeScript from over-analyzing the Neon data
  let { data } = $props<{ data: any }>();
  
  const deleteAction = deletePromotion as any;
  let deletingId = $state<number | null>(null);

  // 1. Logic moved to script to avoid {@const} placement errors
  function getFirstImage(imageInput: any) {
    if (!imageInput) return null;
    if (Array.isArray(imageInput)) return imageInput[0];
    const split = String(imageInput).split(',').map(s => s.trim()).filter(Boolean);
    return split[0] || null;
  }

  function getPaymentList(paymentInput: any) {
    if (!paymentInput) return [];
    if (Array.isArray(paymentInput)) return paymentInput;
    return String(paymentInput).split(',').map(s => s.trim()).filter(Boolean);
  }

  async function handleDelete(id: number) {
    if (!confirm('Eliminar permanentemente?')) return;
    deletingId = id;
    try {
      await deleteAction({ id });
      await invalidateAll();
    } catch (err) {
      alert('Erro ao eliminar.');
    } finally {
      deletingId = null;
    }
  }
</script>

<div class="min-h-screen bg-[#0D0D0D] text-gray-200">
  <nav class="border-b border-gray-800 bg-[#0D0D0D] sticky top-0 z-30 h-20 flex items-center justify-between px-6">
    <div>
      <h1 class="text-xl font-bold text-white uppercase tracking-tighter">Dashboard</h1>
      <p class="text-[10px] text-gray-500 font-bold uppercase">{data.merchant?.businessName || 'Merchant'}</p>
    </div>
    <a href="/merchant/promotions/new" class="bg-[#1E293B] border border-gray-700 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
      + Nova Promoção
    </a>
  </nav>

  <main class="max-w-7xl mx-auto px-6 py-10">
    <div class="bg-[#1E293B] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
      <table class="w-full text-left">
        <thead>
          <tr class="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-black/20">
            <th class="px-6 py-4">Promoção</th>
            <th class="px-6 py-4 text-center">Pagamentos</th>
            <th class="px-6 py-4 text-center">Estado</th>
            <th class="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800/50">
          {#each data.promotions as promo (promo.id)}
            <tr class="hover:bg-white/5 transition-colors">
              <td class="px-6 py-5">
                <div class="flex items-center gap-4">
                  {#if getFirstImage(promo.imageUrls)}
                    <img src={getFirstImage(promo.imageUrls)} alt="" class="w-12 h-12 rounded-lg object-cover border border-gray-700" />
                  {:else}
                    <div class="w-12 h-12 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center text-xs">🖼️</div>
                  {/if}
                  <div>
                    <p class="font-bold text-white leading-tight">{promo.title}</p>
                    <p class="text-[10px] text-gray-500 mt-1 uppercase">Fim: {new Date(promo.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </td>

              <td class="px-6 py-5 text-center">
                <div class="flex flex-wrap justify-center gap-1">
                  {#each getPaymentList(promo.paymentMethods) as method}
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black border border-gray-700 text-gray-400">
                      {method}
                    </span>
                  {:else}
                    <span class="text-[10px] text-gray-600 italic">Nenhum</span>
                  {/each}
                </div>
              </td>

              <td class="px-6 py-5 text-center">
                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border 
                  {promo.status === 'active' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : 'text-red-400 border-red-500/30 bg-red-500/5'}">
                  {promo.status}
                </span>
              </td>

              <td class="px-6 py-5 text-right">
                <div class="flex items-center justify-end gap-4">
                  <a href="/merchants/promotions/{promo.id}/edit" class="text-[10px] font-bold uppercase text-gray-400 hover:text-white">Editar</a>
                  <button onclick={() => handleDelete(promo.id)} disabled={deletingId === promo.id} class="text-[10px] font-bold uppercase text-red-900 hover:text-red-500 disabled:opacity-30">
                    {deletingId === promo.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </main>
</div>