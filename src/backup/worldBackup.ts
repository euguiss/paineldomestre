import { db, SCHEMA_VERSION } from '@/db/database';
import { blobToBase64, base64ToBlob } from '@/db/blobs';
import type { StoreName } from '@/db/schema';

/**
 * Full-world export/import (backup) — section 6.12 / Configurações.
 *
 * This is a complete, lossless snapshot of every store plus blobs encoded as
 * base64 data URLs. It is NOT the scenario importer (that is Fase 6). The
 * export warns the Keeper it may contain copyrighted material and must not be
 * shared.
 */

export interface WorldBackup {
  app: 'painel-do-mestre';
  kind: 'world-backup';
  schemaVersion: number;
  exportedAt: string;
  data: Record<string, unknown[]>;
  /** blobId -> { type, base64 } */
  blobs: Record<string, { type: string; base64: string }>;
}

/** All data stores (everything except the blobs table, handled separately). */
const DATA_STORES: StoreName[] = [
  'maps',
  'locations',
  'npcs',
  'factions',
  'plots',
  'locationPlotLayers',
  'sceneCards',
  'clues',
  'handouts',
  'sessions',
  'investigators',
  'sessionZeros',
  'events',
  'importBatches',
  'meta',
];

/** A permissive Dexie table handle, enough for toArray/clear/bulkPut here. */
interface AnyTable {
  toArray(): Promise<unknown[]>;
  clear(): Promise<void>;
  bulkPut(rows: unknown[]): Promise<unknown>;
}

/** The game-tables store is named `gameTables` on the Dexie instance. */
function table(name: StoreName): AnyTable {
  if (name === ('tables' as StoreName)) return db.gameTables as unknown as AnyTable;
  return (db as unknown as Record<string, AnyTable>)[name];
}

export async function exportWorld(): Promise<WorldBackup> {
  const data: Record<string, unknown[]> = {};

  for (const name of DATA_STORES) {
    data[name] = await table(name).toArray();
  }
  // gameTables under the spec name "tables" for portability.
  data['gameTables'] = await db.gameTables.toArray();

  // Blobs -> base64.
  const blobs: WorldBackup['blobs'] = {};
  const allBlobs = await db.blobs.toArray();
  for (const b of allBlobs) {
    blobs[b.id] = { type: b.type, base64: await blobToBase64(b.data) };
  }

  return {
    app: 'painel-do-mestre',
    kind: 'world-backup',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    blobs,
  };
}

export interface ImportResult {
  ok: boolean;
  message: string;
}

/**
 * Replace the entire world with the backup. Validates the envelope shape and
 * schema version before touching the DB.
 */
export async function importWorld(backup: unknown): Promise<ImportResult> {
  if (!isWorldBackup(backup)) {
    return { ok: false, message: 'Arquivo inválido: não é um backup do Painel do Mestre.' };
  }
  if (backup.schemaVersion !== SCHEMA_VERSION) {
    return {
      ok: false,
      message: `Versão de esquema incompatível (arquivo: ${backup.schemaVersion}, app: ${SCHEMA_VERSION}).`,
    };
  }

  // Wipe then restore.
  await Promise.all(DATA_STORES.map((n) => table(n).clear()));
  await db.gameTables.clear();
  await db.blobs.clear();

  // Restore blobs first (so references resolve).
  for (const [id, rec] of Object.entries(backup.blobs)) {
    const blob = await base64ToBlob(rec.base64);
    await db.blobs.put({ id, type: rec.type, data: blob });
  }

  for (const name of DATA_STORES) {
    const rows = backup.data[name];
    if (Array.isArray(rows) && rows.length) {
      await table(name).bulkPut(rows);
    }
  }
  const gameTables = backup.data['gameTables'] ?? backup.data['tables'];
  if (Array.isArray(gameTables) && gameTables.length) {
    await table('tables' as StoreName).bulkPut(gameTables);
  }

  return { ok: true, message: 'Mundo importado com sucesso.' };
}

function isWorldBackup(x: unknown): x is WorldBackup {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  return o.app === 'painel-do-mestre' && o.kind === 'world-backup' && typeof o.schemaVersion === 'number' && typeof o.data === 'object';
}

/** Trigger a browser download of the backup JSON. */
export function downloadBackup(backup: WorldBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `painel-do-mestre-backup-${backup.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
