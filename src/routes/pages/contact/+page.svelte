<script lang="ts">
  import {
    Mail,
    MessageCircle,
    Clock3,
    ShieldCheck,
    Store,
    HelpCircle
  } from 'lucide-svelte';

  const COMPANY_NAME = 'Vercenas';
  const SUPPORT_EMAIL = 'info@vercenas.com';
  const BUSINESS_EMAIL = 'business@vercenas.com';
  const RESPONSE_TIME = '24–48 horas';
</script>

<svelte:head>
  <title>Contacto & Suporte — {COMPANY_NAME}</title>
  <meta
    name="description"
    content="Precisa de ajuda? Entre em contacto com a equipa da Vercenas."
  />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4">
  <article
    class="mx-auto max-w-4xl bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
  >

    <!-- Hero -->
    <section class="px-8 py-14 md:px-14 border-b border-gray-100 bg-linear-to-b from-orange-50 to-white">
      <p class="text-xs font-bold uppercase tracking-[0.25em] text-orange-600 mb-4">
        Contacto & Suporte
      </p>

      <h1 class="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 leading-none">
        Estamos aqui para ajudar.
      </h1>

      <p class="mt-6 text-gray-600 text-base leading-relaxed max-w-2xl">
        Precisa de ajuda com uma promoção, conta, comerciante ou funcionalidade
        da plataforma? Entre em contacto com a equipa da <strong>{COMPANY_NAME}</strong>.
        Respondemos o mais rapidamente possível.
      </p>
    </section>

    <!-- Main -->
    <div class="px-8 py-12 md:px-14 space-y-12">

      <!-- Contact cards -->
      <section class="grid md:grid-cols-2 gap-5">

        <!-- Support -->
        <div class="rounded-3xl border border-gray-100 bg-gray-50 p-6">
          <div
            class="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-5"
          >
            <HelpCircle size={22} />
          </div>

          <h2 class="text-xl font-black tracking-tight text-gray-900 mb-3">
            Suporte Geral
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed">
            Questões técnicas, problemas com promoções, contas ou utilização da plataforma.
          </p>

          <a
            href="mailto:{SUPPORT_EMAIL}"
            class="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-2xl
                   bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-colors"
          >
            <Mail size={16} />
            {SUPPORT_EMAIL}
          </a>
        </div>

        <!-- Business -->
        <div class="rounded-3xl border border-gray-100 bg-gray-50 p-6">
          <div
            class="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-5"
          >
            <Store size={22} />
          </div>

          <h2 class="text-xl font-black tracking-tight text-gray-900 mb-3">
            Parcerias & Comerciantes
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed">
            Publicação de promoções, parcerias comerciais, verificação de contas
            e apoio a comerciantes.
          </p>

          <a
            href="mailto:{BUSINESS_EMAIL}"
            class="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-2xl
                   bg-white border border-gray-200 text-gray-800 text-sm font-bold
                   hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <Mail size={16} />
            {BUSINESS_EMAIL}
          </a>
        </div>

      </section>

      <!-- Info blocks -->
      <section class="grid md:grid-cols-3 gap-4">

        {#each [
          {
            icon: Clock3,
            title: 'Tempo de Resposta',
            text: `Respondemos normalmente em ${RESPONSE_TIME}.`
          },
          {
            icon: ShieldCheck,
            title: 'Segurança',
            text: 'Nunca envie palavras-passe ou dados bancários por email.'
          },
          {
            icon: MessageCircle,
            title: 'Feedback',
            text: 'Sugestões e ideias para melhorar a plataforma são bem-vindas.'
          }
        ] as item}

          <div class="rounded-2xl border border-gray-100 p-5">
            <div
              class="w-10 h-10 rounded-xl bg-orange-50 text-orange-600
                     flex items-center justify-center mb-4"
            >
              <svelte:component this={item.icon} size={18} />
            </div>

            <h3 class="font-black tracking-tight text-gray-900 mb-2">
              {item.title}
            </h3>

            <p class="text-sm text-gray-600 leading-relaxed">
              {item.text}
            </p>
          </div>

        {/each}
      </section>

      <!-- FAQ -->
      <section class="space-y-5">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-orange-600 mb-2">
            Perguntas Frequentes
          </p>

          <h2 class="text-3xl font-black tracking-tighter text-gray-900">
            Antes de contactar
          </h2>
        </div>

        <div class="space-y-4">

          {#each [
            {
              q: 'A Vercenas vende produtos?',
              a: 'Não. A Vercenas é apenas uma plataforma de descoberta de promoções. Todas as compras são feitas directamente com os comerciantes.'
            },
            {
              q: 'Posso pedir reembolso através da plataforma?',
              a: 'Não processamos pagamentos nem gerimos reembolsos. Deve contactar directamente o comerciante responsável pela promoção.'
            },
            {
              q: 'Como denunciar uma promoção enganosa?',
              a: 'Envie o link da promoção e os detalhes do problema para o email de suporte.'
            }
          ] as faq}

            <div class="rounded-2xl border border-gray-100 p-5">
              <h3 class="font-bold text-gray-900 mb-2">
                {faq.q}
              </h3>

              <p class="text-sm text-gray-600 leading-relaxed">
                {faq.a}
              </p>
            </div>

          {/each}

        </div>
      </section>

      <!-- CTA -->
      <section
        class="rounded-4xl bg-gray-900 text-white px-8 py-10 md:px-12 md:py-12"
      >
        <div class="max-w-2xl">
          <p class="text-xs font-bold uppercase tracking-[0.25em] text-orange-400 mb-4">
            Ainda precisa de ajuda?
          </p>

          <h2 class="text-3xl md:text-4xl font-black tracking-tighter leading-none">
            Fale directamente com a nossa equipa.
          </h2>

          <p class="mt-5 text-sm md:text-base text-gray-300 leading-relaxed">
            Estamos constantemente a melhorar a experiência da plataforma para
            utilizadores e comerciantes em Moçambique.
          </p>

          <div class="mt-7 flex flex-wrap gap-3">
            <a
              href="mailto:{SUPPORT_EMAIL}"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl
                     bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-colors"
            >
              <Mail size={16} />
              Contactar suporte
            </a>

            <a
              href="/"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl
                     border border-white/15 text-white font-bold text-sm
                     hover:bg-white/5 transition-colors"
            >
              Explorar promoções
            </a>
          </div>
        </div>
      </section>

    </div>


  </article>
</div>