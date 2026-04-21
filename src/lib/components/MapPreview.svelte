<script lang="ts">
  import { MapPin, ExternalLink, Copy, Check } from 'lucide-svelte';

  interface Props {
    address: string;          // Plain-text address, e.g. "Maputo, Avenida Julius Nyerere"
    height?: number;          // iframe height in px — default 220
    zoom?: number;            // Map zoom level 1–21 — default 15
  }

  let { address, height = 220, zoom = 15 }: Props = $props();

  // ── URL construction ────────────────────────────────────────────────────
  //
  // Google Maps embed (no API key required):
  //   https://maps.google.com/maps?q=<encoded_address>&z=<zoom>&output=embed
  //
  // Google Maps directions (opens in browser / Maps app):
  //   https://www.google.com/maps/dir/?api=1&destination=<encoded_address>
  //
  // The `api=1` parameter is required by Google's URL scheme for directions.
  // encodeURIComponent handles spaces → %20, commas → %2C, etc.
  // Both URLs tolerate imperfect input — Google fuzzy-matches the address string.

  const encoded      = $derived(encodeURIComponent(address.trim()));
  const embedUrl     = $derived(`https://maps.google.com/maps?q=${encoded}&z=${zoom}&output=embed`);
  const directionsUrl = $derived(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`);

  // ── Mobile deep link ────────────────────────────────────────────────────
  // On iOS:     maps://?daddr=<encoded>   → opens Apple Maps / Google Maps app
  // On Android: geo:0,0?q=<encoded>       → opens the default maps app
  // We detect client-side only (SSR-safe: isMobile starts false).
  let isMobile = $state(false);
  $effect(() => {
    isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  });

  const mobileUrl = $derived(
    /iPhone|iPad|iPod/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '')
      ? `maps://?daddr=${encoded}`
      : `geo:0,0?q=${encoded}`
  );

  function openMap() {
    const url = isMobile ? mobileUrl : directionsUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // ── Copy address ────────────────────────────────────────────────────────
  let copied = $state(false);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address.trim());
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    } catch {
      // Fallback for browsers that block clipboard without HTTPS
      const el = document.createElement('textarea');
      el.value = address.trim();
      el.style.position = 'fixed';
      el.style.opacity  = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    }
  }

  // ── Edge case: empty address ─────────────────────────────────────────────
  const hasAddress = $derived(address.trim().length > 0);
</script>

{#if hasAddress}
  <div class="map-preview">

    <!-- Address header -->
    <div class="map-header">
      <div class="map-address">
        <MapPin size={14} class="map-pin-icon" />
        <span>{address.trim()}</span>
      </div>
      <button
        class="copy-btn"
        onclick={copyAddress}
        aria-label="Copiar endereço"
        title="Copiar endereço"
      >
        {#if copied}
          <Check size={13} />
          <span>Copiado</span>
        {:else}
          <Copy size={13} />
          <span>Copiar</span>
        {/if}
      </button>
    </div>

    <!-- Map iframe wrapped in a clickable overlay -->
    <!-- 
      The overlay sits on top of the iframe and captures clicks.
      The iframe itself is pointer-events:none so the overlay handles all interaction.
      This is necessary because iframes swallow click events natively.
    -->
    <div
      class="map-wrap"
      style="height:{height}px"
      role="link"
      tabindex="0"
      aria-label="Abrir no Google Maps: {address.trim()}"
      onclick={openMap}
      onkeydown={(e) => e.key === 'Enter' && openMap()}
    >
      <iframe
        src={embedUrl}
        title="Mapa: {address.trim()}"
        loading="lazy"
        referrerpolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin"
        aria-hidden="true"
        tabindex="-1"
      ></iframe>

      <!-- Invisible overlay — captures clicks, shows cursor pointer -->
      <div class="map-overlay" aria-hidden="true">
        <div class="map-overlay-hint">
          <ExternalLink size={14} />
          <span>Abrir no Google Maps</span>
        </div>
      </div>
    </div>

    <!-- Get Directions CTA -->
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="directions-btn"
      aria-label="Obter direções para {address.trim()}"
    >
      <MapPin size={15} />
      Obter Direções
    </a>

  </div>
{/if}

<style>
.map-preview {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 0.5px solid rgba(139, 94, 60, 0.35);
  background: #1E293B;
}

/* ── Address header ── */
.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.06);
}

.map-address {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #D1D5DB;
  min-width: 0;
}

.map-address span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-address :global(.map-pin-icon) {
  color: #B87333;
  flex-shrink: 0;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: transparent;
  border: 0.5px solid rgba(139, 94, 60, 0.35);
  border-radius: 100px;
  color: #6B7280;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: color 150ms ease, border-color 150ms ease;
  flex-shrink: 0;
}

.copy-btn:hover {
  color: #B87333;
  border-color: rgba(184, 115, 51, 0.6);
}

/* ── Map wrap + iframe ── */
.map-wrap {
  position: relative;
  width: 100%;
  cursor: pointer;
  display: block;
}

.map-wrap iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  /* Disable pointer events so the overlay captures all clicks */
  pointer-events: none;
}

/* Transparent overlay — captures clicks, reveals hint on hover */
.map-overlay {
  position: absolute;
  inset: 0;
  background: transparent;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 10px;
  transition: background 150ms ease;
}

.map-wrap:hover .map-overlay {
  background: rgba(0, 0, 0, 0.18);
}

.map-overlay-hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: rgba(13, 13, 13, 0.82);
  border: 0.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 100px;
  color: #D1D5DB;
  font-size: 11px;
  font-weight: 500;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 150ms ease, transform 150ms ease;
}

.map-wrap:hover .map-overlay-hint,
.map-wrap:focus .map-overlay-hint {
  opacity: 1;
  transform: translateY(0);
}

/* ── Directions button ── */
.directions-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 12px;
  background: transparent;
  border-top: 0.5px solid rgba(255, 255, 255, 0.06);
  color: #B87333;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 150ms ease, color 150ms ease;
}

.directions-btn:hover {
  background: rgba(184, 115, 51, 0.08);
  color: #D4956A;
}

/* ── Focus ring ── */
.map-wrap:focus-visible {
  outline: 2px solid #B87333;
  outline-offset: -2px;
}
</style>