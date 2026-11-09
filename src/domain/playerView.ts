import type {
  ClueEntity,
  HandoutEntity,
  LocationEntity,
  NpcEntity,
} from '@/db/schema';
import { KEEPER_DIRECTIVE_RE } from '@/markdown/stripSecrets';

/**
 * Player View allow-list projections (section 10 / acceptance criteria).
 *
 * The Player View NEVER receives the full store. It is built ONLY from these
 * pure projections, which strip every Keeper secret. There is deliberately no
 * projection for Session Zero, plot layers, hidden truths or Keeper notes —
 * so none of them can reach the player window.
 */

export interface PlayerLocation {
  id: string;
  name: string;
  /** Point/polygon geometry is safe (position on the shared map). */
  geometry: LocationEntity['geometry'];
  mapId: string;
  iconKey: string;
  /** Player-facing read-aloud ONLY (generic variant, secrets stripped). */
  playerText: string;
}

export interface PlayerNpc {
  id: string;
  name: string;
}

export interface PlayerClue {
  id: string;
  text: string;
}

export interface PlayerHandout {
  id: string;
  title: string;
  fileBlobId?: string;
  textContent?: string;
  playerSafeCaption: string;
}

/** Only discovered locations, with secrets stripped from the text. */
export function toPlayerLocations(locations: LocationEntity[]): PlayerLocation[] {
  return locations
    .filter((l) => l.discovered)
    .map((l) => ({
      id: l.id,
      name: l.name,
      geometry: l.geometry,
      mapId: l.mapId,
      iconKey: l.iconKey,
      // Use the generic read-aloud only; strip any Keeper directive blocks.
      playerText: stripSecrets(l.readAloud.generico ?? ''),
    }));
}

/** Only NPCs known to players. No stat blocks, no plot layers, no notes. */
export function toPlayerNpcs(npcs: NpcEntity[]): PlayerNpc[] {
  return npcs.filter((n) => n.isKnownToPlayers).map((n) => ({ id: n.id, name: n.name }));
}

/** Only discovered clues, text only. */
export function toPlayerClues(clues: ClueEntity[]): PlayerClue[] {
  return clues.filter((c) => c.status === 'descoberta').map((c) => ({ id: c.id, text: c.text }));
}

/** Only handouts delivered to the given table. */
export function toPlayerHandouts(handouts: HandoutEntity[], tableId: string | null): PlayerHandout[] {
  return handouts
    .filter((h) => (tableId ? h.deliveries.some((d) => d.tableId === tableId) : false))
    .map((h) => ({
      id: h.id,
      title: h.title,
      fileBlobId: h.fileBlobId,
      textContent: h.textContent ? stripSecrets(h.textContent) : undefined,
      playerSafeCaption: h.playerSafeCaption,
    }));
}

/** Remove Keeper directive blocks (:::segredo/:::teste/:::sanidade) from text. */
export function stripSecrets(text: string): string {
  return text.replace(KEEPER_DIRECTIVE_RE, '').trim();
}
