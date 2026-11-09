import type { NameLookup } from '@/domain/describeCondition';
import type { ClueEntity, LocationEntity, NpcEntity, PlotEntity } from '@/db/schema';

interface Sources {
  plots: PlotEntity[];
  clues: ClueEntity[];
  npcs: NpcEntity[];
  locations: LocationEntity[];
}

/** Build a NameLookup from live entity arrays, for describeCondition. */
export function makeNameLookup(s: Sources): NameLookup {
  const plotMap = new Map(s.plots.map((p) => [p.id, p.name]));
  const clueMap = new Map(s.clues.map((c) => [c.id, c.text]));
  const npcMap = new Map(s.npcs.map((n) => [n.id, n.name]));
  const locMap = new Map(s.locations.map((l) => [l.id, l.name]));
  return {
    plotName: (id) => plotMap.get(id) ?? '—',
    clueText: (id) => (clueMap.get(id) ?? '—').slice(0, 40),
    npcName: (id) => npcMap.get(id) ?? '—',
    locationName: (id) => locMap.get(id) ?? '—',
  };
}
