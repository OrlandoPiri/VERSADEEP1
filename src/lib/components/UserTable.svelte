<script lang="ts">
  // src/lib/components/UserTable.svelte
  import { enhance } from '$app/forms';
  import type { AdminUser } from '../../routes/admin/+page.server';

  interface Props {
    users: AdminUser[];
    onFeedback: (message: string, type: 'success' | 'error') => void;
  }

  let { users, onFeedback }: Props = $props();

  let confirmTarget = $state<AdminUser | null>(null);
  let localPendingId = $state<string | null>(null);

  function requestToggle(u: AdminUser) {
    confirmTarget = u;
  }

  function cancelConfirm() {
    confirmTarget = null;
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
      <h2 id="confirm-title" class="text-xl font-black text-white mb-2">
        {confirmTarget.banned ? 'Desbanir' : 'Banir'} utilizador?
      </h2>
      <p class="text-sm text-gray-400 mb-6">
        <span class="text-white font-bold">{confirmTarget.email ?? confirmTarget.phoneNumber}</span>
        {confirmTarget.banned
          ? ' recuperará o acesso à plataforma.'
          : ' ficará impedido de aceder à plataforma.'}
      </p>

      <form
        method="POST"
        action="?/toggleBan"
        use:enhance={() => {
          localPendingId = confirmTarget?.id ?? null;
          confirmTarget = null;
          return async ({ result, update }) => {
            localPendingId = null;
            if (result.type === 'success') {
              onFeedback(
                result.data?.banned ? 'Utilizador banido.' : 'Utilizador desbanido.',
                'success'
              );
            } else {
              onFeedback(
                (result.type === 'failure' && result.data?.error) || 'Ocorreu um erro.',
                'error'
              );
            }
            await update();
          };
        }}
        class="flex gap-3"
      >
        <input type="hidden" name="userId" value={confirmTarget.id} />
        <input type="hidden" name="ban"    value={String(!confirmTarget.banned)} />

        <button
          type="button"
          onclick={cancelConfirm}
          class="flex-1 py-3 rounded-2xl border border-gray-700 text-sm font-black text-gray-400 hover:border-gray-500 hover:text-white transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="flex-1 py-3 rounded-2xl text-sm font-black transition-all
            {confirmTarget.banned
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
              : 'bg-red-500 hover:bg-red-400 text-white'}"
        >
          {confirmTarget.banned ? 'Desbanir' : 'Banir'}
        </button>
      </form>
    </div>
  </div>
{/if}

<!-- Table -->
<div class="overflow-x-auto">
  <table class="min-w-full text-sm">
    <thead>
      <tr class="border-b border-gray-800 bg-[#0D0D0D]">
        <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Utilizador</th>
        <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Contacto</th>
        <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Função</th>
        <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Estado</th>
        <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Membro desde</th>
        <th class="px-6 py-4"></th>
      </tr>
    </thead>
    <tbody>
      {#each users as u (u.id)}
        {@const isPending = localPendingId === u.id}
        <tr class="border-b border-gray-800/50 hover:bg-white/2 transition-colors">

          <!-- Name / avatar -->
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-black text-gray-400 shrink-0">
                {(u.name ?? u.email ?? '?')[0].toUpperCase()}
              </div>
              <span class="font-bold text-white truncate max-w-35">
                {u.name ?? '—'}
              </span>
            </div>
          </td>

          <!-- Contact -->
          <td class="px-6 py-4 text-gray-400 font-mono text-xs">
            {u.email ?? u.phoneNumber ?? '—'}
          </td>

          <!-- Role badge -->
          <td class="px-6 py-4">
            {#if u.role === 'admin'}
              <span class="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Admin
              </span>
            {:else}
              <span class="bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                User
              </span>
            {/if}
          </td>

          <!-- Status badge -->
          <td class="px-6 py-4">
            {#if u.banned}
              <span class="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Banido
              </span>
            {:else}
              <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Activo
              </span>
            {/if}
          </td>

          <!-- Created at -->
          <td class="px-6 py-4 text-gray-600 text-xs">
            {new Date(u.createdAt).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })}
          </td>

          <!-- Action -->
          <td class="px-6 py-4 text-right">
            <button
              onclick={() => requestToggle(u)}
              disabled={isPending}
              class="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                {u.banned
                  ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                  : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}"
            >
              {#if isPending}
                <span class="animate-pulse">…</span>
              {:else}
                {u.banned ? 'Desbanir' : 'Banir'}
              {/if}
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>