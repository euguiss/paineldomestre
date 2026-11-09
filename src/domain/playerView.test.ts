import { describe, it, expect } from 'vitest';
import {
  toPlayerLocations,
  toPlayerNpcs,
  toPlayerClues,
  toPlayerHandouts,
  stripSecrets,
} from './playerView';
import type { ClueEntity, HandoutEntity, LocationEntity, NpcEntity } from '@/db/schema';

function b() {
  return { createdAt: 't', updatedAt: 't', tags: [], notes: 'NOTA SECRETA DO MESTRE' };
}

const SECRET = 'SEGREDO_NAO_PODE_VAZAR';

const discoveredLoc: LocationEntity = {
  ...b(),
  id: 'l1',
  name: 'Praça',
  mapId: 'm1',
  geometry: { type: 'point', x: 1, y: 2 },
  kind: 'outro',
  baseDescription: `base ${SECRET}`,
  readAloud: {
    generico: `> Uma praça comum.\n\n:::segredo ${SECRET} por baixo da praça :::`,
    noite: `> ${SECRET} à noite`,
  },
  sensoryDetails: [SECRET],
  discovered: true,
  iconKey: 'map',
};
const hiddenLoc: LocationEntity = { ...discoveredLoc, id: 'l2', name: 'Cripta', discovered: false };

const knownNpc: NpcEntity = {
  ...b(),
  id: 'n1',
  name: 'Zelador',
  appearance: SECRET,
  voiceAndMannerisms: SECRET,
  typicalLines: [SECRET],
  factionIds: [],
  statBlock: { markdown: SECRET },
  schedule: [],
  status: 'vivo',
  isKnownToPlayers: true,
  layers: [{ plotId: 'p', knows: SECRET, hides: SECRET, revealsIfPressed: SECRET }],
};
const unknownNpc: NpcEntity = { ...knownNpc, id: 'n2', name: 'Cultista', isKnownToPlayers: false };

const discoveredClue: ClueEntity = {
  ...b(),
  id: 'c1',
  text: 'Uma pegada molhada.',
  plotIds: ['p'],
  howToObtain: { method: SECRET, difficulty: 'Dificil' },
  pointsToPlotIds: ['p'],
  isBridge: false,
  handoutIds: [],
  status: 'descoberta',
};
const hiddenClue: ClueEntity = { ...discoveredClue, id: 'c2', text: `pista oculta ${SECRET}`, status: 'nao-descoberta' };

const deliveredHandout: HandoutEntity = {
  ...b(),
  id: 'h1',
  title: 'Carta',
  textContent: `> Querido amigo…\n\n:::segredo ${SECRET} :::`,
  playerSafeCaption: 'Uma carta amarelada.',
  deliveries: [{ tableId: 'tbl1', deliveredAt: 't', note: SECRET }],
};
const undeliveredHandout: HandoutEntity = { ...deliveredHandout, id: 'h2', title: 'Bilhete', deliveries: [] };

/** Serialize every player projection to a single string for leak scanning. */
function allPlayerText(tableId: string | null): string {
  const parts = [
    ...toPlayerLocations([discoveredLoc, hiddenLoc]).map((l) => `${l.name} ${l.playerText}`),
    ...toPlayerNpcs([knownNpc, unknownNpc]).map((n) => n.name),
    ...toPlayerClues([discoveredClue, hiddenClue]).map((c) => c.text),
    ...toPlayerHandouts([deliveredHandout, undeliveredHandout], tableId).map(
      (h) => `${h.title} ${h.textContent ?? ''} ${h.playerSafeCaption}`,
    ),
  ];
  return parts.join(' | ');
}

describe('Player View allow-list (never leaks secrets)', () => {
  it('never contains any secret marker across all projections', () => {
    expect(allPlayerText('tbl1')).not.toContain(SECRET);
  });

  it('only exposes discovered locations', () => {
    const locs = toPlayerLocations([discoveredLoc, hiddenLoc]);
    expect(locs.map((l) => l.id)).toEqual(['l1']);
  });

  it('strips :::segredo::: blocks from location text', () => {
    const [loc] = toPlayerLocations([discoveredLoc]);
    expect(loc.playerText).toContain('praça comum');
    expect(loc.playerText).not.toContain(SECRET);
  });

  it('only exposes NPCs known to players, with name only', () => {
    const npcs = toPlayerNpcs([knownNpc, unknownNpc]);
    expect(npcs).toEqual([{ id: 'n1', name: 'Zelador' }]);
  });

  it('only exposes discovered clues', () => {
    const clues = toPlayerClues([discoveredClue, hiddenClue]);
    expect(clues.map((c) => c.id)).toEqual(['c1']);
  });

  it('only exposes handouts delivered to the active table', () => {
    expect(toPlayerHandouts([deliveredHandout, undeliveredHandout], 'tbl1').map((h) => h.id)).toEqual(['h1']);
    expect(toPlayerHandouts([deliveredHandout, undeliveredHandout], 'otherTable')).toHaveLength(0);
    expect(toPlayerHandouts([deliveredHandout, undeliveredHandout], null)).toHaveLength(0);
  });
});

describe('stripSecrets', () => {
  it('removes every keeper directive kind', () => {
    const t = 'ok :::segredo x ::: mid :::teste y ::: end :::sanidade 0/1d4 ::: fim';
    const out = stripSecrets(t);
    expect(out).toContain('ok');
    expect(out).toContain('fim');
    expect(out).not.toContain('segredo');
    expect(out).not.toContain('teste');
    expect(out).not.toContain('sanidade');
  });
});
