import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/database';
import { exportWorld, importWorld } from './worldBackup';
import { newBase } from '@/db/ids';
import { putBlob } from '@/db/blobs';
import type { LocationEntity, MapEntity } from '@/db/schema';

beforeEach(async () => {
  await Promise.all([db.maps.clear(), db.locations.clear(), db.gameTables.clear(), db.blobs.clear()]);
});

describe('world backup export/import roundtrip (6.12)', () => {
  it('reproduces the world identically, including blobs', async () => {
    const blobId = await putBlob(new Blob(['<svg/>'], { type: 'image/svg+xml' }));
    const map: MapEntity = { ...newBase(), name: 'Innsmouth', imageBlobId: blobId, width: 800, height: 600 };
    const loc: LocationEntity = {
      ...newBase(),
      name: 'Armazém',
      mapId: map.id,
      geometry: { type: 'point', x: 10, y: 20 },
      kind: 'armazem',
      baseDescription: 'desc',
      readAloud: { generico: '> texto' },
      sensoryDetails: ['cheiro'],
      discovered: true,
      iconKey: 'warehouse',
    };
    await db.maps.put(map);
    await db.locations.put(loc);

    const backup = await exportWorld();

    // Wipe, then import.
    await db.maps.clear();
    await db.locations.clear();
    await db.blobs.clear();

    const result = await importWorld(backup);
    expect(result.ok).toBe(true);

    const maps = await db.maps.toArray();
    const locs = await db.locations.toArray();
    const blobs = await db.blobs.toArray();
    expect(maps).toHaveLength(1);
    expect(maps[0].name).toBe('Innsmouth');
    expect(locs[0].geometry).toEqual({ type: 'point', x: 10, y: 20 });
    expect(blobs).toHaveLength(1);
    expect(blobs[0].type).toBe('image/svg+xml');
  });

  it('rejects an invalid file', async () => {
    const r = await importWorld({ not: 'a backup' });
    expect(r.ok).toBe(false);
  });
});
