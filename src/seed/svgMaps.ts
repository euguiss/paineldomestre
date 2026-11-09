/**
 * Generators for simple placeholder map images (SVG).
 *
 * These are 100% original drawings (streets, docks, blocks) — not traced from
 * any published product. They exist only to demonstrate the map features.
 */

const W = 1600;
const H = 1200;

/** A stylised Innsmouth-like river town with docks (original). */
export function innsmouthSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b3a4b"/>
      <stop offset="1" stop-color="#0d2230"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#23251f"/>
  <!-- harbour water -->
  <rect x="0" y="900" width="${W}" height="300" fill="url(#sea)"/>
  <path d="M0 900 Q 400 860 800 900 T 1600 900 L1600 1200 L0 1200 Z" fill="url(#sea)"/>
  <!-- river splitting the town -->
  <path d="M740 0 L800 400 L760 900 L840 900 L880 400 L820 0 Z" fill="url(#sea)" opacity="0.9"/>
  <!-- street grid -->
  <g stroke="#3c3e34" stroke-width="10">
    <line x1="0" y1="200" x2="1600" y2="200"/>
    <line x1="0" y1="400" x2="740" y2="400"/>
    <line x1="880" y1="400" x2="1600" y2="400"/>
    <line x1="0" y1="620" x2="760" y2="620"/>
    <line x1="840" y1="620" x2="1600" y2="620"/>
    <line x1="200" y1="0" x2="220" y2="900"/>
    <line x1="460" y1="0" x2="470" y2="900"/>
    <line x1="1080" y1="0" x2="1060" y2="900"/>
    <line x1="1340" y1="0" x2="1360" y2="900"/>
  </g>
  <!-- docks / piers -->
  <g fill="#4a4336">
    <rect x="300" y="900" width="40" height="180"/>
    <rect x="520" y="900" width="40" height="220"/>
    <rect x="1120" y="900" width="40" height="160"/>
  </g>
  <!-- blocks -->
  <g fill="#2c2e26" opacity="0.6">
    <rect x="40" y="220" width="140" height="160"/>
    <rect x="260" y="220" width="180" height="160"/>
    <rect x="1100" y="220" width="200" height="160"/>
    <rect x="260" y="440" width="180" height="160"/>
    <rect x="900" y="440" width="140" height="160"/>
  </g>
  <text x="40" y="60" fill="#8a8575" font-family="Georgia, serif" font-size="46">Innsmouth (placeholder)</text>
  <text x="40" y="1150" fill="#6b7a82" font-family="Georgia, serif" font-size="30">Porto &amp; Enseada</text>
</svg>`;
}

/** A stylised Arkham-like college town (original). */
export function arkhamSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#201f26"/>
  <!-- river through town -->
  <path d="M0 540 Q 400 500 800 560 T 1600 520 L1600 640 Q 1200 600 800 660 T 0 660 Z" fill="#1b2c3a"/>
  <!-- street grid -->
  <g stroke="#3a3942" stroke-width="10">
    <line x1="0" y1="260" x2="1600" y2="260"/>
    <line x1="0" y1="860" x2="1600" y2="860"/>
    <line x1="260" y1="0" x2="260" y2="1200"/>
    <line x1="620" y1="0" x2="620" y2="1200"/>
    <line x1="980" y1="0" x2="980" y2="1200"/>
    <line x1="1340" y1="0" x2="1340" y2="1200"/>
  </g>
  <!-- campus quad -->
  <rect x="640" y="900" width="320" height="220" fill="#2a3326" opacity="0.7"/>
  <!-- blocks -->
  <g fill="#2a2932" opacity="0.6">
    <rect x="40" y="60" width="180" height="160"/>
    <rect x="1040" y="60" width="200" height="160"/>
    <rect x="300" y="900" width="200" height="160"/>
    <rect x="1040" y="900" width="200" height="160"/>
  </g>
  <text x="40" y="60" fill="#8a8690" font-family="Georgia, serif" font-size="46">Arkham (placeholder)</text>
</svg>`;
}

/** Turn an SVG string into a Blob suitable for storage and imageOverlay. */
export function svgToBlob(svg: string): Blob {
  return new Blob([svg], { type: 'image/svg+xml' });
}

export const SEED_MAP_SIZE = { width: W, height: H };
