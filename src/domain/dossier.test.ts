import { describe, it, expect } from 'vitest';
import { resolveDossier, type DossierWorld } from './dossier';
import type {
  ClueEntity,
  EventEntity,
  LocationEntity,
  LocationPlotLayer,
  NpcEntity,
  PlotEntity,
  SceneCardEntity,
} from '@/db/schema';

function b() {
  return { createdAt: 't', updatedAt: 't', tags: [], notes: '' };
}

const plotActive: PlotEntity = {
  ...b(),
  id: 'plot-active',
  name: 'Trama Ativa',
  sourceModule: '',
  threatLevel: 1,
  hiddenTruth: '',
  antagonists: '',
  state: 'ativa',
  clock: { segments: 6, filled: 2, advanceRules: [] },
  scheduledBeats: [],
  conclusions: [],
};
const plotDormant: PlotEntity = { ...plotActive, id: 'plot-dormant', name: 'Trama Dormente', state: 'dormente', clock: { segments: 4, filled: 0, advanceRules: [] } };

const loc: LocationEntity = {
  ...b(),
  id: 'loc1',
  name: 'Armazém',
  mapId: 'm1',
  geometry: { type: 'point', x: 0, y: 0 },
  kind: 'armazem',
  baseDescription: '',
  readAloud: { dia: '> base dia', noite: '> base noite', generico: '> base' },
  sensoryDetails: [],
  discovered: false,
  iconKey: 'warehouse',
};

const layerActive: LocationPlotLayer = {
  ...b(),
  id: 'layerA',
  locationId: 'loc1',
  plotId: 'plot-active',
  whatChanges: '',
  readAloudAppend: '> append ativo',
  cluesHere: ['clueLayer'],
  sceneCardIds: ['scene1'],
  activationCondition: { kind: 'plotState', plotId: 'plot-active', op: 'is', value: 'ativa' },
};
const layerInactive: LocationPlotLayer = {
  ...b(),
  id: 'layerI',
  locationId: 'loc1',
  plotId: 'plot-dormant',
  whatChanges: '',
  readAloudOverride: '> NAO DEVE APARECER',
  cluesHere: ['clueHidden'],
  sceneCardIds: ['sceneHidden'],
  activationCondition: { kind: 'plotState', plotId: 'plot-dormant', op: 'isNot', value: 'dormente' },
};

const npcHere: NpcEntity = {
  ...b(),
  id: 'npc1',
  name: 'Presente',
  appearance: '',
  voiceAndMannerisms: '',
  typicalLines: [],
  factionIds: [],
  statBlock: { markdown: '' },
  schedule: [{ period: 'noite', locationId: 'loc1', activity: 'ronda' }],
  status: 'vivo',
  isKnownToPlayers: false,
  layers: [],
};
const npcDead: NpcEntity = { ...npcHere, id: 'npc2', name: 'Morto', status: 'morto' };

const clueDirect: ClueEntity = {
  ...b(),
  id: 'clueDirect',
  text: 'direta',
  plotIds: ['plot-active'],
  locationId: 'loc1',
  howToObtain: { method: '' },
  pointsToPlotIds: [],
  isBridge: false,
  handoutIds: [],
  status: 'nao-descoberta',
};
const clueLayer: ClueEntity = { ...clueDirect, id: 'clueLayer', text: 'da camada', locationId: undefined };
const clueHidden: ClueEntity = { ...clueDirect, id: 'clueHidden', text: 'escondida', locationId: undefined };
const clueDiscovered: ClueEntity = { ...clueDirect, id: 'clueDisc', text: 'achada', status: 'descoberta' };

const scene1: SceneCardEntity = {
  ...b(),
  id: 'scene1',
  title: 'Cena',
  plotId: 'plot-active',
  locationId: 'loc1',
  trigger: '',
  openingText: '',
  whatHappens: '',
  outcomes: [],
  repeatable: false,
  used: false,
};
const sceneHidden: SceneCardEntity = { ...scene1, id: 'sceneHidden', title: 'Escondida' };

const evHere: EventEntity = {
  ...b(),
  id: 'ev1',
  inGameDate: 'x',
  type: 'nota',
  text: 'algo aconteceu',
  linkedEntityIds: ['loc1'],
  effectsApplied: [],
};

function makeWorld(): DossierWorld {
  return {
    plots: new Map([[plotActive.id, plotActive], [plotDormant.id, plotDormant]]),
    clues: new Map([
      [clueDirect.id, clueDirect],
      [clueLayer.id, clueLayer],
      [clueHidden.id, clueHidden],
      [clueDiscovered.id, clueDiscovered],
    ]),
    npcs: new Map([[npcHere.id, npcHere], [npcDead.id, npcDead]]),
    locations: new Map([[loc.id, loc]]),
    locationPlotLayers: [layerActive, layerInactive],
    sceneCards: new Map([[scene1.id, scene1], [sceneHidden.id, sceneHidden]]),
    handouts: [],
    events: [evHere],
  };
}

describe('resolveDossier (5.3)', () => {
  it('composes base read-aloud with active layer append, ignoring inactive override', () => {
    const r = resolveDossier(loc, makeWorld(), { period: 'noite', visit: 'retorno', weather: 'seco', tableId: null });
    expect(r.readAloud.composed).toContain('base noite');
    expect(r.readAloud.composed).toContain('append ativo');
    expect(r.readAloud.composed).not.toContain('NAO DEVE APARECER');
  });

  it('lists only NPCs present now, excluding dead/missing', () => {
    const r = resolveDossier(loc, makeWorld(), { period: 'noite', visit: 'retorno', weather: 'seco', tableId: null });
    expect(r.npcsPresent.map((n) => n.id)).toEqual(['npc1']);
  });

  it('marks layers active/inactive with a reason', () => {
    const r = resolveDossier(loc, makeWorld(), { period: 'noite', visit: 'retorno', weather: 'seco', tableId: null });
    const active = r.layers.filter((l) => l.active);
    const inactive = r.layers.filter((l) => !l.active);
    expect(active).toHaveLength(1);
    expect(inactive).toHaveLength(1);
    expect(inactive[0].active).toBe(false);
    if (!inactive[0].active) expect(inactive[0].reason).toContain('dormente');
  });

  it('includes direct + active-layer clues but not inactive-layer clues', () => {
    const r = resolveDossier(loc, makeWorld(), { period: 'noite', visit: 'retorno', weather: 'seco', tableId: null });
    const availableIds = r.cluesAvailable.map((c) => c.id).sort();
    expect(availableIds).toEqual(['clueDirect', 'clueLayer']);
    expect(r.cluesDiscovered.map((c) => c.id)).toEqual(['clueDisc']);
  });

  it('exposes scene cards only from active layers', () => {
    const r = resolveDossier(loc, makeWorld(), { period: 'noite', visit: 'retorno', weather: 'seco', tableId: null });
    expect(r.sceneCards.map((s) => s.id)).toEqual(['scene1']);
  });

  it('returns location history events', () => {
    const r = resolveDossier(loc, makeWorld(), { period: 'noite', visit: 'retorno', weather: 'seco', tableId: null });
    expect(r.history.map((e) => e.id)).toEqual(['ev1']);
  });
});
