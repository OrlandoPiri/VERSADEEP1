<script lang="ts">
  // src/routes/admin/+layout.svelte
  // Shared tab bar for the admin section. Wraps /admin (users) and
  // /admin/promotions without touching either page's own markup.
  import { page } from '$app/state';

  let { children } = $props();

  const tabs = [
    { href: '/admin', label: 'Utilizadores' },
    { href: '/admin/promotions', label: 'Promoções' }
  ];

  // '/admin' must match exactly, otherwise it would stay active on every sub-page.
  function isActive(href: string) {
    const path = page.url.pathname;
    return href === '/admin' ? path === '/admin' : path.startsWith(href);
  }
</script>

<div class="bg-[#0D0D0D] border-b border-gray-800 px-4">
  <nav class="max-w-6xl mx-auto flex items-center gap-6" aria-label="Administração">
    {#each tabs as tab}
      <a
        href={tab.href}
        aria-current={isActive(tab.href) ? 'page' : undefined}
        class="py-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors
               {isActive(tab.href)
                 ? 'text-white border-orange-500'
                 : 'text-gray-500 border-transparent hover:text-gray-300'}"
      >
        {tab.label}
      </a>
    {/each}
  </nav>
</div>

{@render children()}