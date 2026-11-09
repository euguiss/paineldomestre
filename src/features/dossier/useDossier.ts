import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { resolveDossier, type DossierWorld, type ResolvedDossier } from '@/domain/dossier';
import { useUiStore } from '@/state/uiStore';
import type {
  ClueEntity,
  LocationEntity,
  NpcEntity,
  PlotEntity,
} from '@/db/schema';

function toMap<T extends { id: string }>(arr: T[] | undefined): Map<string, T> {
  return new Map((arr ?? []).map((x) => [x.id, x]));
}

/** Assemble the DossierWorld from the DB and resolve the dossier for a location. */
export function useDossier(locationId: string): ResolvedDossier | undefined {
  const period = useUiStore((s) => s.period);
  const weather = useUiStore((s) => s.weather);
  const visit = useUiStore((s) => s.visit);
  const activeTableId = useUiStore((s) => s.activeTableId);

  const location = useLiveData<LocationEntity | undefined>(
    () => db.locations.get(locationId),
    [locationId],
  );
  const plots = useLiveData<PlotEntity[]>(() => db.plots.toArray(), []);
  const clues = useLiveData<ClueEntity[]>(() => db.clues.toArray(), []);
  const npcs = useLiveData<NpcEntity[]>(() => db.npcs.toArray(), []);
  const allLocations = useLiveData<LocationEntity[]>(() => db.locations.toArray(), []);
  const layers = useLiveData(() => db.locationPlotLayers.toArray(), []);
  const sceneCards = useLiveData(() => db.sceneCards.toArray(), []);
  const handouts = useLiveData(() => db.handouts.toArray(), []);
  const events = useLiveData(() => db.events.toArray(), []);

  if (
    !location ||
    !plots ||
    !clues ||
    !npcs ||
    !allLocations ||
    !layers ||
    !sceneCards ||
    !handouts ||
    !events
  ) {
    return undefined;
  }

  const world: DossierWorld = {
    plots: toMap(plots),
    clues: toMap(clues),
    npcs: toMap(npcs),
    locations: toMap(allLocations),
    locationPlotLayers: layers,
    sceneCards: toMap(sceneCards),
    handouts,
    events,
  };

  return resolveDossier(location, world, {
    period,
    weather,
    visit,
    tableId: activeTableId,
  });
}
