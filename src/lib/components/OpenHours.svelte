<script lang="ts">
  /**
   * OpenHoursEditor.svelte
   *
   * Self-contained 7-day business hours grid. Owns the day list and
   * rendering; the parent only owns the hours record.
   *
   *   let openHoursState = $state({ monday: '', ..., sunday: '' });
   *   <OpenHoursEditor bind:hours={openHoursState} />
   */

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  let {
    hours = $bindable({
      monday: '', tuesday: '', wednesday: '', thursday: '',
      friday: '', saturday: '', sunday: ''
    })
  }: {
    hours: Record<string, string>;
  } = $props();
</script>

<div class="grid grid-cols-2 gap-1.5">
  {#each DAYS as day}
    <label class="flex items-center gap-2 px-2.5 py-2 bg-[#1E293B]/40 rounded-lg border border-gray-800">
      <span class="text-[10px] text-gray-600 w-6 uppercase shrink-0 font-bold">{day.slice(0, 3)}</span>
      <input
        type="text"
        bind:value={hours[day]}
        placeholder="09:00–18:00"
        class="flex-1 bg-transparent text-white text-[11px] outline-none placeholder:text-gray-700"
      />
    </label>
  {/each}
</div>

<!-- <script lang="ts">
  /**
   * OpeningHoursField.svelte
   *
   * Identical in Create and Edit. Each day row is a nested <label> —
   * clicking anywhere on the row focuses its input, no for/id needed.
   */
  let { openHoursState = $bindable({}) }: { openHoursState: Record<string, string> } = $props();

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
</script>

<div class="space-y-2">
  <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Horário</span>
  <div class="grid grid-cols-2 gap-1.5">
    {#each DAYS as day}
      <label class="flex items-center gap-2 px-2.5 py-2 bg-[#1E293B]/40 rounded-lg border border-gray-800 cursor-text">
        <span class="text-[10px] text-gray-600 w-6 uppercase shrink-0 font-bold">{day.slice(0, 3)}</span>
        <input
          type="text"
          bind:value={openHoursState[day]}
          placeholder="09:00–18:00"
          class="flex-1 bg-transparent text-white text-[11px] outline-none placeholder:text-gray-700"
        />
      </label>
    {/each}
  </div>
</div> -->