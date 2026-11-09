import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/database';
import { applyCityImport, applyScenarioImport, undoBatch, type ReconcileDecision } from './applyBatch';
import type { CityPackage, ScenarioPackage } from './packageSchema';
import { newBase } from '@/db/ids';
import type { MapEntity, NpcEntity } from '@/db/schema';

const map: MapEntity = { ...newBase(), name: 'Mapa', width: 100, height: 100 };

const cityPkg: CityPackage = {
  schemaVersion: 1,
  mode: 'cidade',
  label: 'Innsmouth cap. 1',
  locations: [
    { externalKey: 'armazem-enseada', name: 'Armazém da Enseada', kind: 'armazem' },
    { externalKey: 'taverna', name: 'Taverna Maré Mansa' },
  ],
  npcs: [{ externalKey: 'teobaldo', name: 'Teobaldo Marsh', appearance: 'velho pescador' }],
  factions: [{ externalKey: 'irmandade', name: 'Irmandade da Âncora Negra' }],
};

beforeEach(async () => {
  await Promise.all([
    db.maps.clear(), db.locations.clear(), db.npcs.clear(), db.factions.clear(),
    db.plots.clear(), db.clues.clear(), db.sceneCards.clear(), db.locationPlotLayers.clear(),
    db.importBatches.clear(),
  ]);
  await db.maps.put(map);
});

describe('applyCityImport (6.1)', () => {
  it('creates locations "sem pino" and marks pending', async () => {
    await applyCityImport(cityPkg, map.id);
    const locs = await db.locations.toArray();
    expect(locs).toHaveLength(2);
    const armazem = locs.find((l) => l.externalKey === 'armazem-enseada')!;
    expect(armazem.geometry).toEqual({ type: 'point', x: -1, y: -1 }); // off-canvas = sem pino
    expect(armazem.pending).toContain('pino');
  });

  it('is idempotent by externalKey (updates, does not duplicate)', async () => {
    await applyCityImport(cityPkg, map.id);
    await applyCityImport({ ...cityPkg, locations: [{ ...cityPkg.locations[0], name: 'Armazém (revisado)' }, cityPkg.locations[1]] }, map.id);
    const locs = await db.locations.toArray();
    expect(locs).toHaveLength(2); // not 4
    expect(locs.find((l) => l.externalKey === 'armazem-enseada')!.name).toBe('Armazém (revisado)');
  });

  it('can undo the whole batch', async () => {
    const batch = await applyCityImport(cityPkg, map.id);
    expect(await db.locations.count()).toBe(2);
    await undoBatch(batch.id);
    expect(await db.locations.count()).toBe(0);
    expect(await db.npcs.count()).toBe(0);
    expect((await db.importBatches.get(batch.id))?.status).toBe('undone');
  });
});

describe('applyScenarioImport (6.1 reconciliation)', () => {
  const scenario: ScenarioPackage = {
    schemaVersion: 1,
    mode: 'cenario',
    label: 'A Maré que Lembra',
    plot: {
      externalKey: 'mare',
      name: 'A Maré que Lembra',
      conclusions: [{ externalKey: 'con1', title: 'Descobrir o pacto', description: '' }],
    },
    clues: [
      { externalKey: 'clue-marcas', text: 'Marcas de maré alta', locationRef: 'Armazém da Enseada', revealsConclusion: 'con1' },
      { externalKey: 'clue-alias', text: 'Pista por alias', locationRef: 'Galpão do Cais' },
      { externalKey: 'clue-ghost', text: 'Pista sem local', locationRef: 'Lugar Inexistente' },
    ],
    scenes: [],
    locationLayers: [{ locationRef: 'Armazém da Enseada', whatChanges: 'círculo de giz' }],
    npcLayers: [{ npcRef: 'Teobaldo Marsh', knows: 'quem foi convidado', hides: 'que ele escolhe' }],
  };

  it('wires clues/layers to matched city entities and leaves nonexistent unresolved', async () => {
    await applyCityImport(cityPkg, map.id);
    const armazem = await db.locations.where('externalKey').equals('armazem-enseada').first();
    const teobaldo = await db.npcs.where('externalKey').equals('teobaldo').first();

    const decisions = new Map<string, ReconcileDecision>([
      ['Armazém da Enseada', { ref: 'Armazém da Enseada', action: 'match', targetId: armazem!.id }],
      ['Galpão do Cais', { ref: 'Galpão do Cais', action: 'map', targetId: armazem!.id }], // move the stage
      ['Lugar Inexistente', { ref: 'Lugar Inexistente', action: 'ignore' }],
      ['Teobaldo Marsh', { ref: 'Teobaldo Marsh', action: 'merge', targetId: teobaldo!.id }],
    ]);

    await applyScenarioImport(scenario, decisions);

    const clues = await db.clues.toArray();
    const marcas = clues.find((c) => c.text === 'Marcas de maré alta')!;
    const aliasClue = clues.find((c) => c.text === 'Pista por alias')!;
    const ghost = clues.find((c) => c.text === 'Pista sem local')!;
    expect(marcas.locationId).toBe(armazem!.id);
    expect(aliasClue.locationId).toBe(armazem!.id);
    expect(ghost.locationId).toBeUndefined();

    // "map" stored the original name as an alias on the target location.
    const updatedArmazem = await db.locations.get(armazem!.id);
    expect(updatedArmazem?.aliases).toContain('Galpão do Cais');

    // Location layer wired to the plot.
    const layers = await db.locationPlotLayers.toArray();
    expect(layers).toHaveLength(1);
    expect(layers[0].locationId).toBe(armazem!.id);
  });

  it('merges an NPC preserving its existing sheet and adding the layer', async () => {
    await applyCityImport(cityPkg, map.id);
    const teobaldo = (await db.npcs.where('externalKey').equals('teobaldo').first())!;
    // Give the city NPC a stat block to prove it survives the merge.
    await db.npcs.update(teobaldo.id, { statBlock: { markdown: 'FICHA ORIGINAL', FOR: 65 } });

    const decisions = new Map<string, ReconcileDecision>([
      ['Teobaldo Marsh', { ref: 'Teobaldo Marsh', action: 'merge', targetId: teobaldo.id }],
    ]);
    await applyScenarioImport({ ...scenario, clues: [], locationLayers: [] }, decisions);

    const merged = (await db.npcs.get(teobaldo.id)) as NpcEntity;
    expect(merged.statBlock.markdown).toBe('FICHA ORIGINAL'); // sheet preserved
    expect(merged.statBlock.FOR).toBe(65);
    expect(merged.layers.some((l) => l.knows === 'quem foi convidado')).toBe(true); // layer added
  });

  it('scenario import is idempotent (re-import updates, no duplicate plot/clues)', async () => {
    await applyCityImport(cityPkg, map.id);
    const armazem = (await db.locations.where('externalKey').equals('armazem-enseada').first())!;
    const decisions = new Map<string, ReconcileDecision>([
      ['Armazém da Enseada', { ref: 'Armazém da Enseada', action: 'match', targetId: armazem.id }],
      ['Galpão do Cais', { ref: 'Galpão do Cais', action: 'ignore' }],
      ['Lugar Inexistente', { ref: 'Lugar Inexistente', action: 'ignore' }],
      ['Teobaldo Marsh', { ref: 'Teobaldo Marsh', action: 'ignore' }],
    ]);
    await applyScenarioImport(scenario, decisions);
    await applyScenarioImport(scenario, decisions);
    expect(await db.plots.count()).toBe(1);
    // 3 clues defined, each unique by externalKey -> still 3.
    expect(await db.clues.count()).toBe(3);
  });
});
