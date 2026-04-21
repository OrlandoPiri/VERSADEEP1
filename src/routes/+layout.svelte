<script lang="ts">
  import '../styles/app.css';
  import { page } from '$app/state';
  import { getPromoStats } from './promotions.remote';
  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import {
    Megaphone, Home, Search, Plus, Heart, User,
    Menu, X, LayoutDashboard, LogOut, LogIn, UserPlus, Share2,
  } from 'lucide-svelte';

  // ── Props ──────────────────────────────────────────────────────────────────
  let { data, children } = $props();

  // ── Session ────────────────────────────────────────────────────────────────
  const user = $derived(page.data.user);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = getPromoStats();

  // ── Mobile menu state ──────────────────────────────────────────────────────
  let mobileMenuOpen = $state(false);

  function closeMenu() { mobileMenuOpen = false; }
  function toggleMenu() { mobileMenuOpen = !mobileMenuOpen; }

  // ── Active route ───────────────────────────────────────────────────────────
  const currentPath = $derived(page.url.pathname);
  function isActive(href: string) {
    return href === '/' ? currentPath === '/' : currentPath.startsWith(href);
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async function handleLogout() {
    closeMenu();
    await authClient.signOut();
    window.location.href = '/auth/login';
  }

  // ── Share ──────────────────────────────────────────────────────────────────
  async function handleShare() {
    const url  = window.location.href;
    const title = document.title;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  // ── Bottom nav items ───────────────────────────────────────────────────────
  const bottomNav = [
    { href: '/',                          label: 'Início',   Icon: Home    },
    { href: '/search',                    label: 'Pesquisa', Icon: Search  },
    { href: '/merchant/promotions/new',   label: 'Criar',    Icon: Plus    },
    { href: '/liked',                     label: 'Guardados',Icon: Heart   },
  ];
</script>

<div class="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">

  <!-- ── Promo ticker ──────────────────────────────────────────────────────── -->
  <div class="bg-orange-600 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-white">
    {#if stats.current}
      <span class="inline-flex items-center gap-2">
        <span class="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
        {stats.current.totalActive} Promoções ativas em Moçambique
      </span>
    {:else}
      <span>Explorar as melhores ofertas de Moçambique</span>
    {/if}
  </div>

  <!-- ── Header ────────────────────────────────────────────────────────────── -->
  <header class="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">

      <!-- Logo -->
      <a href="/" class="flex items-center gap-2 transition-transform active:scale-95 shrink-0">
        <div class="rounded-xl bg-orange-600 p-1.5 md:p-2 text-white shadow-lg shadow-orange-200">
          <Megaphone size={18} strokeWidth={2.5} class="md:hidden" />
          <Megaphone size={22} strokeWidth={2.5} class="hidden md:block" />
        </div>
        <span class="text-xl md:text-2xl font-black tracking-tighter text-gray-900">
          VERSA<span class="text-orange-600">DEEP</span>
        </span>
      </a>

      <!-- Desktop nav (hidden on mobile) -->
      <nav class="hidden md:flex items-center gap-10 text-[13px] font-bold uppercase tracking-wider text-gray-500">
        <a href="/"                        class="hover:text-orange-600 transition-colors {isActive('/') ? 'text-orange-600' : ''}">Promoções</a>
        <a href="/merchant/dashboard"      class="hover:text-orange-600 transition-colors {isActive('/merchant/dashboard') ? 'text-orange-600' : ''}">Lojas</a>
        <a href="/merchant/promotions/new" class="hover:text-orange-600 transition-colors">+Criar Promoção</a>
      </nav>

      <!-- Right side -->
      <div class="flex items-center gap-2 md:gap-4">

        <!-- Mobile: greeting (truncated) -->
        {#if user?.id}
          <span class="truncate max-w-[100px] text-xs text-gray-500 font-medium md:hidden">
            Olá, {user.name || user.phoneNumber || user.email}
          </span>
          <!-- Desktop: full greeting -->
          <span class="hidden md:block text-sm text-gray-700">
            Olá, {user.name || user.phoneNumber || user.email}
          </span>
        {/if}

        <!-- Desktop: auth actions -->
        <div class="hidden md:flex items-center gap-3">
          {#if user?.id}
            {#if user.role === 'admin'}
              <a href="/admin" class="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-600 transition-all shadow-md">
                <LayoutDashboard size={14} /> Painel
              </a>
            {/if}
            <button onclick={handleLogout}
              class="flex items-center gap-2 p-2 font-bold text-gray-400 hover:text-red-600 transition-colors text-sm">
              <LogOut size={16} /> Sair
            </button>
          {:else}
            <a href="/auth/login"  class="px-4 py-2 text-sm font-bold text-gray-600 hover:text-orange-600">Entrar</a>
            <a href="/auth/signup" class="rounded-full bg-orange-100 px-6 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-600 hover:text-white transition-all">Registar</a>
          {/if}
        </div>

        <!-- Mobile: logout (shown when logged in, before hamburger) -->
        {#if user?.id}
          <button
            type="button"
            onclick={handleLogout}
            aria-label="Sair"
            class="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
          </button>
        {/if}

        <!-- Mobile: hamburger -->
        <button
          type="button"
          onclick={toggleMenu}
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
          class="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          {#if mobileMenuOpen}
            <X size={18} />
          {:else}
            <Menu size={18} />
          {/if}
        </button>

      </div>
    </div>
  </header>

  <!-- ── Hamburger menu (mobile only) ──────────────────────────────────────── -->
  {#if mobileMenuOpen}
    <!-- Backdrop -->
    <button
      type="button"
      class="fixed inset-0 z-40 bg-black/40 md:hidden"
      onclick={closeMenu}
      aria-label="Fechar menu"
    ></button>

    <!-- Drawer -->
    <div class="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col md:hidden">

      <!-- Drawer header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <span class="font-black text-lg tracking-tighter">VERSA<span class="text-orange-600">DEEP</span></span>
        <button type="button" onclick={closeMenu} aria-label="Fechar" class="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
          <X size={18} />
        </button>
      </div>

      <!-- Nav links -->
      <nav class="flex flex-col px-4 py-4 gap-1 border-b border-gray-100">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 mb-1">Navegar</p>
        {#each [
          { href: '/',                          label: 'Promoções',       Icon: Home     },
          { href: '/merchant/dashboard',        label: 'Lojas',           Icon: Megaphone },
          { href: '/merchant/promotions/new',   label: 'Criar Promoção',  Icon: Plus     },
          { href: '/search',                    label: 'Pesquisar',       Icon: Search   },
        ] as item}
          <a href={item.href} onclick={closeMenu}
            class="flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-colors
                   {isActive(item.href) ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-gray-50'}">
            <item.Icon size={18} class="shrink-0" />
            {item.label}
          </a>
        {/each}
      </nav>

      <!-- User actions -->
      <div class="flex flex-col px-4 py-4 gap-1 flex-1">
        <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 mb-1">Conta</p>

        {#if user?.id}
          <!-- Admin (role-gated) -->
          {#if user.role === 'admin'}
            <a href="/admin" onclick={closeMenu}
              class="flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <LayoutDashboard size={18} class="shrink-0" /> Admin Dashboard
            </a>
          {/if}

          <!-- Placeholders -->
          <a href="/liked" onclick={closeMenu}
            class="flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Heart size={18} class="shrink-0" /> Guardados
          </a>
          <a href="/account" onclick={closeMenu}
            class="flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <User size={18} class="shrink-0" /> Editar Conta
          </a>

          <!-- Logout -->
          <button type="button" onclick={handleLogout}
            class="flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-colors mt-auto">
            <LogOut size={18} class="shrink-0" /> Sair
          </button>

        {:else}
          <a href="/auth/login" onclick={closeMenu}
            class="flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <LogIn size={18} class="shrink-0" /> Entrar
          </a>
          <a href="/auth/signup" onclick={closeMenu}
            class="flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm bg-orange-600 text-white hover:bg-orange-700 transition-colors mt-2">
            <UserPlus size={18} class="shrink-0" /> Registar
          </a>
        {/if}
      </div>

      <!-- User info at bottom of drawer -->
      {#if user?.id}
        <div class="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <p class="text-xs text-gray-500 truncate">{user.name || user.phoneNumber || user.email}</p>
          <p class="text-[10px] text-gray-400 capitalize mt-0.5">{user.role}</p>
        </div>
      {/if}

    </div>
  {/if}

  <!-- ── Main content ───────────────────────────────────────────────────────── -->
  <!--
    pb-20 on mobile: prevents content from hiding behind the fixed bottom nav.
    md:pb-0: desktop has no bottom nav so no padding needed.
  -->
  <main class="grow pb-20 md:pb-0">
    {@render children()}
  </main>

  <!-- ── Bottom navigation (mobile only) ───────────────────────────────────── -->
  <!--
    Fixed to bottom, hidden on md+.
    pb-safe handles iOS home indicator (env(safe-area-inset-bottom)).
    4 items: Home, Search, Create, Saved.
    5th item (Profile/Menu) opens the hamburger drawer instead of navigating.
  -->
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100
           flex items-center justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]
           md:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
    aria-label="Navegação principal"
  >
    {#each bottomNav as item}
      <a
        href={item.href}
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-0
               {isActive(item.href) ? 'text-orange-600' : 'text-gray-400 hover:text-gray-700'}"
        aria-label={item.label}
        aria-current={isActive(item.href) ? 'page' : undefined}
      >
        <!-- Highlight pill behind active icon -->
        <div class="relative flex items-center justify-center">
          {#if isActive(item.href)}
            <span class="absolute inset-0 -m-1.5 rounded-xl bg-orange-50"></span>
          {/if}
          <item.Icon size={22} strokeWidth={isActive(item.href) ? 2.5 : 1.8} class="relative" />
        </div>
        <span class="text-[10px] font-bold">{item.label}</span>
      </a>
    {/each}

    <!-- Share button -->
    <button
      type="button"
      onclick={handleShare}
      aria-label="Partilhar"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors text-gray-400 hover:text-gray-700"
    >
      <div class="flex items-center justify-center">
        <Share2 size={22} strokeWidth={1.8} />
      </div>
      <span class="text-[10px] font-bold">Partilhar</span>
    </button>

    <!-- Profile / Menu button (opens hamburger) -->
    <button
      type="button"
      onclick={toggleMenu}
      aria-label="Menu"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors
             {mobileMenuOpen ? 'text-orange-600' : 'text-gray-400 hover:text-gray-700'}"
    >
      <div class="relative flex items-center justify-center">
        {#if mobileMenuOpen}
          <span class="absolute inset-0 -m-1.5 rounded-xl bg-orange-50"></span>
        {/if}
        <!-- Show avatar initial if logged in, user icon otherwise -->
        {#if user?.id}
          <div class="relative w-[22px] h-[22px] rounded-full bg-orange-600 flex items-center justify-center">
            <span class="text-[10px] font-black text-white leading-none">
              {(user.name || user.email || '?').charAt(0).toUpperCase()}
            </span>
          </div>
        {:else}
          <User size={22} strokeWidth={1.8} class="relative" />
        {/if}
      </div>
      <span class="text-[10px] font-bold">Menu</span>
    </button>

  </nav>

  <!-- ── Footer (desktop only) ─────────────────────────────────────────────── -->
  <footer class="hidden md:block border-t border-gray-100 bg-white py-12">
    <div class="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="flex flex-col items-center md:items-start gap-2">
        <span class="text-lg font-black tracking-tighter">VERSA<span class="text-orange-600">DEEP</span></span>
        <p class="text-xs text-gray-400 font-medium">© 2026 Feito com ❤️ em Moçambique.</p>
      </div>
      <div class="flex gap-8 text-[11px] font-bold uppercase tracking-widest text-gray-400">
        <a href="/pages/about" class="hover:text-orange-600">Sobre Nós</a>
        <a href="/pages/terms"   class="hover:text-orange-600">Termos</a>
        <a href="/pages/privacy" class="hover:text-orange-600">Privacidade</a>
        <a href="/pages/contact" class="hover:text-orange-600">Suporte</a>
      </div>
    </div>
  </footer>

</div>

<style>
  :global(body) {
    -webkit-font-smoothing: antialiased;
    scroll-behavior: smooth;
  }
</style>


<!-- 15APRIL26EFN<script lang="ts">
  import '../styles/app.css';
  import { page } from '$app/state';
  import { logout } from './auth.remote';
  import { getPromoStats } from './promotions.remote';
  import { Megaphone, User, LogIn, LogOut, LayoutDashboard, ShoppingBag } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
    import { authClient } from '$lib/auth-client';


  // Svelte 5 Props
  let { data, children } = $props();

  // 1. Reactive Session State
  const user=$derived(page.data.user)
  
  // 2. Async Stats Resource
  const stats = getPromoStats();

  // 3. Handlers
  async function handleLogout() {
    await authClient.signOut();
    // This clears the SvelteKit data cache and 
    // forces the server to re-run +layout.server.ts
    window.location.href = '/auth/login';
    // goto(resolve("/auth/login"))
  }
</script>

<div class="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
  
  <div class="bg-orange-600 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-white shadow-inner">
    {#if stats.current}
      <span class="inline-flex items-center gap-2">
        <span class="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
        {stats.current.totalActive} Promoções ativas em Moçambique agora
      </span>
    {:else}
      <span>Explorar as melhores ofertas de Moçambique</span>
    {/if}
  </div>

  <header class="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      
      <a href="/" class="flex items-center gap-2.5 transition-transform active:scale-95">
        <div class="rounded-xl bg-orange-600 p-2 text-white shadow-lg shadow-orange-200">
          <Megaphone size={22} strokeWidth={2.5} />
        </div>
        <span class="text-2xl font-black tracking-tighter text-gray-900">
          VERSA<span class="text-orange-600">DEEP</span>
        </span>
      </a>

      <nav class="hidden md:flex items-center gap-10 text-[13px] font-bold uppercase tracking-wider text-gray-500">
        <a href="/" class="hover:text-orange-600 transition-colors">Promoções</a>
        <a href="/merchant/dashboard" class="hover:text-orange-600 transition-colors">Lojas</a>
        <a href="/merchant/promotions/new" class="hover:text-orange-600 transition-colors">+Criar Promoção</a>
      </nav>

      <div class="flex items-center gap-4">
        {#if user?.id}
        <p class="text-sm text-gray-700">Olá, {user.name ||user.phoneNumber||user.email}</p>
                  <button 
              onclick={handleLogout}
              class="flex items-center gap-2 group p-2 font-bold text-gray-400 hover:text-red-600 transition-colors"
            ><span>Sair</span>
            </button>
          <div class="hidden md:flex items-center gap-3">
            <a href="/admin" class="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-600 transition-all shadow-md">
              <LayoutDashboard size={14} />
              <span>Painel</span>
            </a>
  
    
          </div>
        {:else}
          <div class="flex items-center gap-2">
            <a href="/auth/login" class="px-4 py-2 text-sm font-bold text-gray-600 hover:text-orange-600">Entrar</a>
            <a href="/auth/signup" class="rounded-full bg-orange-100 px-6 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-600 hover:text-white transition-all">
              Registar
            </a>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <main class="grow">
    {@render children()}
  </main>

  <footer class="border-t border-gray-100 bg-white py-12">
    <div class="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="flex flex-col items-center md:items-start gap-2">
         <span class="text-lg font-black tracking-tighter">VERSA<span class="text-orange-600">DEEP</span></span>
         <p class="text-xs text-gray-400 font-medium">© 2026 Feito com ❤️ em Moçambique.</p>
      </div>
      <div class="flex gap-8 text-[11px] font-bold uppercase tracking-widest text-gray-400">
        <a href="/pages/about" class="hover:text-orange-600">Sobre Nós</a>
        <a href="/pages/terms" class="hover:text-orange-600">Termos</a>
        <a href="/pages/privacy" class="hover:text-orange-600">Privacidade</a>
        <a href="/pages/contact" class="hover:text-orange-600">Suporte</a>
      </div>
    </div>
  </footer>
</div>

<style>
  /* Ensuring smooth transitions across the whole layout */
  :global(body) {
    -webkit-font-smoothing: antialiased;
    scroll-behavior: smooth;
  }
</style> -->


<!-- <script lang="ts">
  import '../styles/app.css';
  import { page } from '$app/state';
  import { logout } from './auth.remote';
  import { getPromoStats } from './promotions.remote';
  import { Megaphone, User, LogIn, LogOut, LayoutDashboard, MapPin } from 'lucide-svelte';

  // Svelte 5 props
  let { children, data } = $props();

  // Initialize the Remote Resource for stats
  const stats = getPromoStats();

  // Reactive user state from page data
  const user = $derived(page.data.user);

  async function handleLogout() {
    await logout();
    window.location.href = '/auth/login';
  }
</script>

<div class="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
  <div class="bg-orange-600 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
    {#if stats.ready && stats.current}
      <span class="animate-pulse mr-2">●</span>
      {stats.current.totalActive} Promoções ativas em Moçambique
    {:else if stats.error}
      Descubra as Melhores Ofertas em Moçambique
    {:else}
      Sincronizando ofertas...
    {/if}
  </div>

  <header class="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <a href="/" class="flex items-center gap-2 group">
        <div class="rounded-xl bg-orange-600 p-2 text-white transition-transform group-hover:scale-110">
          <Megaphone size={20} />
        </div>
        <span class="text-2xl font-black tracking-tighter text-gray-900">
          VERSA<span class="text-orange-600">DEEP</span>
        </span>
      </a>

      <nav class="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500">
        <a href="/promotions" class="hover:text-orange-600 transition-colors">Explorar</a>
        <a href="/merchants" class="hover:text-orange-600 transition-colors">Parceiros</a>
        <a href="/pages/about" class="hover:text-orange-600 transition-colors">Sobre Nós</a>
      </nav>

      <div class="flex items-center gap-3">
        {#if user}
          <div class="flex items-center gap-2">
            <a href="/dashboard" class="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all border border-transparent hover:border-orange-100">
              <LayoutDashboard size={16} />
              <span class="hidden sm:inline">Painel</span>
            </a>
            <button 
              onclick={handleLogout}
              class="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        {:else}
          <div class="flex items-center gap-2">
            <a href="/auth/login" class="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-orange-600 px-3 py-2">
              Entrar
            </a>
            <a href="/auth/signup" class="btn-primary text-sm px-5 py-2 rounded-xl shadow-lg shadow-orange-100">
              Registar
            </a>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <main class="flex-grow">
    {@render children()}
  </main>

  <footer class="mt-auto border-t border-gray-100 bg-white py-16">
    <div class="mx-auto max-w-7xl px-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div class="col-span-1 md:col-span-2">
          <span class="text-xl font-black tracking-tighter text-gray-900">
            VERSA<span class="text-orange-600">DEEP</span>
          </span>
          <p class="mt-4 text-gray-500 text-sm leading-relaxed max-w-sm">
            A maior plataforma de promoções e ofertas em tempo real de Moçambique. 
            Conectamos consumidores às melhores oportunidades de poupança.
          </p>
        </div>
        
        <div>
          <h4 class="font-bold text-gray-900 mb-4 text-sm uppercase tracking-widest">Plataforma</h4>
          <ul class="space-y-2 text-sm text-gray-500">
            <li><a href="/promotions" class="hover:text-orange-600">Ver Ofertas</a></li>
            <li><a href="/signup" class="hover:text-orange-600">Criar Conta</a></li>
            <li><a href="/merchants/register" class="hover:text-orange-600">Ser Parceiro</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-gray-900 mb-4 text-sm uppercase tracking-widest">Contacto</h4>
          <ul class="space-y-2 text-sm text-gray-500">
            <li class="flex items-center gap-2"><MapPin size={14} /> Maputo, MZ</li>
            <li>suporte@versadeep.co.mz</li>
          </ul>
        </div>
      </div>
      
      <div class="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-xs text-gray-400 font-medium">
          © {new Date().getFullYear()} VERSADEEP. Todos os direitos reservados.
        </p>
        <div class="flex gap-6 text-xs font-bold text-gray-400 uppercase tracking-tighter">
          <a href="/terms" class="hover:text-gray-600">Termos</a>
          <a href="/privacy" class="hover:text-gray-600">Privacidade</a>
        </div>
      </div>
    </div>
  </footer>
</div>

<style>
  /* Use your root CSS variables for consistency */
  :global(.btn-primary) {
    background-color: var(--primary, #ea580c);
    color: white;
    font-weight: 700;
    transition: all 0.2s;
  }
  :global(.btn-primary:hover) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
</style> -->


 <!-- <script lang="ts">
  import { page } from '$app/state';
  import '../styles/app.css';
   // Destructure children from props (Svelte 5 way)
    let { children } = $props();
    // Use $derived for reactive values based on the page state
    // This replaces the old '$' store subscriptions
    const user = $derived(page.data.user);
    const path = $derived(page.url.pathname);
</script>

<nav class="glass-card fixed top-0 left-0 right-0 z-50 px-6 py-3 flex justify-between items-center" style="border-radius: 0;">
  <a href="/" class="text-2xl font-bold" style="color: var(--primary)">Versa</a>

  <div class="flex items-center space-x-4">
    {#if user}
      <span class="text-sm text-gray-700">Welcome, {user.name}||{user.phoneNumber}</span>
      <a href="/logout" class="btn-primary">Sair</a>
    {:else}
      <a href="/login" class="btn-primary">Entrar</a>
      <a href="/signup" class="btn-secondary" style="color: var(--secondary);">Registar</a>
    {/if}
  </div>
</nav>

<main class="pt-20 px-4 max-w-7xl mx-auto">
  {@render children()}
</main>   -->






