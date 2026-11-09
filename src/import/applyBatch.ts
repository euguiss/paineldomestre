import { db } from '@/db/database';
import { newBase, newId, now } from '@/db/ids';
import type {
  CityPackage,
  ScenarioPackage,
} from './packageSchema';
import type {
  LocationEntity,
  NpcEntity,
  FactionEntity,
  PlotEntity,
  ClueEntity,
  SceneCardEntity,
  LocationPlotLayer,
  ImportBatchEntity,
  StoreName,
  LocationKind,
  CocDifficulty,
} from '@/db/schema';

/** A user's reconciliation decision for a single scenario reference. */
export interface ReconcileDecision {
  ref: string;
  action: 'match' | 'map' | 'merge' | 'create' | 'ignore';
  /** For match/map/merge: the existing entity id to use. */
  targetId?: string;
}

export interface CityImportPreview {
  toCreate: number;
  toUpdate: number;
  items: Array<{ kind: string; name: string; action: 'criar' | 'atualizar'; externalKey: string }>;
}

/** Preview city import: which entities will be created vs updated (by externalKey). */
export async function previewCityImport(pkg: CityPackage): Promise<CityImportPreview> {
  const items: CityImportPreview['items'] = [];
  let toCreate = 0;
  let toUpdate = 0;

  const check = async (kind: string, name: string, externalKey: string, store: 'locations' | 'npcs' | 'factions') => {
    const existing = await db[store].where('externalKey').equals(externalKey).first();
    const action = existing ? 'atualizar' : 'criar';
    if (existing) toUpdate += 1;
    else toCreate += 1;
    items.push({ kind, name, action, externalKey });
  };

  for (const l of pkg.locations) await check('local', l.name, l.externalKey, 'locations');
  for (const n of pkg.npcs) await check('npc', n.name, n.externalKey, 'npcs');
  for (const f of pkg.factions) await check('facção', f.name, f.externalKey, 'factions');

  return { toCreate, toUpdate, items };
}

/**
 * Apply a City package (section 6.1). Creates/updates Locations, NPCs and
 * Factions keyed by `externalKey` (idempotent). Locations without coordinates
 * go to a "sem pino" list (geometry flagged, pending includes 'pino'). Records
 * an ImportBatch with created ids + a snapshot of updated records for undo.
 */
export async function applyCityImport(pkg: CityPackage, mapId: string): Promise<ImportBatchEntity> {
  const batchId = newId();
  const createdIds: ImportBatchEntity['createdIds'] = [];
  const snapshotOfUpdated: ImportBatchEntity['snapshotOfUpdated'] = [];

  const recordUpdate = (store: StoreName, before: unknown) => snapshotOfUpdated.push({ table: store, id: (before as { id: string }).id, before });
  const recordCreate = (store: StoreName, id: string) => createdIds.push({ table: store, id });

  await db.transaction('rw', [db.locations, db.npcs, db.factions, db.importBatches], async () => {
    for (const l of pkg.locations) {
      const existing = await db.locations.where('externalKey').equals(l.externalKey).first();
      const hasPin = false; // city packages never carry coordinates
      const pending = [...(l.pending ?? [])];
      if (!hasPin && !pending.includes('pino')) pending.push('pino');
      if (!l.readAloud?.generico && !pending.includes('leitura')) pending.push('leitura');

      if (existing) {
        recordUpdate('locations', structuredClone(existing));
        await db.locations.update(existing.id, {
          name: l.name,
          aliases: l.aliases ?? existing.aliases,
          kind: (l.kind as LocationKind) ?? existing.kind,
          district: l.district ?? existing.district,
          baseDescription: l.baseDescription ?? existing.baseDescription,
          readAloud: { ...existing.readAloud, ...(l.readAloud ?? {}) },
          sensoryDetails: l.sensoryDetails ?? existing.sensoryDetails,
          pending,
          generatedByAI: l.geradoPorIA,
          source: l.source ? { batchId, label: l.source.label, pageRef: l.source.pageRef } : existing.source,
          updatedAt: now(),
        });
      } else {
        const loc: LocationEntity = {
          ...newBase(),
          name: l.name,
          mapId,
          // No coordinates: placed off-canvas; the Keeper drags it onto the map.
          geometry: { type: 'point', x: -1, y: -1 },
          kind: (l.kind as LocationKind) ?? 'outro',
          district: l.district,
          baseDescription: l.baseDescription ?? '',
          readAloud: l.readAloud ?? {},
          sensoryDetails: l.sensoryDetails ?? [],
          discovered: false,
          iconKey: 'map',
          externalKey: l.externalKey,
          aliases: l.aliases,
          pending,
          generatedByAI: l.geradoPorIA,
          source: l.source ? { batchId, label: l.source.label, pageRef: l.source.pageRef } : undefined,
        };
        await db.locations.put(loc);
        recordCreate('locations', loc.id);
      }
    }

    for (const n of pkg.npcs) {
      const existing = await db.npcs.where('externalKey').equals(n.externalKey).first();
      const pending = [...(n.pending ?? [])];
      if (pending.length === 0) pending.push('agenda');
      if (existing) {
        recordUpdate('npcs', structuredClone(existing));
        await db.npcs.update(existing.id, {
          name: n.name,
          aliases: n.aliases ?? existing.aliases,
          appearance: n.appearance ?? existing.appearance,
          voiceAndMannerisms: n.voiceAndMannerisms ?? existing.voiceAndMannerisms,
          statBlock: { ...existing.statBlock, markdown: n.statBlockMarkdown ?? existing.statBlock.markdown },
          source: n.source ? { batchId, label: n.source.label, pageRef: n.source.pageRef } : existing.source,
          updatedAt: now(),
        });
      } else {
        const npc: NpcEntity = {
          ...newBase(),
          name: n.name,
          appearance: n.appearance ?? '',
          voiceAndMannerisms: n.voiceAndMannerisms ?? '',
          typicalLines: [],
          factionIds: [],
          statBlock: { markdown: n.statBlockMarkdown ?? '' },
          schedule: [],
          status: 'vivo',
          isKnownToPlayers: false,
          layers: [],
          externalKey: n.externalKey,
          aliases: n.aliases,
          pending,
          generatedByAI: n.geradoPorIA,
          source: n.source ? { batchId, label: n.source.label, pageRef: n.source.pageRef } : undefined,
        };
        await db.npcs.put(npc);
        recordCreate('npcs', npc.id);
      }
    }

    for (const f of pkg.factions) {
      const existing = await db.factions.where('externalKey').equals(f.externalKey).first();
      if (existing) {
        recordUpdate('factions', structuredClone(existing));
        await db.factions.update(existing.id, {
          name: f.name,
          aliases: f.aliases ?? existing.aliases,
          goals: f.goals ?? existing.goals,
          resources: f.resources ?? existing.resources,
          updatedAt: now(),
        });
      } else {
        const fac: FactionEntity = {
          ...newBase(),
          name: f.name,
          goals: f.goals ?? '',
          resources: f.resources ?? '',
          memberNpcIds: [],
          locationIds: [],
          layers: [],
          externalKey: f.externalKey,
          aliases: f.aliases,
          source: f.source ? { batchId, label: f.source.label, pageRef: f.source.pageRef } : undefined,
        };
        await db.factions.put(fac);
        recordCreate('factions', fac.id);
      }
    }

    const batch: ImportBatchEntity = {
      id: batchId,
      mode: 'cidade',
      label: pkg.label,
      createdAt: now(),
      createdIds,
      snapshotOfUpdated,
      status: 'applied',
    };
    await db.importBatches.put(batch);
  });

  return (await db.importBatches.get(batchId))!;
}

/**
 * Apply a Scenario package (section 6.1). Creates a Plot, Clues, Scene cards
 * and plot layers, wiring references to city entities per the Keeper's
 * reconciliation decisions (`decisionByRef`). Idempotent by externalKey.
 */
export async function applyScenarioImport(
  pkg: ScenarioPackage,
  decisionByRef: Map<string, ReconcileDecision>,
): Promise<ImportBatchEntity> {
  const batchId = newId();
  const createdIds: ImportBatchEntity['createdIds'] = [];
  const snapshotOfUpdated: ImportBatchEntity['snapshotOfUpdated'] = [];

  /** Resolve a reference to an existing location id, honoring map/alias rules. */
  const resolveLocation = async (ref?: string): Promise<string | undefined> => {
    if (!ref) return undefined;
    const d = decisionByRef.get(ref);
    if (!d || d.action === 'ignore') return undefined;
    if ((d.action === 'match' || d.action === 'map') && d.targetId) {
      // "map" (move the stage): store the original name as an alias.
      if (d.action === 'map') {
        const loc = await db.locations.get(d.targetId);
        if (loc) {
          const aliases = Array.from(new Set([...(loc.aliases ?? []), ref]));
          const note = loc.notes.includes('Originalmente:') ? loc.notes : `${loc.notes}\nOriginalmente: ${ref}`.trim();
          await db.locations.update(d.targetId, { aliases, notes: note, updatedAt: now() });
        }
      }
      return d.targetId;
    }
    return undefined; // 'create' for locations is handled elsewhere if needed
  };

  const resolveNpc = async (ref?: string): Promise<string | undefined> => {
    if (!ref) return undefined;
    const d = decisionByRef.get(ref);
    if (!d || d.action === 'ignore') return undefined;
    if ((d.action === 'match' || d.action === 'merge' || d.action === 'map') && d.targetId) return d.targetId;
    return undefined;
  };

  await db.transaction(
    'rw',
    [db.plots, db.clues, db.sceneCards, db.locationPlotLayers, db.locations, db.npcs, db.importBatches],
    async () => {
      // Plot (idempotent by a stable tag carrying its externalKey).
      const plotTag = `import:${pkg.plot.externalKey}`;
      const existingPlot = await db.plots.filter((p) => p.tags.includes(plotTag)).first();
      let plotId: string;
      const conclusions = (pkg.plot.conclusions ?? []).map((c) => ({ id: newId(), title: c.title, description: c.description ?? '' }));

      if (existingPlot) {
        snapshotOfUpdated.push({ table: 'plots', id: existingPlot.id, before: structuredClone(existingPlot) });
        await db.plots.update(existingPlot.id, {
          name: pkg.plot.name,
          sourceModule: pkg.plot.sourceModule ?? existingPlot.sourceModule,
          hiddenTruth: pkg.plot.hiddenTruth ?? existingPlot.hiddenTruth,
          antagonists: pkg.plot.antagonists ?? existingPlot.antagonists,
          threatLevel: pkg.plot.threatLevel ?? existingPlot.threatLevel,
          updatedAt: now(),
        });
        plotId = existingPlot.id;
      } else {
        const plot: PlotEntity = {
          ...newBase(),
          tags: [plotTag],
          name: pkg.plot.name,
          sourceModule: pkg.plot.sourceModule ?? '',
          threatLevel: pkg.plot.threatLevel ?? 1,
          hiddenTruth: pkg.plot.hiddenTruth ?? '',
          antagonists: pkg.plot.antagonists ?? '',
          state: 'dormente',
          clock: { segments: pkg.plot.clockSegments ?? 6, filled: 0, advanceRules: [] },
          scheduledBeats: [],
          conclusions,
        };
        await db.plots.put(plot);
        createdIds.push({ table: 'plots', id: plot.id });
        plotId = plot.id;
      }
      const conclusionByKey = new Map(
        (pkg.plot.conclusions ?? []).map((c, i) => [c.externalKey, (existingPlot ? existingPlot.conclusions[i]?.id : conclusions[i]?.id) ?? '']),
      );

      // Clues (idempotent by externalKey tag).
      for (const c of pkg.clues) {
        const tag = `import:${c.externalKey}`;
        const existing = await db.clues.filter((x) => x.tags.includes(tag)).first();
        const locationId = await resolveLocation(c.locationRef);
        const npcId = await resolveNpc(c.npcRef);
        const base = {
          text: c.text,
          plotIds: [plotId],
          locationId,
          npcId,
          howToObtain: { method: c.howToObtain ?? '', difficulty: c.difficulty as CocDifficulty | undefined },
          revealsConclusionId: c.revealsConclusion ? conclusionByKey.get(c.revealsConclusion) : undefined,
          pointsToPlotIds: [plotId],
          isBridge: c.isBridge ?? false,
          updatedAt: now(),
        };
        if (existing) {
          snapshotOfUpdated.push({ table: 'clues', id: existing.id, before: structuredClone(existing) });
          await db.clues.update(existing.id, base);
        } else {
          const clue: ClueEntity = { ...newBase(), tags: [tag], ...base, handoutIds: [], status: 'nao-descoberta' };
          await db.clues.put(clue);
          createdIds.push({ table: 'clues', id: clue.id });
        }
      }

      // Scenes.
      for (const s of pkg.scenes) {
        const tag = `import:${s.externalKey}`;
        const existing = await db.sceneCards.filter((x) => x.tags.includes(tag)).first();
        const locationId = await resolveLocation(s.locationRef);
        const base = {
          title: s.title,
          plotId,
          locationId,
          trigger: s.trigger ?? '',
          openingText: s.openingText ?? '',
          whatHappens: s.whatHappens ?? '',
          updatedAt: now(),
        };
        if (existing) {
          snapshotOfUpdated.push({ table: 'sceneCards', id: existing.id, before: structuredClone(existing) });
          await db.sceneCards.update(existing.id, base);
        } else {
          const scene: SceneCardEntity = { ...newBase(), tags: [tag], ...base, outcomes: [], repeatable: false, used: false };
          await db.sceneCards.put(scene);
          createdIds.push({ table: 'sceneCards', id: scene.id });
        }
      }

      // Location plot layers.
      for (const layer of pkg.locationLayers) {
        const locationId = await resolveLocation(layer.locationRef);
        if (!locationId) continue;
        const lpl: LocationPlotLayer = {
          ...newBase(),
          locationId,
          plotId,
          whatChanges: layer.whatChanges,
          readAloudAppend: layer.readAloudAppend,
          readAloudOverride: layer.readAloudOverride,
          cluesHere: [],
          sceneCardIds: [],
          activationCondition: { kind: 'plotState', plotId, op: 'isNot', value: 'dormente' },
        };
        await db.locationPlotLayers.put(lpl);
        createdIds.push({ table: 'locationPlotLayers', id: lpl.id });
      }

      // NPC plot layers (merge preserves the existing sheet, adds the layer).
      for (const nl of pkg.npcLayers) {
        const npcId = await resolveNpc(nl.npcRef);
        if (!npcId) continue;
        const npc = await db.npcs.get(npcId);
        if (!npc) continue;
        snapshotOfUpdated.push({ table: 'npcs', id: npc.id, before: structuredClone(npc) });
        const layers = [
          ...npc.layers.filter((l) => l.plotId !== plotId),
          { plotId, knows: nl.knows ?? '', hides: nl.hides ?? '', revealsIfPressed: nl.revealsIfPressed ?? '' },
        ];
        await db.npcs.update(npc.id, { layers, updatedAt: now() });
      }

      const batch: ImportBatchEntity = {
        id: batchId,
        mode: 'cenario',
        label: pkg.label,
        createdAt: now(),
        createdIds,
        snapshotOfUpdated,
        status: 'applied',
      };
      await db.importBatches.put(batch);
    },
  );

  return (await db.importBatches.get(batchId))!;
}

/** Undo a whole batch: delete created records, restore snapshots. */
export async function undoBatch(batchId: string): Promise<void> {
  const batch = await db.importBatches.get(batchId);
  if (!batch || batch.status === 'undone') return;

  const storeOf = (name: StoreName) => {
    if (name === ('tables' as StoreName)) return db.gameTables;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (db as any)[name];
  };

  await db.transaction('rw', db.tables, async () => {
    for (const { table, id } of batch.createdIds) {
      await storeOf(table).delete(id);
    }
    for (const { table, before } of batch.snapshotOfUpdated) {
      await storeOf(table).put(before);
    }
    await db.importBatches.update(batchId, { status: 'undone' });
  });
}
