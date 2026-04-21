<script lang="ts">
  const LAST_UPDATED = '17 de Abril de 2026';
  const COMPANY_NAME = 'VersaDeep';
  const CONTACT_EMAIL = 'legal@versadeep.co.mz'; // replace with real email
  const JURISDICTION  = 'República de Moçambique';
</script>

<svelte:head>
  <title>Termos de Utilização — {COMPANY_NAME}</title>
  <meta name="description" content="Termos de Utilização da plataforma {COMPANY_NAME}" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4">
  <article class="mx-auto max-w-3xl bg-white rounded-3xl shadow-sm border border-gray-100 px-8 py-12 md:px-16">

    <!-- Header -->
    <header class="mb-12 pb-8 border-b border-gray-100">
      <p class="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">Plataforma de Promoções</p>
      <h1 class="text-4xl font-black tracking-tighter text-gray-900 mb-4">Termos de Utilização</h1>
      <p class="text-sm text-gray-400">Última actualização: {LAST_UPDATED}</p>
    </header>

    <!-- Intro -->
    <section class="mb-10 p-5 bg-orange-50 border border-orange-100 rounded-2xl">
      <p class="text-sm text-gray-700 leading-relaxed">
        Ao utilizar o <strong>{COMPANY_NAME}</strong>, concorda com estes termos. Leia-os com atenção.
        São simples e directos — não usamos linguagem jurídica desnecessária.
      </p>
      <p class="text-sm text-gray-700 leading-relaxed mt-3">
        <strong>{COMPANY_NAME}</strong> é uma plataforma de descoberta de promoções. Não vendemos produtos,
        não processamos pagamentos e não participamos em transacções entre utilizadores e comerciantes.
        Somos um espaço de visibilidade — não um intermediário comercial.
      </p>
    </section>

    <div class="space-y-10 text-gray-700 text-sm leading-relaxed">

      <!-- 1 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">1.</span> O que é o {COMPANY_NAME}
        </h2>
        <p>
          O {COMPANY_NAME} é um agregador digital de promoções. A nossa função é apresentar ofertas
          publicadas por comerciantes para que os utilizadores as possam explorar, comparar e encontrar
          as lojas físicas ou online que lhes interessam.
        </p>
        <p class="mt-3">A plataforma <strong>não</strong>:</p>
        <ul class="mt-2 space-y-1.5 ml-4 list-none">
          {#each [
            'Vende produtos ou serviços',
            'Processa pagamentos de qualquer tipo',
            'Actua como intermediário em transacções',
            'Garante a disponibilidade, exactidão ou condições das promoções publicadas',
            'Detém fundos ou valores de terceiros',
          ] as item}
            <li class="flex items-start gap-2">
              <span class="mt-0.5 text-red-400 font-bold shrink-0">✕</span>
              {item}
            </li>
          {/each}
        </ul>
      </section>

      <!-- 2 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">2.</span> Sem Responsabilidade em Transacções
        </h2>
        <p>
          Todas as transacções comerciais — incluindo compras, encomendas, acordos de preço e entregas —
          ocorrem exclusivamente entre o utilizador (comprador) e o comerciante (vendedor), <strong>fora
          da plataforma</strong>.
        </p>
        <p class="mt-3">
          O {COMPANY_NAME} não é parte de qualquer transacção. Não temos acesso aos detalhes da compra,
          não confirmamos pagamentos e não temos capacidade de intervir em caso de litígio entre as partes.
        </p>
        <p class="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 italic">
          Recomendamos que confirme os detalhes da promoção directamente com o comerciante antes de se
          deslocar ou efectuar qualquer pagamento.
        </p>
      </section>

      <!-- 3 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">3.</span> Formas de Pagamento — Aviso Importante
        </h2>
        <p>
          As formas de pagamento indicadas em cada promoção (ex: M-Pesa, dinheiro, Visa) pertencem
          exclusivamente ao comerciante que publicou a oferta. O {COMPANY_NAME}:
        </p>
        <ul class="mt-2 space-y-1.5 ml-4 list-none">
          {#each [
            'Não recebe, processa nem retém qualquer pagamento',
            'Não tem acesso a dados de pagamento dos utilizadores',
            'Não cobra taxas de transacção',
            'Não valida nem garante os métodos de pagamento indicados',
          ] as item}
            <li class="flex items-start gap-2">
              <span class="mt-0.5 text-red-400 font-bold shrink-0">✕</span>
              {item}
            </li>
          {/each}
        </ul>
        <p class="mt-3">
          Qualquer pagamento é feito directamente ao comerciante, através dos meios por ele disponibilizados.
        </p>
      </section>

      <!-- 4 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">4.</span> Exactidão das Promoções
        </h2>
        <p>
          As promoções publicadas no {COMPANY_NAME} são da responsabilidade exclusiva dos comerciantes
          que as submeteram. A plataforma não verifica, audita nem valida o conteúdo das promoções em
          tempo real.
        </p>
        <p class="mt-3">Uma promoção pode:</p>
        <ul class="mt-2 space-y-1.5 ml-4 list-disc list-inside text-gray-600">
          <li>Ter expirado antes de ser removida da plataforma</li>
          <li>Conter erros de preço, descrição ou condições</li>
          <li>Ter sido alterada pelo comerciante sem actualização imediata</li>
          <li>Estar sujeita a condições não descritas na publicação</li>
        </ul>
        <p class="mt-3 font-medium text-gray-800">
          Antes de qualquer compra, confirme sempre os detalhes directamente com o comerciante.
        </p>
      </section>

      <!-- 5 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">5.</span> Responsabilidade do Utilizador
        </h2>
        <p>Ao utilizar o {COMPANY_NAME}, o utilizador compromete-se a:</p>
        <ul class="mt-2 space-y-1.5 ml-4 list-disc list-inside text-gray-600">
          <li>Contactar o comerciante antes de qualquer compra ou deslocação</li>
          <li>Verificar a disponibilidade e condições do produto ou serviço</li>
          <li>Inspeccionar o produto antes de efectuar o pagamento, sempre que possível</li>
          <li>Não utilizar a plataforma para fins ilegais, enganosos ou abusivos</li>
          <li>Não publicar informações falsas caso seja comerciante registado</li>
        </ul>
        <p class="mt-3">
          O {COMPANY_NAME} reserva-se o direito de suspender ou remover contas que violem estes termos,
          sem aviso prévio.
        </p>
      </section>

      <!-- 6 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">6.</span> Devoluções e Reembolsos
        </h2>
        <p>
          O {COMPANY_NAME} não tem qualquer responsabilidade em processos de devolução, troca ou
          reembolso. Estas situações são da responsabilidade exclusiva do comerciante, de acordo com
          a política própria de cada loja e a legislação aplicável em {JURISDICTION}.
        </p>
        <p class="mt-3">
          Em caso de insatisfação com uma compra, o utilizador deve contactar directamente o comerciante.
          O {COMPANY_NAME} pode ser contactado para reportar comerciantes que violem as regras da
          plataforma, mas não pode intervir em disputas comerciais.
        </p>
      </section>

      <!-- 7 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">7.</span> Responsabilidade dos Comerciantes
        </h2>
        <p>Os comerciantes que publicam promoções no {COMPANY_NAME} são os únicos responsáveis por:</p>
        <ul class="mt-2 space-y-1.5 ml-4 list-disc list-inside text-gray-600">
          <li>A exactidão, veracidade e validade das promoções publicadas</li>
          <li>O cumprimento das condições anunciadas</li>
          <li>O atendimento ao cliente e resolução de reclamações</li>
          <li>O cumprimento da legislação comercial e fiscal aplicável</li>
          <li>A qualidade dos produtos ou serviços oferecidos</li>
        </ul>
        <p class="mt-3">
          O {COMPANY_NAME} reserva-se o direito de remover promoções ou suspender contas de comerciantes
          que publiquem informação enganosa, ilegal ou que prejudique os utilizadores.
        </p>
      </section>

      <!-- 8 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">8.</span> Limitação de Responsabilidade
        </h2>
        <p>
          Na máxima extensão permitida pela lei, o {COMPANY_NAME} não é responsável por:
        </p>
        <ul class="mt-2 space-y-1.5 ml-4 list-disc list-inside text-gray-600">
          <li>Transacções falhadas, canceladas ou não concluídas</li>
          <li>Promoções enganosas ou incorrectas publicadas por comerciantes</li>
          <li>Danos directos ou indirectos resultantes do uso da plataforma</li>
          <li>Perdas financeiras resultantes de compras baseadas em informação da plataforma</li>
          <li>Disputas entre utilizadores e comerciantes</li>
          <li>Indisponibilidade temporária da plataforma</li>
        </ul>
        <p class="mt-3">
          A plataforma é fornecida <em>"tal como está"</em>, sem garantias de disponibilidade contínua
          ou ausência de erros.
        </p>
      </section>

      <!-- 9 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">9.</span> Propriedade Intelectual
        </h2>
        <p>
          O design, código e conteúdo próprio do {COMPANY_NAME} são propriedade da plataforma.
          Os comerciantes mantêm a propriedade das imagens e textos que submetem, mas concedem
          ao {COMPANY_NAME} o direito de os exibir na plataforma para fins de visibilidade comercial.
        </p>
        <p class="mt-3">
          É proibido copiar, redistribuir ou usar o conteúdo da plataforma para fins comerciais sem
          autorização prévia.
        </p>
      </section>

      <!-- 10 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">10.</span> Alterações aos Termos
        </h2>
        <p>
          O {COMPANY_NAME} pode actualizar estes termos a qualquer momento. Quando o fizer, a data
          de "última actualização" no topo desta página será revista. O uso continuado da plataforma
          após alterações constitui aceitação dos novos termos.
        </p>
        <p class="mt-3">
          Para alterações significativas, notificaremos os utilizadores registados por email.
        </p>
      </section>

      <!-- 11 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">11.</span> Lei Aplicável e Jurisdição
        </h2>
        <p>
          Estes termos são regidos pela lei da <strong>{JURISDICTION}</strong>. Qualquer litígio
          resultante da utilização da plataforma será submetido à jurisdição dos tribunais competentes
          de {JURISDICTION}.
        </p>
      </section>

      <!-- 12 -->
      <section>
        <h2 class="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
          <span class="text-orange-600">12.</span> Contacto
        </h2>
        <p>
          Para questões sobre estes termos, contacte-nos através de:
        </p>
        <a href="mailto:{CONTACT_EMAIL}"
           class="inline-block mt-3 px-5 py-2.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 font-bold text-sm hover:bg-orange-100 transition-colors">
          {CONTACT_EMAIL}
        </a>
      </section>

    </div>

    <!-- Footer -->
    <footer class="mt-12 pt-8 border-t border-gray-100 text-center">
      <p class="text-xs text-gray-400">
        © 2026 {COMPANY_NAME} · {JURISDICTION} ·
        <a href="/privacy" class="hover:text-orange-600 transition-colors">Política de Privacidade</a>
      </p>
    </footer>

  </article>
</div>