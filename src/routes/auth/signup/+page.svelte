<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-svelte';
  import { resolve } from '$app/paths';

  // --- Svelte 5 State ---
  let method = $state<'email' | 'phone'>('email');
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let password = $state('');
  let loading = $state(false);
  let errorMessage = $state('');

  async function handleSignup() {
    loading = true;
    errorMessage = '';

    // Clean spaces from the phone number
    const cleanPhone = phone.replace(/\s+/g, '');
    
    // THE TRICK: If phone method, generate a fake email to satisfy your DB's notNull constraint
    const authEmail = method === 'email' ? email : `${cleanPhone}@phone.local`;

    try {
      const { data, error } = await authClient.signUp.email({
        email: authEmail,
        password: password,
        name: name,
        // Because you added this to 'additionalFields' in auth.ts, 
        // Better Auth knows exactly where to save it in your database!
        phoneNumber: method === 'phone' ? cleanPhone : undefined 
      });
if (error) {
        // Fallback to a generic string if error.message is undefined
        errorMessage = error.message || "Ocorreu um erro ao criar a conta."; 
        loading = false;
        return;
      }

      // Success! Hard redirect to the home page. 
      // SvelteKit will detect the new cookie and show "Olá, User"
      window.location.href = "/";

    } catch (err: any) {
      errorMessage = "Erro de conexão ao servidor.";
      loading = false;
    }
  }
  
</script>

<div class="mx-auto max-w-md px-6 py-20">
  <div class="text-center">
    <h1 class="text-3xl font-black tracking-tight text-gray-900">Criar Conta</h1>
    <p class="mt-2 text-sm font-medium text-gray-500">Junte-se à maior rede de promoções em Moçambique.</p>
  </div>

  <div class="mt-8 flex rounded-xl bg-gray-100 p-1">
    <button onclick={() => method = 'email'} class="flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all {method === 'email' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">Email</button>
    <button onclick={() => method = 'phone'} class="flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all {method === 'phone' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">Telemóvel</button>
  </div>

  <form onsubmit={(e) => { e.preventDefault(); handleSignup(); }} class="mt-6 space-y-4">
    <div class="space-y-1">
      <label for="name" class="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Nome Completo</label>
      <div class="relative">
        <User class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input id="name" bind:value={name} type="text" placeholder="Ex: Orlando Macamo" required class="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
      </div>
    </div>

    {#if method === 'email'}
      <div class="space-y-1">
        <label for="email" class="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
        <div class="relative">
          <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input id="email" bind:value={email} type="email" placeholder="seu@email.com" required class="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </div>
      </div>
    {:else}
      <div class="space-y-1">
        <label for="phone" class="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Telemóvel</label>
        <div class="relative">
          <Phone class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input id="phone" bind:value={phone} type="tel" placeholder="84 000 0000" required class="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </div>
      </div>
    {/if}

    <div class="space-y-1">
      <label for="password" class="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Senha</label>
      <div class="relative">
        <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input id="password" bind:value={password} type="password" placeholder="••••••••" required class="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
      </div>
    </div>

    {#if errorMessage}
      <p class="text-center text-xs font-bold text-red-500">{errorMessage}</p>
    {/if}

    <button type="submit" disabled={loading} class="group flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 text-sm font-bold text-white transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50">
      {loading ? 'A processar...' : 'Criar Conta'}
      <ArrowRight size={18} class="transition-transform group-hover:translate-x-1" />
    </button>
  </form>
  <p class="mt-8 text-center text-sm font-medium text-gray-500">
    Ja tem conta? <a href={resolve("/auth/login")} class="font-bold text-orange-600 hover:underline">Entre aqui</a>
  </p>
</div>



<!-- <script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-svelte';
  import { resolve } from '$app/paths';

  // --- Svelte 5 State ---
  let method = $state<'email' | 'phone'>('email');
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let password = $state('');
  let loading = $state(false);
  let errorMessage = $state('');

  async function handleSignup(e: Event) {
    e.preventDefault();
    if (loading) return;

    loading = true;
    errorMessage = '';

    try {
      if (method === 'email') {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name,
          callbackURL: "/" // Built-in redirect for email
        });
        if (error) throw new Error(error.message);
      } else {
        // PHONE PLUGIN: Direct call, cleaning spaces from input
        const { error } = await authClient.phoneNumber.signUp({
          phoneNumber: phone.replace(/\s+/g, ''),
          password,
          name
        });

        if (error) throw new Error(error.message);

        // Success: Manual redirect for Phone to sync the "Olá"
        window.location.href = "/";
      }
    } catch (err: any) {
      errorMessage = err.message || "Falha no registo.";
      loading = false;
    }
  }
</script>

<div class="mx-auto max-w-md px-6 py-20">
  <div class="text-center">
    <h1 class="text-3xl font-black tracking-tight text-gray-900">Criar Conta</h1>
    <p class="mt-2 text-sm font-medium text-gray-500">Junte-se à maior rede de promoções em Moçambique.</p>
  </div>

  <div class="mt-8 flex rounded-xl bg-gray-100 p-1">
    {#each ['email', 'phone'] as m}
      <button 
        onclick={() => (method = m as any)}
        class="flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all 
        {method === m ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}"
      >
        {m === 'email' ? 'Email' : 'Telemóvel'}
      </button>
    {/each}
  </div>

  <form onsubmit={handleSignup} class="mt-6 space-y-4">
    <div class="space-y-1">
      <label for="name" class="ml-1 text-[10px] font-black uppercase text-gray-400">Nome Completo</label>
      <div class="relative">
        <User class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input id="name" bind:value={name} type="text" required class="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-orange-500 outline-none" />
      </div>
    </div>

    {#if method === 'email'}
      <div class="space-y-1">
        <label for="email" class="ml-1 text-[10px] font-black uppercase text-gray-400">Email</label>
        <div class="relative">
          <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input id="email" bind:value={email} type="email" required class="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-orange-500 outline-none" />
        </div>
      </div>
    {:else}
      <div class="space-y-1">
        <label for="phone" class="ml-1 text-[10px] font-black uppercase text-gray-400">Telemóvel</label>
        <div class="relative">
          <Phone class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input id="phone" bind:value={phone} type="tel" required placeholder="84 000 0000" class="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-orange-500 outline-none" />
        </div>
      </div>
    {/if}

    <div class="space-y-1">
      <label for="password" class="ml-1 text-[10px] font-black uppercase text-gray-400">Senha</label>
      <div class="relative">
        <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input id="password" bind:value={password} type="password" required class="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-orange-500 outline-none" />
      </div>
    </div>

    {#if errorMessage}
      <p class="text-center text-xs font-bold text-red-500">{errorMessage}</p>
    {/if}

    <button type="submit" disabled={loading} class="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 text-sm font-bold text-white transition-all hover:bg-orange-700 disabled:opacity-50">
      {loading ? 'A processar...' : 'Criar Conta'}
      <ArrowRight size={18} />
    </button>
  </form>
</div> -->



<!-- <script lang="ts">
  // Import individual functions directly from the remote file
  import { signupWithEmail, signupWithPhone } from '../../auth.remote'; 
  import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  let method = $state<'email' | 'phone'>('email');
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let password = $state('');
  let loading = $state(false);
  let errorMessage = $state('');

async function handleSignup() {
    loading = true;
    errorMessage = '';

    const payload = method === 'email' 
        ? { action: 'signupEmail', data: { e: email, p: password, n: name } }
        : { action: 'signupPhone', data: { ph: phone, p: password, n: name } };

    const response = await fetch('/api/auth-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.error || !result.user) {
        errorMessage = result.error?.message || 'Falha no registo.';
        loading = false;
    } else {
        window.location.href = "/";
    }
}
</script>



<div class="mx-auto max-w-md px-6 py-20">
  <div class="text-center">
    <h1 class="text-3xl font-black tracking-tight text-gray-900">Criar Conta</h1>
    <p class="mt-2 text-sm text-gray-500 font-medium">Junte-se à maior rede de promoções em Moçambique.</p>
  </div>

  <div class="mt-8 flex rounded-xl bg-gray-100 p-1">
    <button 
      onclick={() => method = 'email'}
      class="flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all {method === 'email' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
    >
      Email
    </button>
    <button 
      onclick={() => method = 'phone'}
      class="flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all {method === 'phone' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
    >
      Telemóvel
    </button>
  </div>

  <form onsubmit={(e) => { e.preventDefault(); handleSignup(); }} class="mt-6 space-y-4">
    <div class="space-y-1">
      <label for="name" class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nome Completo</label>
      <div class="relative">
        <User class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input id="name" bind:value={name}  type="text" placeholder="Ex: Orlando Macamo" required class="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
      </div>
    </div>

    {#if method === 'email'}
      <div class="space-y-1">
        <label for="email" class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email</label>
        <div class="relative">
          <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input id="email" bind:value={email}  type="email" placeholder="seu@email.com" required class="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
        </div>
      </div>
    {:else}
      <div class="space-y-1">
        <label for="phone" class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Telemóvel</label>
        <div class="relative">
          <Phone class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input id="phone" bind:value={phone}  type="tel" placeholder="84 000 0000" required class="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
        </div>
      </div>
    {/if}

    <div class="space-y-1">
      <label for="password" class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Senha</label>
      <div class="relative">
        <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input id="password" bind:value={password}  type="password" placeholder="••••••••" required class="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
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
      {loading ? 'A processar...' : 'Criar Conta'}
      <ArrowRight size={18} class="group-hover:translate-x-1 transition-transform" />
    </button>
  </form>
    <p class="mt-8 text-center text-sm font-medium text-gray-500">
    Ja tem conta? <a href={resolve("/auth/login")} class="font-bold text-orange-600 hover:underline">Entre aqui</a>
  </p>
</div> -->



<!-- <script lang="ts">
  import { signupWithEmail, signupWithPhone } from '../../auth.remote';
  import { goto } from '$app/navigation';
  import { Loader2 } from 'lucide-svelte';

  let method = $state<'phone' | 'email'>('phone');
  let isLoading = $state(false);
  let errorMsg = $state('');

  // Svelte 5 state for direct binding
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let password = $state('');

  async function handleSignup(event: SubmitEvent) {
    event.preventDefault();
    isLoading = true;
    errorMsg = '';

    try {
      const result = method === 'email' 
        ? await signupWithEmail(email, password, name)
        : await signupWithPhone(phone, password, name);

      if (result.error) throw new Error(result.error.message);
      goto('/login?msg=Conta criada com sucesso!');
    } catch (err: any) {
      errorMsg = err.message || 'Falha ao registar.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="auth-container">
  <form onsubmit={handleSignup} class="glass-card p-8 w-full max-w-md space-y-6">
    <h1 class="text-2xl font-black text-center">Criar Conta</h1>

    <div class="flex gap-2 p-1 bg-gray-100 rounded-lg">
      <button type="button" onclick={() => method = 'phone'} class="flex-1 py-2 text-xs font-bold {method === 'phone' ? 'bg-white rounded shadow-sm' : ''}">Telemóvel</button>
      <button type="button" onclick={() => method = 'email'} class="flex-1 py-2 text-xs font-bold {method === 'email' ? 'bg-white rounded shadow-sm' : ''}">Email</button>
    </div>

    {#if errorMsg}
      <p class="text-red-500 text-xs font-bold border-l-2 border-red-500 pl-2">{errorMsg}</p>
    {/if}

    <div class="space-y-4">
      <label class="block text-sm font-bold text-gray-700">
        Nome Completo:
        <input bind:value={name} type="text" required class="w-full mt-1 px-4 py-2 border rounded-xl outline-orange-600" />
      </label>

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
        <input bind:value={password} type="password" required minlength="6" class="w-full mt-1 px-4 py-2 border rounded-xl outline-orange-600" />
      </label>
    </div>

    <button disabled={isLoading} type="submit" class="btn-primary w-full py-3 flex justify-center items-center gap-2">
      {#if isLoading} <Loader2 class="animate-spin" size={18} /> {/if}
      Registar
    </button>
  </form>
</div> -->