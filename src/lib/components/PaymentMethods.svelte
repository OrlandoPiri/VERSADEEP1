<script lang="ts">
  /**
   * PaymentMethods.svelte
   *
   * Self-contained checkbox grid for selecting accepted payment methods.
   * Owns its own option list and rendering; the parent only owns the
   * selected array.
   *
   *   let selectedPayments = $state<string[]>([]);
   *   <PaymentMethodsPicker bind:selected={selectedPayments} />
   */
  import { Check } from 'lucide-svelte';

  const DEFAULT_OPTIONS = ['CASH', 'M-PESA', 'E-MOLA', 'M-KESH', 'VISA', 'MASTERCARD', 'EFT', 'OTHER'];

  let {
    selected = $bindable([]),
    options = DEFAULT_OPTIONS
  }: {
    selected: string[];
    options?: string[];
  } = $props();
</script>

<div class="grid grid-cols-2 gap-2">
  {#each options as opt}
    {@const active = selected.includes(opt)}
    <label
      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all select-none
             {active ? 'bg-[#8B5E3C]/10 border-[#8B5E3C]/50 text-white' : 'bg-[#1E293B]/40 border-gray-800 text-gray-500 hover:border-gray-600'}"
    >
      <input type="checkbox" value={opt} bind:group={selected} class="sr-only" />
      <div
        class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
               {active ? 'bg-[#8B5E3C] border-[#8B5E3C]' : 'border-gray-600'}"
      >
        {#if active}<Check size={9} strokeWidth={3} class="text-white" />{/if}
      </div>
      <span class="text-[11px] font-medium">{opt}</span>
    </label>
  {/each}
</div>


<!-- <script lang="ts">
  /**
   * PaymentMethodsField.svelte
   *
   * Identical in Create and Edit — no layout divergence, no behavior
   * beyond the bound array, so it's a clean extraction target.
   * Renders its own label; parents just wrap it (or don't) in whatever
   * card chrome they want.
   */
  import { Check } from 'lucide-svelte';

  let { selectedPayments = $bindable([]) }: { selectedPayments: string[] } = $props();

  const PAYMENT_OPTIONS = ['CASH', 'M-PESA', 'E-MOLA', 'M-KESH', 'VISA', 'MASTERCARD', 'EFT', 'OTHER'];
</script>

<div class="space-y-2">
  <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Formas de Pagamento</span>
  <div class="grid grid-cols-2 gap-2">
    {#each PAYMENT_OPTIONS as opt}
      {@const active = selectedPayments.includes(opt)}
      <label
        class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all select-none
               {active ? 'bg-[#8B5E3C]/10 border-[#8B5E3C]/50 text-white' : 'bg-[#1E293B]/40 border-gray-800 text-gray-500 hover:border-gray-600'}"
      >
        <input type="checkbox" value={opt} bind:group={selectedPayments} class="sr-only" />
        <div
          class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                 {active ? 'bg-[#8B5E3C] border-[#8B5E3C]' : 'border-gray-600'}"
        >
          {#if active}<Check size={9} strokeWidth={3} class="text-white" />{/if}
        </div>
        <span class="text-[11px] font-medium">{opt}</span>
      </label>
    {/each}
  </div>
</div> -->