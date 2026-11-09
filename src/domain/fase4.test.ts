import { describe, it, expect } from 'vitest';
import { computeConclusionCoverage, underCoveredConclusions } from './threeCluesRule';
import { suggestBeatsForAdvance, clampedFilled } from './clocks';
import { consistencyWarningsForEntity } from './consistency';
import type {
  ClueEntity,
  EventEntity,
  InvestigatorEntity,
  PlotEntity,
  TableEntity,
} from '@/db/schema';

function b() {
  return { createdAt: 't', updatedAt: 't', tags: [], notes: '' };
}

function makePlot(over: Partial<PlotEntity>): PlotEntity {
  return {
    ...b(),
    id: 'p',
    name: 'Trama',
    sourceModule: '',
    threatLevel: 1,
    hiddenTruth: '',
    antagonists: '',
    state: 'ativa',
    clock: { segments: 6, filled: 0, advanceRules: [] },
    scheduledBeats: [],
    conclusions: [],
    ...over,
  };
}

function makeClue(over: Partial<ClueEntity>): ClueEntity {
  return {
    ...b(),
    id: 'c',
    text: 'pista',
    plotIds: ['p'],
    howToObtain: { method: '' },
    pointsToPlotIds: [],
    isBridge: false,
    handoutIds: [],
    status: 'nao-descoberta',
    ...over,
  };
}

describe('threeCluesRule (5.5)', () => {
  const plot = makePlot({
    id: 'p1',
    conclusions: [
      { id: 'con1', title: 'C1', description: '' },
      { id: 'con2', title: 'C2', description: '' },
    ],
  });

  it('flags conclusions with fewer than 3 available clues', () => {
    const clues = [
      makeClue({ id: 'a', revealsConclusionId: 'con1' }),
      makeClue({ id: 'b', revealsConclusionId: 'con1' }),
      // con1 has 2 available -> under-covered
      makeClue({ id: 'd', revealsConclusionId: 'con2' }),
      makeClue({ id: 'e', revealsConclusionId: 'con2' }),
      makeClue({ id: 'f', revealsConclusionId: 'con2' }),
      // con2 has 3 available -> ok
    ];
    const coverage = computeConclusionCoverage([plot], clues);
    const c1 = coverage.find((c) => c.conclusion.id === 'con1')!;
    const c2 = coverage.find((c) => c.conclusion.id === 'con2')!;
    expect(c1.availableClueCount).toBe(2);
    expect(c1.isUnderCovered).toBe(true);
    expect(c2.availableClueCount).toBe(3);
    expect(c2.isUnderCovered).toBe(false);
  });

  it('does not count discovered clues toward coverage', () => {
    const clues = [
      makeClue({ id: 'a', revealsConclusionId: 'con1', status: 'descoberta' }),
      makeClue({ id: 'b', revealsConclusionId: 'con1' }),
      makeClue({ id: 'c', revealsConclusionId: 'con1' }),
      makeClue({ id: 'd', revealsConclusionId: 'con1' }),
    ];
    const coverage = computeConclusionCoverage([plot], clues);
    const c1 = coverage.find((c) => c.conclusion.id === 'con1')!;
    expect(c1.availableClueCount).toBe(3); // discovered 'a' excluded
    expect(underCoveredConclusions([plot], clues).some((c) => c.conclusion.id === 'con1')).toBe(false);
  });
});

describe('clocks / suggestBeatsForAdvance (5.4)', () => {
  const plot = makePlot({
    id: 'p1',
    name: 'Trama X',
    clock: { segments: 6, filled: 1, advanceRules: [] },
    scheduledBeats: [
      { atSegment: 3, title: 'Beat 3', description: '', effects: [] },
      { atSegment: 6, title: 'Beat 6', description: '', effects: [] },
    ],
  });

  it('suggests beats whose segment is newly crossed', () => {
    const suggested = suggestBeatsForAdvance([plot], [{ plotId: 'p1', by: 2 }]);
    // from 1 -> 3, crosses segment 3
    expect(suggested.map((s) => s.beat.title)).toEqual(['Beat 3']);
  });

  it('suggests multiple beats when the advance crosses several', () => {
    const suggested = suggestBeatsForAdvance([plot], [{ plotId: 'p1', by: 10 }]);
    expect(suggested.map((s) => s.beat.title)).toEqual(['Beat 3', 'Beat 6']);
  });

  it('does not re-suggest already-passed beats', () => {
    const passed = makePlot({ ...plot, clock: { segments: 6, filled: 3, advanceRules: [] } });
    const suggested = suggestBeatsForAdvance([passed], [{ plotId: 'p1', by: 1 }]);
    // from 3 -> 4, no beat at 4
    expect(suggested).toHaveLength(0);
  });

  it('clampedFilled stays within [0, segments]', () => {
    expect(clampedFilled(plot, 100)).toBe(6);
    expect(clampedFilled(plot, -100)).toBe(0);
  });
});

describe('consistency across tables (5.6)', () => {
  const tableA: TableEntity = { ...b(), id: 'tA', name: 'Mesa A', players: [], inGameDate: '' };
  const tableB: TableEntity = { ...b(), id: 'tB', name: 'Mesa B', players: [], inGameDate: '' };

  const invA: InvestigatorEntity = {
    ...b(),
    id: 'iA',
    name: 'Inv A',
    playerName: '',
    tableId: 'tA',
    concept: '',
    occupation: '',
    age: 30,
    characteristics: { FOR: 50, CON: 50, TAM: 50, DES: 50, APA: 50, INT: 50, POD: 50, EDU: 50 },
    derived: { PV: 10, PM: 10, SAN: 50, Sorte: 50, Movimento: 8, Corpo: '0', BonusDeDano: 'Nenhum' },
    skills: [],
    backstory: '',
    equipment: '',
    hook: '',
    links: [{ targetType: 'npc', targetId: 'npc1', note: '' }],
    status: 'ativo',
    masterNotes: '',
  };
  const invB: InvestigatorEntity = { ...invA, id: 'iB', tableId: 'tB', links: [{ targetType: 'npc', targetId: 'npc1', note: '' }] };

  const deathAtB: EventEntity = {
    ...b(),
    id: 'ev',
    inGameDate: '',
    tableId: 'tB',
    type: 'morte',
    text: 'NPC X morreu.',
    linkedEntityIds: ['npc1'],
    effectsApplied: [],
  };

  it('warns the table that did not cause the change', () => {
    const warnings = consistencyWarningsForEntity({
      tables: [tableA, tableB],
      investigators: [invA, invB],
      events: [deathAtB],
      entityId: 'npc1',
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].tableId).toBe('tA');
    expect(warnings[0].message).toContain('morreu');
  });

  it('produces no warnings when no change event exists', () => {
    const warnings = consistencyWarningsForEntity({
      tables: [tableA, tableB],
      investigators: [invA, invB],
      events: [],
      entityId: 'npc1',
    });
    expect(warnings).toHaveLength(0);
  });
});
