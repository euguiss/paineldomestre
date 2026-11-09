import { describe, it, expect } from 'vitest';
import { buildGraph, buildCrossMatrix, type GraphInput } from './graph';
import type { ClueEntity, FactionEntity, LocationEntity, LocationPlotLayer, NpcEntity, PlotEntity } from '@/db/schema';

function b() {
  return { createdAt: 't', updatedAt: 't', tags: [], notes: '' };
}

const plotA: PlotEntity = { ...b(), id: 'pA', name: 'Trama A', sourceModule: '', threatLevel: 1, hiddenTruth: '', antagonists: '', state: 'ativa', clock: { segments: 6, filled: 0, advanceRules: [] }, scheduledBeats: [], conclusions: [] };
const plotB: PlotEntity = { ...plotA, id: 'pB', name: 'Trama B' };

const npcDouble: NpcEntity = {
  ...b(), id: 'n1', name: 'Duplo', appearance: '', voiceAndMannerisms: '', typicalLines: [], factionIds: [],
  statBlock: { markdown: '' }, schedule: [], status: 'vivo', isKnownToPlayers: false,
  layers: [
    { plotId: 'pA', knows: '', hides: '', revealsIfPressed: '' },
    { plotId: 'pB', knows: '', hides: '', revealsIfPressed: '' },
  ],
};
const npcSingle: NpcEntity = { ...npcDouble, id: 'n2', name: 'Simples', layers: [{ plotId: 'pA', knows: '', hides: '', revealsIfPressed: '' }] };

const loc: LocationEntity = { ...b(), id: 'l1', name: 'Armazém', mapId: 'm', geometry: { type: 'point', x: 0, y: 0 }, kind: 'armazem', baseDescription: '', readAloud: {}, sensoryDetails: [], discovered: false, iconKey: 'warehouse' };

const bridgeClue: ClueEntity = { ...b(), id: 'c1', text: 'ponte', plotIds: ['pA', 'pB'], howToObtain: { method: '' }, pointsToPlotIds: [], isBridge: true, handoutIds: [], status: 'nao-descoberta' };

const layerA: LocationPlotLayer = { ...b(), id: 'la', locationId: 'l1', plotId: 'pA', whatChanges: '', cluesHere: [], sceneCardIds: [], activationCondition: { kind: 'always' } };
const layerB: LocationPlotLayer = { ...b(), id: 'lb', locationId: 'l1', plotId: 'pB', whatChanges: '', cluesHere: [], sceneCardIds: [], activationCondition: { kind: 'always' } };

const faction: FactionEntity = { ...b(), id: 'f1', name: 'Facção', goals: '', resources: '', memberNpcIds: ['n1'], locationIds: [], layers: [{ plotId: 'pA', whatChanges: '' }] };

const input: GraphInput = {
  plots: [plotA, plotB],
  npcs: [npcDouble, npcSingle],
  locations: [loc],
  factions: [faction],
  clues: [bridgeClue],
  locationPlotLayers: [layerA, layerB],
};

describe('buildGraph (6.8)', () => {
  it('marks an entity in 2+ plots as a crossing node', () => {
    const g = buildGraph(input);
    const n1 = g.nodes.find((n) => n.id === 'n1')!;
    const n2 = g.nodes.find((n) => n.id === 'n2')!;
    expect(n1.isCrossing).toBe(true);
    expect(n1.plotCount).toBe(2);
    expect(n2.isCrossing).toBe(false);
  });

  it('creates a bridge edge between the two plots', () => {
    const g = buildGraph(input);
    expect(g.edges.some((e) => e.kind === 'pista-ponte' && e.source === 'pA' && e.target === 'pB')).toBe(true);
  });

  it('the shared location touches both plots', () => {
    const g = buildGraph(input);
    const locNode = g.nodes.find((n) => n.id === 'l1')!;
    expect(locNode.plotCount).toBe(2);
    expect(locNode.isCrossing).toBe(true);
  });
});

describe('buildCrossMatrix (6.8)', () => {
  it('shows an NPC in two plots on two columns, sorted by plotCount', () => {
    const m = buildCrossMatrix(input);
    const row = m.rows.find((r) => r.id === 'n1')!;
    expect(row.cells['pA']).toBe(true);
    expect(row.cells['pB']).toBe(true);
    expect(row.plotCount).toBe(2);
    // crossing rows come first
    expect(m.rows[0].plotCount).toBeGreaterThanOrEqual(m.rows[m.rows.length - 1].plotCount);
  });

  it('omits entities that touch no plot', () => {
    const m = buildCrossMatrix(input);
    expect(m.rows.every((r) => r.plotCount > 0)).toBe(true);
  });
});
