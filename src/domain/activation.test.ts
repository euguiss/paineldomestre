import { describe, it, expect } from 'vitest';
import { evaluateCondition, type ActivationWorld } from './activation';
import { describeCondition, type NameLookup } from './describeCondition';
import type { ActivationCondition, ClueEntity, LocationEntity, NpcEntity, PlotEntity } from '@/db/schema';

function b() {
  return { createdAt: 't', updatedAt: 't', tags: [], notes: '' };
}

const plot: PlotEntity = {
  ...b(),
  id: 'p1',
  name: 'Trama X',
  sourceModule: '',
  threatLevel: 1,
  hiddenTruth: '',
  antagonists: '',
  state: 'ativa',
  clock: { segments: 6, filled: 3, advanceRules: [] },
  scheduledBeats: [],
  conclusions: [],
};
const clue: ClueEntity = {
  ...b(),
  id: 'c1',
  text: 'pista',
  plotIds: ['p1'],
  howToObtain: { method: '' },
  pointsToPlotIds: [],
  isBridge: false,
  handoutIds: [],
  status: 'descoberta',
};
const npc: NpcEntity = {
  ...b(),
  id: 'n1',
  name: 'Fulano',
  appearance: '',
  voiceAndMannerisms: '',
  typicalLines: [],
  factionIds: [],
  statBlock: { markdown: '' },
  schedule: [],
  status: 'morto',
  isKnownToPlayers: false,
  layers: [],
};
const loc: LocationEntity = {
  ...b(),
  id: 'l1',
  name: 'Lugar',
  mapId: 'm',
  geometry: { type: 'point', x: 0, y: 0 },
  kind: 'casa',
  baseDescription: '',
  readAloud: {},
  sensoryDetails: [],
  discovered: true,
  iconKey: 'house',
};

const world: ActivationWorld = {
  plots: new Map([[plot.id, plot]]),
  clues: new Map([[clue.id, clue]]),
  npcs: new Map([[npc.id, npc]]),
  locations: new Map([[loc.id, loc]]),
};

describe('evaluateCondition (5.2)', () => {
  it('always is true', () => {
    expect(evaluateCondition({ kind: 'always' }, world)).toBe(true);
  });

  it('plotState is / isNot', () => {
    expect(evaluateCondition({ kind: 'plotState', plotId: 'p1', op: 'is', value: 'ativa' }, world)).toBe(true);
    expect(evaluateCondition({ kind: 'plotState', plotId: 'p1', op: 'isNot', value: 'dormente' }, world)).toBe(true);
    expect(evaluateCondition({ kind: 'plotState', plotId: 'p1', op: 'is', value: 'dormente' }, world)).toBe(false);
  });

  it('plotClockFilled >= N', () => {
    expect(evaluateCondition({ kind: 'plotClockFilled', plotId: 'p1', op: 'gte', value: 3 }, world)).toBe(true);
    expect(evaluateCondition({ kind: 'plotClockFilled', plotId: 'p1', op: 'gte', value: 4 }, world)).toBe(false);
  });

  it('clue / npc status and location discovered', () => {
    expect(evaluateCondition({ kind: 'clueStatus', clueId: 'c1', op: 'is', value: 'descoberta' }, world)).toBe(true);
    expect(evaluateCondition({ kind: 'npcStatus', npcId: 'n1', op: 'is', value: 'morto' }, world)).toBe(true);
    expect(evaluateCondition({ kind: 'locationDiscovered', locationId: 'l1', value: true }, world)).toBe(true);
  });

  it('AND requires all; OR requires any', () => {
    const and: ActivationCondition = {
      kind: 'all',
      conditions: [
        { kind: 'plotState', plotId: 'p1', op: 'is', value: 'ativa' },
        { kind: 'clueStatus', clueId: 'c1', op: 'is', value: 'descoberta' },
      ],
    };
    expect(evaluateCondition(and, world)).toBe(true);

    const or: ActivationCondition = {
      kind: 'any',
      conditions: [
        { kind: 'plotState', plotId: 'p1', op: 'is', value: 'dormente' },
        { kind: 'npcStatus', npcId: 'n1', op: 'is', value: 'morto' },
      ],
    };
    expect(evaluateCondition(or, world)).toBe(true);
  });

  it('fails closed when a referenced entity is missing', () => {
    expect(evaluateCondition({ kind: 'plotState', plotId: 'ghost', op: 'is', value: 'ativa' }, world)).toBe(false);
    expect(evaluateCondition({ kind: 'npcStatus', npcId: 'ghost', op: 'is', value: 'morto' }, world)).toBe(false);
  });
});

const names: NameLookup = {
  plotName: (id) => (id === 'p1' ? 'Trama X' : id),
  clueText: (id) => (id === 'c1' ? 'pista' : id),
  npcName: (id) => (id === 'n1' ? 'Fulano' : id),
  locationName: (id) => (id === 'l1' ? 'Lugar' : id),
};

describe('describeCondition (5.2)', () => {
  it('describes leaves in pt-BR', () => {
    expect(describeCondition({ kind: 'plotState', plotId: 'p1', op: 'is', value: 'ativa' }, names)).toBe(
      'trama "Trama X" é ativa',
    );
    expect(describeCondition({ kind: 'plotClockFilled', plotId: 'p1', op: 'gte', value: 3 }, names)).toContain('≥ 3');
    expect(describeCondition({ kind: 'locationDiscovered', locationId: 'l1', value: false }, names)).toContain(
      'não descoberto',
    );
  });

  it('joins groups with E / OU and parenthesises nesting', () => {
    const cond: ActivationCondition = {
      kind: 'all',
      conditions: [
        { kind: 'plotState', plotId: 'p1', op: 'is', value: 'ativa' },
        {
          kind: 'any',
          conditions: [
            { kind: 'npcStatus', npcId: 'n1', op: 'is', value: 'morto' },
            { kind: 'clueStatus', clueId: 'c1', op: 'is', value: 'descoberta' },
          ],
        },
      ],
    };
    const text = describeCondition(cond, names);
    expect(text).toContain(' E ');
    expect(text).toContain(' OU ');
    expect(text).toContain('(');
  });
});
