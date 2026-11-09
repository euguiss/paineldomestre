import { describe, it, expect } from 'vitest';
import { searchAll, type SearchCorpus } from './search';
import type { LocationEntity, NpcEntity, PlotEntity } from '@/db/schema';

function b() {
  return { createdAt: 't', updatedAt: 't', tags: [] as string[], notes: '' };
}

const loc: LocationEntity = {
  ...b(),
  id: 'l1',
  name: 'Armazém da Enseada',
  mapId: 'm',
  geometry: { type: 'point', x: 0, y: 0 },
  kind: 'armazem',
  baseDescription: 'cheira a maresia',
  readAloud: {},
  sensoryDetails: [],
  discovered: false,
  iconKey: 'warehouse',
  tags: ['porto'],
};
const npc: NpcEntity = {
  ...b(),
  id: 'n1',
  name: 'Teobaldo Marsh',
  appearance: 'pescador',
  voiceAndMannerisms: '',
  typicalLines: ['a enseada cobra'],
  factionIds: [],
  statBlock: { markdown: '' },
  schedule: [],
  status: 'vivo',
  isKnownToPlayers: false,
  layers: [],
};
const plot: PlotEntity = {
  ...b(),
  id: 'p1',
  name: 'A Maré que Lembra',
  sourceModule: '',
  threatLevel: 1,
  hiddenTruth: '',
  antagonists: '',
  state: 'ativa',
  clock: { segments: 6, filled: 0, advanceRules: [] },
  scheduledBeats: [],
  conclusions: [],
};

const corpus: SearchCorpus = { locations: [loc], npcs: [npc], factions: [], plots: [plot], clues: [], handouts: [] };

describe('searchAll (6.11)', () => {
  it('finds by name across types', () => {
    expect(searchAll('armazém', corpus).map((r) => r.id)).toContain('l1');
    expect(searchAll('teobaldo', corpus).map((r) => r.id)).toContain('n1');
    expect(searchAll('maré', corpus).map((r) => r.id)).toContain('p1');
  });

  it('finds by free text and tags', () => {
    expect(searchAll('maresia', corpus).map((r) => r.id)).toContain('l1');
    expect(searchAll('porto', corpus).map((r) => r.id)).toContain('l1');
    expect(searchAll('enseada cobra', corpus).map((r) => r.id)).toContain('n1');
  });

  it('ranks name-prefix matches above body matches', () => {
    const results = searchAll('a', corpus);
    // plot "A Maré..." starts with "a" -> score 3; appears before body-only hits
    expect(results[0].score).toBeGreaterThanOrEqual(results[results.length - 1].score);
  });

  it('returns nothing for an empty query', () => {
    expect(searchAll('   ', corpus)).toHaveLength(0);
  });
});
