import type {
  ClueEntity,
  DayPeriod,
  EventEntity,
  HandoutEntity,
  LocationEntity,
  LocationPlotLayer,
  NpcEntity,
  PlotEntity,
  SceneCardEntity,
} from '@/db/schema';
import { evaluateCondition, type ActivationWorld } from './activation';
import { resolveReadAloud, type ReadAloudContext, type ResolvedReadAloud } from './readAloud';

/** All world data the dossier resolver reads from (pure input). */
export interface DossierWorld extends ActivationWorld {
  locationPlotLayers: LocationPlotLayer[];
  sceneCards: Map<string, SceneCardEntity>;
  handouts: HandoutEntity[];
  events: EventEntity[];
}

export interface DossierContext extends ReadAloudContext {
  /** Active table, used to scope handout-delivery status. */
  tableId: string | null;
  /** Keeper-forced read-aloud variant (chip), optional. */
  forcedVariant?: keyof LocationEntity['readAloud'];
}

export interface ActiveLayer {
  layer: LocationPlotLayer;
  plot: PlotEntity | undefined;
  active: true;
}
export interface InactiveLayer {
  layer: LocationPlotLayer;
  plot: PlotEntity | undefined;
  active: false;
  /** Human reason, e.g. "trama X dormente". */
  reason: string;
}
export type DossierLayer = ActiveLayer | InactiveLayer;

export interface HandoutWithDelivery {
  handout: HandoutEntity;
  deliveredToActiveTable: boolean;
}

/**
 * The resolved dossier for a location at a given moment (section 5.3).
 * This is a pure function — no DB access — so it can be unit tested.
 */
export interface ResolvedDossier {
  location: LocationEntity;
  /** 1. Correct read-aloud text (base + active layer overrides/appends). */
  readAloud: ResolvedReadAloud & { composed: string };
  /** 2. NPCs present now (by schedule + status, excluding dead/missing). */
  npcsPresent: NpcEntity[];
  /** 3. Active and inactive plot layers. */
  layers: DossierLayer[];
  /** 4. Clues available (undiscovered) and already discovered, here. */
  cluesAvailable: ClueEntity[];
  cluesDiscovered: ClueEntity[];
  /** 5. Scene cards available (from active layers). */
  sceneCards: SceneCardEntity[];
  /** 6. Linked handouts with delivery status. */
  handouts: HandoutWithDelivery[];
  /** 7. Past events at this location. */
  history: EventEntity[];
}

/** NPC counts as "present" if its schedule for the period points here and it is around. */
function isNpcPresent(npc: NpcEntity, locationId: string, period: DayPeriod): boolean {
  if (npc.status === 'morto' || npc.status === 'desaparecido') return false;
  return npc.schedule.some((s) => s.period === period && s.locationId === locationId);
}

export function resolveDossier(
  location: LocationEntity,
  world: DossierWorld,
  ctx: DossierContext,
): ResolvedDossier {
  // --- Plot layers for this location ---
  const layersForLocation = world.locationPlotLayers.filter((l) => l.locationId === location.id);

  const layers: DossierLayer[] = layersForLocation.map((layer) => {
    const plot = world.plots.get(layer.plotId);
    const active = evaluateCondition(layer.activationCondition, world);
    if (active) {
      return { layer, plot, active: true };
    }
    const reason = plot
      ? `inativa: trama "${plot.name}" ${plot.state}`
      : 'inativa: trama não encontrada';
    return { layer, plot, active: false, reason };
  });

  const activeLayers = layers.filter((l): l is ActiveLayer => l.active);

  // --- Read-aloud (base, then active-layer override/append) ---
  const base = resolveReadAloud(location.readAloud, ctx, ctx.forcedVariant);
  let composed = base.text;
  for (const { layer } of activeLayers) {
    if (layer.readAloudOverride) composed = layer.readAloudOverride;
  }
  for (const { layer } of activeLayers) {
    if (layer.readAloudAppend) {
      composed = composed ? `${composed}\n\n${layer.readAloudAppend}` : layer.readAloudAppend;
    }
  }

  // --- NPCs present now ---
  const npcsPresent = [...world.npcs.values()].filter((n) =>
    isNpcPresent(n, location.id, ctx.period),
  );

  // --- Clues here: direct link + clues referenced by active layers ---
  const clueIdsFromLayers = new Set<string>();
  for (const { layer } of activeLayers) {
    for (const cid of layer.cluesHere) clueIdsFromLayers.add(cid);
  }
  const cluesHere = [...world.clues.values()].filter(
    (c) => c.locationId === location.id || clueIdsFromLayers.has(c.id),
  );
  const cluesAvailable = cluesHere.filter((c) => c.status === 'nao-descoberta');
  const cluesDiscovered = cluesHere.filter((c) => c.status === 'descoberta');

  // --- Scene cards from active layers ---
  const sceneCardIds = new Set<string>();
  for (const { layer } of activeLayers) {
    for (const sid of layer.sceneCardIds) sceneCardIds.add(sid);
  }
  const sceneCards = [...sceneCardIds]
    .map((id) => world.sceneCards.get(id))
    .filter((s): s is SceneCardEntity => Boolean(s))
    .filter((s) => s.repeatable || !s.used);

  // --- Handouts linked to this location ---
  const handouts: HandoutWithDelivery[] = world.handouts
    .filter((h) => h.locationId === location.id)
    .map((handout) => ({
      handout,
      deliveredToActiveTable: ctx.tableId
        ? handout.deliveries.some((d) => d.tableId === ctx.tableId)
        : false,
    }));

  // --- History: events linked to this location ---
  const history = world.events.filter((e) => e.linkedEntityIds.includes(location.id));

  return {
    location,
    readAloud: { ...base, composed },
    npcsPresent,
    layers,
    cluesAvailable,
    cluesDiscovered,
    sceneCards,
    handouts,
    history,
  };
}
