import type {
  ActivationCondition,
  ClueEntity,
  LocationEntity,
  NpcEntity,
  PlotEntity,
} from '@/db/schema';

/** Snapshot of world state needed to evaluate activation conditions (5.2). */
export interface ActivationWorld {
  plots: Map<string, PlotEntity>;
  clues: Map<string, ClueEntity>;
  npcs: Map<string, NpcEntity>;
  locations: Map<string, LocationEntity>;
}

/**
 * Evaluate a declarative activation condition against the world snapshot.
 *
 * Conditions are built via a form (no code typed by the Keeper). A missing
 * referenced entity makes the leaf evaluate to `false` (fail-closed) so a
 * dangling reference never accidentally reveals a layer.
 */
export function evaluateCondition(cond: ActivationCondition, world: ActivationWorld): boolean {
  switch (cond.kind) {
    case 'always':
      return true;

    case 'all':
      return cond.conditions.every((c) => evaluateCondition(c, world));

    case 'any':
      return cond.conditions.some((c) => evaluateCondition(c, world));

    case 'plotState': {
      const plot = world.plots.get(cond.plotId);
      if (!plot) return false;
      return cond.op === 'is' ? plot.state === cond.value : plot.state !== cond.value;
    }

    case 'plotClockFilled': {
      const plot = world.plots.get(cond.plotId);
      if (!plot) return false;
      return plot.clock.filled >= cond.value;
    }

    case 'clueStatus': {
      const clue = world.clues.get(cond.clueId);
      if (!clue) return false;
      return clue.status === cond.value;
    }

    case 'npcStatus': {
      const npc = world.npcs.get(cond.npcId);
      if (!npc) return false;
      return npc.status === cond.value;
    }

    case 'locationDiscovered': {
      const loc = world.locations.get(cond.locationId);
      if (!loc) return false;
      return loc.discovered === cond.value;
    }

    default: {
      // Exhaustiveness guard.
      const _never: never = cond;
      return Boolean(_never);
    }
  }
}
