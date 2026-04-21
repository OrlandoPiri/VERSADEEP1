<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { Mail, Lock, Phone, LogIn } from 'lucide-svelte';
  import { resolve } from '$app/paths';

  // --- Svelte 5 Runes ---
  let method = $state<'email' | 'phone'>('email');
  let identifier = $state(''); // Acts as both email OR phone
  let password = $state('');
  let loading = $state(false);
  let errorMessage = $state('');

  async function handleLogin() {
    loading = true;
    errorMessage = '';

    // Clean any spaces the user typed in
    const cleanId = identifier.replace(/\s+/g, '');
    
    // If they selected phone, reconstruct the "Ghost Email" we used in signup
    const authEmail = method === 'email' ? cleanId : `${cleanId}@phone.local`;

    try {
      // Use the standard signIn.email method for both!
      const { data, error } = await authClient.signIn.email({
        email: authEmail,
        password: password
      });

      if (error) {
        errorMessage = "Credenciais inválidas.";
        loading = false;
        return;
      }

      // Success! Redirect to home page
      window.location.href = "/";

    } catch (err) {
      errorMessage = "Falha na ligação ao servidor.";
      loading = false;
    }
  }
</script>

<div class="mx-auto max-w-md px-6 py-24">
  <div class="text-center">
    <h1 class="text-3xl font-black tracking-tight text-gray-900">Bem-vindo de volta</h1>
    <p class="mt-2 text-sm font-medium text-gray-500">Entre para gerir as suas promoções.</p>
  </div>

  <div class="mt-10 flex border-b border-gray-100 text-[11px] font-black uppercase tracking-[0.2em]">
    <button onclick={() => method = 'email'} class="px-6 pb-3 transition-all {method === 'email' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-400'}">Email</button>
    <button onclick={() => method = 'phone'} class="px-6 pb-3 transition-all {method === 'phone' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-400'}">Telemóvel</button>
  </div>

  <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="mt-8 space-y-5">
    <div class="space-y-1">
      <label for="identifier" class="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">{method === 'email' ? 'Email' : 'Número de Telemóvel'}</label>
      <div class="relative">
        {#if method === 'email'}
          <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        {:else}
          <Phone class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        {/if}
        <input id="identifier" bind:value={identifier} type={method === 'email' ? 'email' : 'tel'} required class="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-orange-200" />
      </div>
    </div>
 
    <div class="space-y-1">
      <div class="flex items-center justify-between px-1">
        <label for="password" class="text-[10px] font-black uppercase tracking-widest text-gray-400">Senha</label>
        <a href={"/reset"} class="text-[10px] font-bold text-orange-600 hover:underline">Esqueceu?</a>
      </div>
      <div class="relative">
        <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input id="password" bind:value={password} type="password" required class="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-orange-200" />
      </div>
    </div>

    {#if errorMessage}
      <p class="text-center text-xs font-bold text-red-500">{errorMessage}</p>
    {/if}

    <button type="submit" disabled={loading} class="group flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 text-sm font-bold text-white transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50">
      {loading ? 'A autenticar...' : 'Entrar '}
      <LogIn size={18} class="transition-transform group-hover:translate-x-1" />
    </button>
  </form>

  <p class="mt-8 text-center text-sm font-medium text-gray-500">
    Não tem conta? <a href={resolve("/auth/signup")} class="font-bold text-orange-600 hover:underline">Registe-se aqui</a>
  </p>
</div>


<!-- <script lang="ts">
  import { Mail, Lock, Phone, LogIn } from 'lucide-svelte';
  import { resolve } from '$app/paths';

  // Svelte 5 Runes
  let method = $state<'email' | 'phone'>('email');
  let identifier = $state(''); // This acts as both email OR phone
  let password = $state('');
  let loading = $state(false);
  let errorMessage = $state('');

  async function handleLogin() {
    loading = true;
    errorMessage = '';

    // Logic Fix: Map 'identifier' to the key the proxy expects
    const payload = method === 'email' 
        ? { action: 'loginEmail', data: { e: identifier, p: password } }
        : { action: 'loginPhone', data: { ph: identifier, p: password } };

    try {
        const response = await fetch('/api/auth-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        // If Better Auth returns a user/session object, result is usually that object.
        // If it fails, it usually returns an error object.
        if (result?.error) {
            errorMessage = result.error.message;
            loading = false;
        } else if (response.ok) {
            // Success! Hard redirect to refresh the session state in the browser
            window.location.href = "/";
        } else {
            errorMessage = "Credenciais inválidas.";
            loading = false;
        }
    } catch (err) {
        errorMessage = "Falha na ligação ao servidor.";
        loading = false;
    }
  }
</script>
<div class="mx-auto max-w-md px-6 py-24">
  <div class="text-center">

    <h1 class="text-3xl font-black tracking-tight text-gray-900">Bem-vindo de volta</h1>
    <p class="mt-2 text-sm text-gray-500 font-medium">Entre para gerir as suas promoções.</p>
  </div>

  <div class="mt-10 flex border-b border-gray-100 text-[11px] font-black uppercase tracking-[0.2em]">
    <button onclick={() => method = 'email'} class="pb-3 px-6 transition-all {method === 'email' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-400'}">Email</button>
    <button onclick={() => method = 'phone'} class="pb-3 px-6 transition-all {method === 'phone' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-400'}">Telemóvel</button>
  </div>

  <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="mt-8 space-y-5">
    <div class="space-y-1">
      <label for="identifier" class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{method === 'email' ? 'Email' : 'Número de Telemóvel'}</label>
      <div class="relative">
        {#if method === 'email'}
          <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        {:else}
          <Phone class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        {/if}
        <input id="identifier" bind:value={identifier} type={method === 'email' ? 'email' : 'tel'} required class="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
      </div>
    </div>
 
    <div class="space-y-1">
      <div class="flex justify-between items-center px-1">
        <label for="password" class="text-[10px] font-black uppercase tracking-widest text-gray-400">Senha</label>
        <a href={"/reset"} class="text-[10px] font-bold text-orange-600 hover:underline">Esqueceu?</a>
      </div>
      <div class="relative">
        <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input id="password" bind:value={password} type="password" required class="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
      </div>
    </div>

    {#if errorMessage}
      <p class="text-center text-xs font-bold text-red-500">{errorMessage}</p>
    {/if}

    <button 
      type="submit" 
      disabled={loading}
      class="group flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 text-sm font-bold text-white transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50"
    >
      {loading ? 'A autenticar...' : 'Entrar '}
            <LogIn size={18} class="group-hover:translate-x-1 transition-transform" />

    </button>
  </form>

  <p class="mt-8 text-center text-sm font-medium text-gray-500">
    Não tem conta? <a href={resolve("/auth/signup")} class="font-bold text-orange-600 hover:underline">Registe-se aqui</a>
  </p>
</div> -->



<!-- <script lang="ts">
  import { loginWithEmail, loginWithPhone } from '../../auth.remote';
  import { page } from '$app/state';
  import { Loader2 } from 'lucide-svelte';

  let method = $state<'phone' | 'email'>('phone');
  let email = $state('');
  let phone = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let errorMsg = $state('');

  const successMsg = $derived(page.url.searchParams.get('msg'));

  async function handleLogin(event: SubmitEvent) {
    event.preventDefault();
    isLoading = true;
    errorMsg = '';

    try {
      const result = method === 'email'
        ? await loginWithEmail(email, password)
        : await loginWithPhone(phone, password);

      if (result.error) throw new Error(result.error.message);
      window.location.href = '/';
    } catch (err: any) {
      errorMsg = err.message || 'Dados inválidos.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="auth-container">
  <form onsubmit={handleLogin} class="glass-card p-8 w-full max-w-md space-y-6">
    <h1 class="text-2xl font-black text-center">Entrar</h1>

    <div class="flex gap-2 p-1 bg-gray-100 rounded-lg">
      <button type="button" onclick={() => method = 'phone'} class="flex-1 py-2 text-xs font-bold {method === 'phone' ? 'bg-white rounded shadow-sm' : ''}">Telemóvel</button>
      <button type="button" onclick={() => method = 'email'} class="flex-1 py-2 text-xs font-bold {method === 'email' ? 'bg-white rounded shadow-sm' : ''}">Email</button>
    </div>

    {#if successMsg} <p class="text-green-600 text-xs font-bold text-center uppercase">{successMsg}</p> {/if}
    {#if errorMsg} <p class="text-red-500 text-xs font-bold text-center uppercase">{errorMsg}</p> {/if}

    <div class="space-y-4">
      {#if method === 'email'}
        <label class="block text-sm font-bold text-gray-700">
          Email:
          <input bind:value={email} type="email" required class="w-full mt-1 px-4 py-2 border rounded-xl outline-orange-600" />
        </label>
      {:else}
        <label class="block text-sm font-bold text-gray-700">
          Telemóvel:
          <input bind:value={phone} type="tel" required class="w-full mt-1 px-4 py-2 border rounded-xl outline-orange-600" />
        </label>
      {/if}

      <label class="block text-sm font-bold text-gray-700">
        Palavra-passe:
        <input bind:value={password} type="password" required class="w-full mt-1 px-4 py-2 border rounded-xl outline-orange-600" />
      </label>
    </div>

    <button disabled={isLoading} type="submit" class="btn-primary w-full py-3 flex justify-center items-center gap-2">
      {#if isLoading} <Loader2 class="animate-spin" size={18} /> {/if}
      Entrar
    </button>
    
    <p class="text-center text-xs text-gray-400">
      Ainda não tem conta? <a href="/signup" class="text-orange-600 font-bold">Registar</a>
    </p>
  </form>
</div> -->