<script lang="ts">
  const COMPANY_NAME = 'Vercenas';
  const CONTACT_EMAIL = 'info@vercenas.com';
</script>

<svelte:head>
  <title>Sobre Nós — {COMPANY_NAME}</title>
  <meta
    name="description"
    content="Conheça a missão da Vercenas — a plataforma moçambicana de descoberta de promoções e negócios."
  />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4">
  <article class="mx-auto max-w-4xl bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

    <!-- Hero -->
    <section class="relative px-8 py-16 md:px-16 bg-linear-to-br from-orange-50 via-white to-white border-b border-gray-100">
      <p class="text-xs font-bold uppercase tracking-widest text-orange-600 mb-4">
        Plataforma de Descoberta de Promoções
      </p>

      <h1 class="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 leading-tight max-w-3xl">
        Tornamos mais fácil descobrir
        <span class="text-orange-600">ofertas reais</span>,
        negócios locais e oportunidades perto de si.
      </h1>

      <p class="mt-6 text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl">
        A {COMPANY_NAME} nasceu para ajudar consumidores a encontrar promoções activas
        e comerciantes a ganhar visibilidade digital — sem complexidade, sem intermediação
        e sem barreiras desnecessárias.
      </p>
    </section>

    <div class="px-8 py-14 md:px-16 space-y-16">

      <!-- Mission -->
      <section class="grid md:grid-cols-2 gap-10 items-start">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">
            A Nossa Missão
          </p>

          <h2 class="text-3xl font-black tracking-tight text-gray-900">
            Dar visibilidade ao comércio local.
          </h2>
        </div>

        <div class="space-y-5 text-gray-700 leading-relaxed">
          <p>
            Muitos negócios têm boas promoções, mas pouca presença digital.
            Muitos consumidores querem poupar, mas não sabem onde procurar.
          </p>

          <p>
            A {COMPANY_NAME} existe para aproximar estes dois lados:
            uma plataforma simples onde promoções podem ser descobertas,
            exploradas e partilhadas rapidamente.
          </p>

          <p>
            Queremos tornar o mercado mais visível, mais acessível e mais conectado —
            cidade por cidade, negócio por negócio.
          </p>
        </div>
      </section>

      <!-- What we are -->
      <section class="rounded-3xl border border-gray-100 bg-gray-50 p-8">
        <p class="text-xs font-bold uppercase tracking-widest text-orange-600 mb-4">
          O Que Somos
        </p>

        <div class="grid md:grid-cols-2 gap-8">
          <div>
            <h3 class="text-xl font-black text-gray-900 mb-4">
              A {COMPANY_NAME} é:
            </h3>

            <ul class="space-y-3 text-sm text-gray-700">
              {#each [
                'Uma plataforma de descoberta de promoções',
                'Um espaço de visibilidade para comerciantes',
                'Uma forma rápida de encontrar ofertas locais',
                'Uma ponte entre consumidores e negócios',
                'Uma plataforma construída para Moçambique'
              ] as item}
                <li class="flex items-start gap-3">
                  <span class="text-green-500 font-black mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              {/each}
            </ul>
          </div>

          <div>
            <h3 class="text-xl font-black text-gray-900 mb-4">
              A {COMPANY_NAME} não é:
            </h3>

            <ul class="space-y-3 text-sm text-gray-700">
              {#each [
                'Uma loja online',
                'Uma plataforma de pagamentos',
                'Um intermediário de compras',
                'Um serviço de entregas',
                'Um marketplace tradicional'
              ] as item}
                <li class="flex items-start gap-3">
                  <span class="text-red-400 font-black mt-0.5">✕</span>
                  <span>{item}</span>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </section>

      <!-- Philosophy -->
      <section>
        <p class="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">
          Como Pensamos
        </p>

        <h2 class="text-3xl font-black tracking-tight text-gray-900 mb-6">
          Simples. Útil. Transparente.
        </h2>

        <div class="grid md:grid-cols-3 gap-6">
          {#each [
            {
              title: 'Sem Complexidade',
              text: 'Acreditamos que descobrir promoções deve ser rápido, claro e intuitivo.'
            },
            {
              title: 'Transparência',
              text: 'Não escondemos o nosso papel: ajudamos utilizadores a descobrir ofertas — não processamos transacções.'
            },
            {
              title: 'Foco Local',
              text: 'Construímos ferramentas adaptadas à realidade do comércio moçambicano.'
            }
          ] as item}
            <div class="rounded-2xl border border-gray-100 p-6 bg-white">
              <h3 class="font-black text-gray-900 mb-3">
                {item.title}
              </h3>

              <p class="text-sm text-gray-600 leading-relaxed">
                {item.text}
              </p>
            </div>
          {/each}
        </div>
      </section>

      <!-- Future -->
      <section class="border-t border-gray-100 pt-14">
        <p class="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">
          O Futuro
        </p>

        <h2 class="text-3xl font-black tracking-tight text-gray-900 mb-6">
          Estamos apenas a começar.
        </h2>

        <div class="space-y-5 text-gray-700 leading-relaxed max-w-3xl">
          <p>
            A nossa visão é criar a principal plataforma de descoberta comercial
            em Moçambique — ajudando negócios de todas as dimensões a alcançar
            mais pessoas.
          </p>

          <p>
            Continuaremos a investir em melhor pesquisa, filtros inteligentes,
            experiência mobile, visibilidade para comerciantes e ferramentas
            que aproximem consumidores das melhores oportunidades disponíveis.
          </p>
        </div>
      </section>

      <!-- CTA -->
      <section class="rounded-3xl bg-orange-600 text-white p-8 md:p-10">
        <div class="max-w-2xl">
          <p class="text-xs font-bold uppercase tracking-widest text-orange-100 mb-3">
            Junte-se à Plataforma
          </p>

          <h2 class="text-3xl font-black tracking-tight mb-4">
            Descubra promoções perto de si.
          </h2>

          <p class="text-orange-50 leading-relaxed">
            Explore ofertas activas, encontre negócios locais e acompanhe promoções
            actualizadas em tempo real.
          </p>

          <div class="flex flex-wrap gap-3 mt-8">
            <a
              href="/"
              class="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white text-orange-600 font-black hover:bg-orange-50 transition-colors"
            >
              Explorar Promoções
            </a>

            <a
              href="mailto:{CONTACT_EMAIL}"
              class="inline-flex items-center justify-center px-6 py-3 rounded-2xl border border-orange-300 text-white font-bold hover:bg-orange-500 transition-colors"
            >
              Contactar-nos
            </a>
          </div>
        </div>
      </section>

    </div>
  </article>
</div>