import type { EventEntity, InvestigatorEntity, TableEntity } from '@/db/schema';

export interface ConsistencyWarning {
  /** The table that may be out of sync. */
  tableId: string;
  tableName: string;
  /** The entity whose state changed at another table. */
  entityId: string;
  /** Human description of the change ("NPC X morreu na Mesa Y"). */
  message: string;
}

export interface ConsistencyInput {
  tables: TableEntity[];
  investigators: InvestigatorEntity[];
  /** Events that represent a world-state change (death, state change...). */
  events: EventEntity[];
  /** The entity id we are viewing (e.g. an NPC detail page). */
  entityId: string;
}

/**
 * Múltiplas mesas e consistência (section 5.6).
 *
 * If one table produced a state-changing event about `entityId`, warn every
 * OTHER table that is linked to that entity (via an investigator link) and has
 * not itself produced such an event ("esta mesa ainda não sabe disso").
 *
 * Pure & testable.
 */
export function consistencyWarningsForEntity(input: ConsistencyInput): ConsistencyWarning[] {
  const CHANGE_TYPES = new Set(['morte', 'mudanca-de-estado', 'avanco-de-relogio']);

  // Tables that already produced a change event about this entity.
  const tablesThatKnow = new Set<string>();
  const changeEvents = input.events.filter(
    (e) => CHANGE_TYPES.has(e.type) && e.linkedEntityIds.includes(input.entityId) && e.tableId,
  );
  for (const e of changeEvents) {
    if (e.tableId) tablesThatKnow.add(e.tableId);
  }

  if (tablesThatKnow.size === 0) return [];

  // Tables linked to this entity through an investigator link.
  const linkedTableIds = new Set<string>();
  for (const inv of input.investigators) {
    if (inv.links.some((l) => l.targetId === input.entityId)) {
      linkedTableIds.add(inv.tableId);
    }
  }

  const warnings: ConsistencyWarning[] = [];
  for (const table of input.tables) {
    const affected = linkedTableIds.has(table.id);
    if (!affected) continue;
    if (tablesThatKnow.has(table.id)) continue; // this table caused/knows it

    // Build a message from the first change event.
    const sourceEvent = changeEvents[0];
    warnings.push({
      tableId: table.id,
      tableName: table.name,
      entityId: input.entityId,
      message: `Esta mesa ainda não sabe disso: "${sourceEvent.text}"`,
    });
  }

  return warnings;
}
