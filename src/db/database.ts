import Dexie, { type Table } from 'dexie';
import type {
  MapEntity,
  LocationEntity,
  NpcEntity,
  FactionEntity,
  PlotEntity,
  LocationPlotLayer,
  SceneCardEntity,
  ClueEntity,
  HandoutEntity,
  TableEntity,
  SessionEntity,
  InvestigatorEntity,
  SessionZeroEntity,
  EventEntity,
  ImportBatchEntity,
  BlobRecord,
  MetaRecord,
} from './schema';

/**
 * IndexedDB database via Dexie.
 *
 * Indexes cover the queries required by the spec (section 4): by plotId,
 * locationId, status, tableId, externalKey. Multi-entry indexes (prefixed
 * with `*`) make array fields queryable.
 *
 * Migrations are versioned: add a new `.version(n).stores(...)` block and an
 * `.upgrade()` callback when the schema changes. Never edit a shipped version.
 */
export class PainelDoMestreDB extends Dexie {
  maps!: Table<MapEntity, string>;
  locations!: Table<LocationEntity, string>;
  npcs!: Table<NpcEntity, string>;
  factions!: Table<FactionEntity, string>;
  plots!: Table<PlotEntity, string>;
  locationPlotLayers!: Table<LocationPlotLayer, string>;
  sceneCards!: Table<SceneCardEntity, string>;
  clues!: Table<ClueEntity, string>;
  handouts!: Table<HandoutEntity, string>;
  sessions!: Table<SessionEntity, string>;
  investigators!: Table<InvestigatorEntity, string>;
  sessionZeros!: Table<SessionZeroEntity, string>;
  events!: Table<EventEntity, string>;
  importBatches!: Table<ImportBatchEntity, string>;
  blobs!: Table<BlobRecord, string>;
  meta!: Table<MetaRecord, string>;

  // NOTE: the game "tables" store is exposed as `gameTables` because Dexie
  // reserves the instance property `tables` for its own list of tables.
  gameTables!: Table<TableEntity, string>;

  constructor() {
    super('painel-do-mestre');

    this.version(1).stores({
      maps: 'id, parentMapId, updatedAt',
      locations:
        'id, mapId, kind, district, parentLocationId, discovered, externalKey, updatedAt',
      npcs: 'id, status, isKnownToPlayers, externalKey, updatedAt, *factionIds',
      factions: 'id, externalKey, updatedAt',
      plots: 'id, state, threatLevel, updatedAt',
      locationPlotLayers: 'id, locationId, plotId',
      sceneCards: 'id, plotId, locationId, used',
      clues: 'id, locationId, npcId, status, isBridge, *plotIds, *pointsToPlotIds',
      handouts: 'id, clueId, locationId, updatedAt',
      gameTables: 'id, updatedAt',
      sessions: 'id, tableId, realDate',
      investigators: 'id, tableId, playerName, updatedAt',
      sessionZeros: 'id, tableId',
      events: 'id, tableId, inGameDate, type, *linkedEntityIds, updatedAt',
      importBatches: 'id, mode, status, createdAt',
      blobs: 'id',
      meta: 'key',
    });
  }
}

export const db = new PainelDoMestreDB();

/** Current schema version, surfaced in Settings / exports. */
export const SCHEMA_VERSION = 1;
