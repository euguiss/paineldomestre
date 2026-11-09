import type { Effect, EventEntity, EventType } from '@/db/schema';
import { db } from '@/db/database';
import { newId, now } from '@/db/ids';

/**
 * Apply a single Effect to the database (section 4 "Effect", 5.4, 5.7).
 *
 * Each effect is a small, explicit state change. Effects are applied by the
 * app only after the Keeper confirms (the app suggests, the Keeper commits).
 */
export async function applyEffect(effect: Effect): Promise<void> {
  const ts = now();
  switch (effect.type) {
    case 'setClueStatus':
      await db.clues.update(effect.clueId, { status: effect.status, updatedAt: ts });
      break;

    case 'setNpcStatus':
      await db.npcs.update(effect.npcId, { status: effect.status, updatedAt: ts });
      break;

    case 'moveNpc': {
      // Move = ensure the NPC's current-period schedule points at locationId.
      // We append a generic entry if none exists; the Keeper can refine it.
      const npc = await db.npcs.get(effect.npcId);
      if (npc) {
        const schedule = [...npc.schedule];
        // Prefer updating an existing 'any-period' marker; else push a note.
        schedule.push({ period: 'tarde', locationId: effect.locationId, activity: 'movido (ação rápida)' });
        await db.npcs.update(effect.npcId, { schedule, updatedAt: ts });
      }
      break;
    }

    case 'advanceClock': {
      const plot = await db.plots.get(effect.plotId);
      if (plot) {
        const filled = Math.max(0, Math.min(plot.clock.segments, plot.clock.filled + effect.by));
        await db.plots.update(effect.plotId, { clock: { ...plot.clock, filled }, updatedAt: ts });
      }
      break;
    }

    case 'setPlotState':
      await db.plots.update(effect.plotId, { state: effect.state, updatedAt: ts });
      break;

    case 'markLocationDiscovered':
      await db.locations.update(effect.locationId, { discovered: true, updatedAt: ts });
      break;

    case 'markHandoutDelivered': {
      const handout = await db.handouts.get(effect.handoutId);
      if (handout) {
        const deliveries = [...handout.deliveries, { tableId: effect.tableId, deliveredAt: ts, note: '' }];
        await db.handouts.update(effect.handoutId, { deliveries, updatedAt: ts });
      }
      break;
    }

    case 'markSceneUsed':
      await db.sceneCards.update(effect.sceneCardId, { used: true, updatedAt: ts });
      break;

    default: {
      const _never: never = effect;
      return _never;
    }
  }
}

/** Apply a list of effects in order. */
export async function applyEffects(effects: Effect[]): Promise<void> {
  for (const e of effects) {
    await applyEffect(e);
  }
}

export interface RecordEventInput {
  type: EventType;
  text: string;
  inGameDate: string;
  tableId?: string;
  linkedEntityIds?: string[];
  effects?: Effect[];
}

/**
 * Apply effects and record a journal Event in one step (section 5.7).
 * Used by every quick action during a live session.
 */
export async function recordEvent(input: RecordEventInput): Promise<EventEntity> {
  const effects = input.effects ?? [];
  await applyEffects(effects);

  const event: EventEntity = {
    id: newId(),
    createdAt: now(),
    updatedAt: now(),
    tags: [],
    notes: '',
    inGameDate: input.inGameDate,
    tableId: input.tableId,
    type: input.type,
    text: input.text,
    linkedEntityIds: input.linkedEntityIds ?? [],
    effectsApplied: effects,
  };
  await db.events.put(event);
  return event;
}
