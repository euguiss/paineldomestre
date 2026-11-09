import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/database';
import { applyEffect, applyEffects, recordEvent } from './effects';
import type { ClueEntity, HandoutEntity, NpcEntity, PlotEntity, LocationEntity, SceneCardEntity } from '@/db/schema';

function b() {
  return { createdAt: 't', updatedAt: 't', tags: [], notes: '' };
}

const plot: PlotEntity = {
  ...b(),
  id: 'p1',
  name: 'Trama',
  sourceModule: '',
  threatLevel: 1,
  hiddenTruth: '',
  antagonists: '',
  state: 'dormente',
  clock: { segments: 6, filled: 1, advanceRules: [] },
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
  status: 'nao-descoberta',
};
const npc: NpcEntity = {
  ...b(),
  id: 'n1',
  name: 'NPC',
  appearance: '',
  voiceAndMannerisms: '',
  typicalLines: [],
  factionIds: [],
  statBlock: { markdown: '' },
  schedule: [],
  status: 'vivo',
  isKnownToPlayers: false,
  layers: [],
};
const loc: LocationEntity = {
  ...b(),
  id: 'l1',
  name: 'Local',
  mapId: 'm1',
  geometry: { type: 'point', x: 0, y: 0 },
  kind: 'casa',
  baseDescription: '',
  readAloud: {},
  sensoryDetails: [],
  discovered: false,
  iconKey: 'house',
};
const handout: HandoutEntity = {
  ...b(),
  id: 'h1',
  title: 'Handout',
  textContent: 'x',
  deliveries: [],
  playerSafeCaption: '',
};
const scene: SceneCardEntity = {
  ...b(),
  id: 's1',
  title: 'Cena',
  plotId: 'p1',
  trigger: '',
  openingText: '',
  whatHappens: '',
  outcomes: [],
  repeatable: false,
  used: false,
};

beforeEach(async () => {
  await Promise.all([
    db.plots.clear(),
    db.clues.clear(),
    db.npcs.clear(),
    db.locations.clear(),
    db.handouts.clear(),
    db.sceneCards.clear(),
    db.events.clear(),
  ]);
  await db.plots.put({ ...plot });
  await db.clues.put({ ...clue });
  await db.npcs.put({ ...npc });
  await db.locations.put({ ...loc });
  await db.handouts.put({ ...handout });
  await db.sceneCards.put({ ...scene });
});

describe('applyEffect', () => {
  it('setClueStatus', async () => {
    await applyEffect({ type: 'setClueStatus', clueId: 'c1', status: 'descoberta' });
    expect((await db.clues.get('c1'))?.status).toBe('descoberta');
  });

  it('setNpcStatus', async () => {
    await applyEffect({ type: 'setNpcStatus', npcId: 'n1', status: 'morto' });
    expect((await db.npcs.get('n1'))?.status).toBe('morto');
  });

  it('advanceClock clamps to segment count', async () => {
    await applyEffect({ type: 'advanceClock', plotId: 'p1', by: 10 });
    expect((await db.plots.get('p1'))?.clock.filled).toBe(6);
  });

  it('advanceClock can go down and not below zero', async () => {
    await applyEffect({ type: 'advanceClock', plotId: 'p1', by: -5 });
    expect((await db.plots.get('p1'))?.clock.filled).toBe(0);
  });

  it('setPlotState', async () => {
    await applyEffect({ type: 'setPlotState', plotId: 'p1', state: 'ativa' });
    expect((await db.plots.get('p1'))?.state).toBe('ativa');
  });

  it('markLocationDiscovered', async () => {
    await applyEffect({ type: 'markLocationDiscovered', locationId: 'l1' });
    expect((await db.locations.get('l1'))?.discovered).toBe(true);
  });

  it('markHandoutDelivered records a delivery for the table', async () => {
    await applyEffect({ type: 'markHandoutDelivered', handoutId: 'h1', tableId: 'tbl1' });
    const h = await db.handouts.get('h1');
    expect(h?.deliveries).toHaveLength(1);
    expect(h?.deliveries[0].tableId).toBe('tbl1');
  });

  it('markSceneUsed', async () => {
    await applyEffect({ type: 'markSceneUsed', sceneCardId: 's1' });
    expect((await db.sceneCards.get('s1'))?.used).toBe(true);
  });

  it('moveNpc adds a schedule entry pointing at the location', async () => {
    await applyEffect({ type: 'moveNpc', npcId: 'n1', locationId: 'l1' });
    const n = await db.npcs.get('n1');
    expect(n?.schedule.some((s) => s.locationId === 'l1')).toBe(true);
  });
});

describe('applyEffects + recordEvent (5.7)', () => {
  it('applies all effects in order', async () => {
    await applyEffects([
      { type: 'setClueStatus', clueId: 'c1', status: 'descoberta' },
      { type: 'setPlotState', plotId: 'p1', state: 'ativa' },
    ]);
    expect((await db.clues.get('c1'))?.status).toBe('descoberta');
    expect((await db.plots.get('p1'))?.state).toBe('ativa');
  });

  it('recordEvent applies effects and writes a journal event with table + date', async () => {
    const ev = await recordEvent({
      type: 'descoberta',
      text: 'Pista encontrada',
      inGameDate: '14 de setembro de 1925',
      tableId: 'tbl1',
      linkedEntityIds: ['c1', 'l1'],
      effects: [{ type: 'setClueStatus', clueId: 'c1', status: 'descoberta' }],
    });

    expect((await db.clues.get('c1'))?.status).toBe('descoberta');
    const stored = await db.events.get(ev.id);
    expect(stored?.tableId).toBe('tbl1');
    expect(stored?.inGameDate).toBe('14 de setembro de 1925');
    expect(stored?.type).toBe('descoberta');
    expect(stored?.effectsApplied).toHaveLength(1);
    expect(stored?.linkedEntityIds).toContain('c1');
  });
});
