import type { LocationKind } from '@/db/schema';

/** Emoji glyph per icon key / kind, used inside Leaflet divIcons (bundled, no CDN). */
const GLYPHS: Record<string, string> = {
  warehouse: '🏚️',
  anchor: '⚓',
  beer: '🍺',
  church: '⛪',
  store: '🏪',
  building: '🏛️',
  map: '📍',
  house: '🏠',
  crime: '🔪',
};

export function glyphFor(iconKey: string, kind: LocationKind): string {
  if (GLYPHS[iconKey]) return GLYPHS[iconKey];
  switch (kind) {
    case 'armazem':
      return GLYPHS.warehouse;
    case 'porto':
      return GLYPHS.anchor;
    case 'igreja':
      return GLYPHS.church;
    case 'loja':
      return GLYPHS.store;
    case 'instituicao':
      return GLYPHS.building;
    case 'taverna':
      return GLYPHS.beer;
    case 'cena-de-crime':
      return GLYPHS.crime;
    case 'casa':
      return GLYPHS.house;
    default:
      return GLYPHS.map;
  }
}
