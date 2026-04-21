<script lang="ts">
  // src/routes/admin/+page.svelte
  import { goto } from '$app/navigation';
  import UserTable from '$lib/components/UserTable.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let query      = $state(data.query);
  let roleFilter = $state(data.roleFilter);

  // Toast
  let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);
  let toastTimer: ReturnType<typeof setTimeout>;

  function showFeedback(message: string, type: 'success' | 'error') {
    clearTimeout(toastTimer);
    toast = { message, type };
    toastTimer = setTimeout(() => (toast = null), 3500);
  }

  // Debounced search → URL update → server reload
  let debounceTimer: ReturnType<typeof setTimeout>;
  function onSearchInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyFilters(1), 350);
  }

  function applyFilters(targetPage = 1) {
    const params = new URLSearchParams();
    if (query)               params.set('q',    query);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (targetPage > 1)      params.set('page', String(targetPage));
    goto(`?${params.toString()}`, { keepFocus: true });
  }

  const totalBanned = $derived(data.users.filter(u => u.banned).length);
  const totalAdmins = $derived(data.users.filter(u => u.role === 'admin').length);
</script>

<svelte:head>
  <title>Admin — Versa</title>
</svelte:head>

<!-- Toast -->
{#if toast}
  <div
    role="status"
    aria-live="polite"
    class="fixed top-6 right-6 z-100 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold
      {toast.type === 'success'
        ? 'bg-[#0D0D0D] border-emerald-500/30 text-emerald-400'
        : 'bg-[#0D0D0D] border-red-500/30 text-red-400'}"
  >
    <span>{toast.type === 'success' ? '✓' : '✕'}</span>
    {toast.message}
  </div>
{/if}

<div class="min-h-screen bg-[#0D0D0D] py-12 px-4">
  <div class="max-w-6xl mx-auto space-y-8">

    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Versa</p>
        <h1 class="text-4xl font-black text-white tracking-tighter">Admin Dashboard</h1>
      </div>

      <!-- Stats -->
      <div class="flex gap-3">
        <div class="bg-[#1E293B] border border-gray-800 rounded-2xl px-5 py-3 text-right">
          <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Total</p>
          <p class="text-2xl font-black text-white">{data.total}</p>
        </div>
        <div class="bg-[#1E293B] border border-gray-800 rounded-2xl px-5 py-3 text-right">
          <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Banidos</p>
          <p class="text-2xl font-black text-red-400">{totalBanned}</p>
        </div>
        <div class="bg-[#1E293B] border border-gray-800 rounded-2xl px-5 py-3 text-right">
          <p class="text-[10px] font-black uppercase tracking-widest text-gray-500">Admins</p>
          <p class="text-2xl font-black text-orange-400">{totalAdmins}</p>
        </div>
      </div>
    </header>

    <!-- Filters -->
    <div class="bg-[#1E293B] border border-gray-800 rounded-3xl p-5 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">⌕</span>
        <input
          type="search"
          bind:value={query}
          oninput={onSearchInput}
          placeholder="Pesquisar por email, telefone ou nome…"
          class="w-full bg-[#0D0D0D] border border-gray-800 rounded-2xl pl-9 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
      </div>

      <div class="flex gap-2 flex-wrap">
        {#each [['all', 'Todos'], ['user', 'Users'], ['admin', 'Admins'], ['banned', 'Banidos']] as [val, label]}
          <button
            onclick={() => { roleFilter = val; applyFilters(1); }}
            class="px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border
              {roleFilter === val
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-[#0D0D0D] text-gray-500 border-gray-800 hover:border-gray-600 hover:text-gray-300'}"
          >
            {label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Table card -->
    <div class="bg-[#1E293B] border border-gray-800 rounded-3xl overflow-hidden">
      {#if data.users.length === 0}
        <div class="flex flex-col items-center justify-center py-24 text-center px-4">
          <p class="text-5xl mb-4">🔍</p>
          <p class="text-white font-black text-lg mb-1">Nenhum utilizador encontrado</p>
          <p class="text-gray-500 text-sm">Tente ajustar os filtros ou a pesquisa.</p>
        </div>
      {:else}
        <UserTable users={data.users} onFeedback={showFeedback} />
      {/if}
    </div>

    <!-- Pagination -->
    {#if data.totalPages > 1}
      <nav class="flex items-center justify-between" aria-label="Paginação">
        <p class="text-xs text-gray-600 font-bold">
          Página <span class="text-white">{data.page}</span> de
          <span class="text-white">{data.totalPages}</span>
          &nbsp;·&nbsp;{data.total} utilizadores
        </p>

        <div class="flex gap-2 items-center">
          <button
            onclick={() => applyFilters(data.page - 1)}
            disabled={data.page <= 1}
            class="px-4 py-2.5 rounded-xl border border-gray-800 text-xs font-black text-gray-400
              hover:text-white hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Anterior
          </button>

          {#each Array.from({ length: data.totalPages }, (_, i) => i + 1) as p}
            {#if p === 1 || p === data.totalPages || Math.abs(p - data.page) <= 1}
              <button
                onclick={() => applyFilters(p)}
                class="w-9 h-9 rounded-xl text-xs font-black transition-all border
                  {p === data.page
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'}"
              >
                {p}
              </button>
            {:else if Math.abs(p - data.page) === 2}
              <span class="w-9 h-9 flex items-center justify-center text-gray-700 text-xs">…</span>
            {/if}
          {/each}

          <button
            onclick={() => applyFilters(data.page + 1)}
            disabled={data.page >= data.totalPages}
            class="px-4 py-2.5 rounded-xl border border-gray-800 text-xs font-black text-gray-400
              hover:text-white hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Próxima →
          </button>
        </div>
      </nav>
    {/if}

  </div>
</div>