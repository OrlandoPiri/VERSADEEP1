<script lang="ts">
  interface Props {
    address: string;
  }

  let { address }: Props = $props();

  const encoded = $derived(encodeURIComponent(address));
  const iframeSrc = $derived(
    `https://maps.google.com/maps?q=${encoded}&output=embed&z=15`
  );
  const directionsUrl = $derived(
    `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
  );

  let copied = $state(false);

  async function copyAddress() {
    await navigator.clipboard.writeText(address);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

{#if address}
  <div class="map-wrapper">
    <!-- Address row -->
    <div class="address-row">
      <span class="address-text">📍 {address}</span>
      <button onclick={copyAddress} class="copy-btn" aria-label="Copy address">
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
    </div>

    <!-- Clickable map -->
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="map-link"
      aria-label="Open directions in Google Maps"
    >
      <iframe
        title="Map preview for {address}"
        src={iframeSrc}
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        class="map-iframe"
      ></iframe>
      <div class="map-overlay" aria-hidden="true">
        <span class="open-label">↗ Abrir no Google Maps</span>
      </div>
    </a>

    <!-- CTA -->
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="directions-btn"
    >
      Obter Direcções
    </a>
  </div>
{/if}

<style>
  .map-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-radius: 1.5rem;
    overflow: hidden;
    border: 1px solid #1f2937;
    background: #0D0D0D;
  }

  .address-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.25rem;
    gap: 0.75rem;
  }

  .address-text {
    color: #f1f5f9;
    font-size: 0.875rem;
    font-weight: 700;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-btn {
    flex-shrink: 0;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #6b7280;
    background: #1e293b;
    border: 1px solid #374151;
    border-radius: 999px;
    padding: 0.3rem 0.75rem;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .copy-btn:hover {
    color: #f97316;
    border-color: #f97316;
  }

  .map-link {
    position: relative;
    display: block;
    height: 220px;
  }

  .map-iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
    pointer-events: none; /* let the <a> handle clicks */
    filter: grayscale(0.3) brightness(0.85);
  }

  .map-overlay {
    position: absolute;
    inset: 0;
    background: transparent;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 0.75rem;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .map-link:hover .map-overlay {
    opacity: 1;
  }

  .open-label {
    background: rgba(0,0,0,0.75);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    backdrop-filter: blur(4px);
  }

  .directions-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.875rem 1.25rem;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #a07455;
    border-top: 1px solid #1f2937;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }

  .directions-btn:hover {
    background: #f97316;
    color: #fff;
  }
</style>