import type {
  ClueEntity,
  FactionEntity,
  LocationEntity,
  LocationPlotLayer,
  NpcEntity,
  PlotEntity,
} from '@/db/schema';

export type GraphNodeType = 'plot' | 'npc' | 'location' | 'faction';
export type GraphEdgeKind = 'pertence' | 'aparece-em' | 'pista-ponte' | 'controla';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  /** How many distinct plots this node touches (crossing detector). */
  plotCount: number;
  /** True when the node participates in 2+ plots (crossing node). */
  isCrossing: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: GraphEdgeKind;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphInput {
  plots: PlotEntity[];
  npcs: NpcEntity[];
  locations: LocationEntity[];
  factions: FactionEntity[];
  clues: ClueEntity[];
  locationPlotLayers: LocationPlotLayer[];
}

/**
 * Build the connection graph (section 6.8). Nodes are plots, NPCs, locations
 * and factions; edges are membership, appearance, bridge-clue links and
 * faction control. A node touching 2+ plots is a "crossing node". Pure.
 */
export function buildGraph(input: GraphInput): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  // Track which plots each non-plot node touches.
  const plotsByNode = new Map<string, Set<string>>();
  const touch = (nodeId: string, plotId: string) => {
    if (!plotId) return;
    const set = plotsByNode.get(nodeId) ?? new Set<string>();
    set.add(plotId);
    plotsByNode.set(nodeId, set);
  };

  // Plot nodes.
  for (const p of input.plots) {
    nodes.push({ id: p.id, type: 'plot', label: p.name, plotCount: 1, isCrossing: false });
  }

  // NPC nodes + "aparece-em" edges (via their plot layers) + faction edges.
  for (const n of input.npcs) {
    for (const layer of n.layers) {
      if (layer.plotId) {
        touch(n.id, layer.plotId);
        edges.push({ id: `e-npc-${n.id}-${layer.plotId}`, source: n.id, target: layer.plotId, kind: 'aparece-em' });
      }
    }
    for (const fid of n.factionIds) {
      edges.push({ id: `e-npcfac-${n.id}-${fid}`, source: n.id, target: fid, kind: 'pertence' });
    }
  }

  // Location "aparece-em" edges via LocationPlotLayers.
  for (const layer of input.locationPlotLayers) {
    if (layer.plotId && layer.locationId) {
      touch(layer.locationId, layer.plotId);
      edges.push({
        id: `e-loc-${layer.locationId}-${layer.plotId}-${layer.id}`,
        source: layer.locationId,
        target: layer.plotId,
        kind: 'aparece-em',
      });
    }
  }

  // Bridge clues create edges between the plots they connect.
  for (const c of input.clues) {
    if (c.isBridge && c.plotIds.length >= 2) {
      for (let i = 0; i < c.plotIds.length - 1; i += 1) {
        edges.push({
          id: `e-bridge-${c.id}-${i}`,
          source: c.plotIds[i],
          target: c.plotIds[i + 1],
          kind: 'pista-ponte',
        });
      }
    }
  }

  // Faction control edges over plots (via faction layers).
  for (const f of input.factions) {
    for (const layer of f.layers) {
      if (layer.plotId) {
        touch(f.id, layer.plotId);
        edges.push({ id: `e-fac-${f.id}-${layer.plotId}`, source: f.id, target: layer.plotId, kind: 'controla' });
      }
    }
  }

  // Create NPC/location/faction nodes only for those that touch the world.
  const addEntityNode = (id: string, type: GraphNodeType, label: string) => {
    const set = plotsByNode.get(id);
    const plotCount = set ? set.size : 0;
    nodes.push({ id, type, label, plotCount, isCrossing: plotCount >= 2 });
  };

  for (const n of input.npcs) {
    if (plotsByNode.has(n.id) || n.factionIds.length > 0) addEntityNode(n.id, 'npc', n.name);
  }
  for (const l of input.locations) {
    if (plotsByNode.has(l.id)) addEntityNode(l.id, 'location', l.name);
  }
  for (const f of input.factions) {
    addEntityNode(f.id, 'faction', f.name);
  }

  // Drop edges whose endpoints are not present as nodes.
  const nodeIds = new Set(nodes.map((n) => n.id));
  const validEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  return { nodes, edges: validEdges };
}

/** Rows = locations/NPCs, columns = plots (section 6.8 crossing matrix). */
export interface CrossMatrix {
  plots: PlotEntity[];
  rows: Array<{
    id: string;
    label: string;
    type: 'npc' | 'location' | 'faction';
    /** plotId -> true when this entity participates in that plot. */
    cells: Record<string, boolean>;
    plotCount: number;
  }>;
}

export function buildCrossMatrix(input: GraphInput): CrossMatrix {
  const graph = buildGraph(input);
  const plotIds = new Set(input.plots.map((p) => p.id));

  const rows = graph.nodes
    .filter((n) => n.type !== 'plot')
    .map((n) => {
      const cells: Record<string, boolean> = {};
      // Determine participation from edges toward plots.
      for (const e of graph.edges) {
        if (e.source === n.id && plotIds.has(e.target)) cells[e.target] = true;
        if (e.target === n.id && plotIds.has(e.source)) cells[e.source] = true;
      }
      const plotCount = Object.values(cells).filter(Boolean).length;
      return { id: n.id, label: n.label, type: n.type as 'npc' | 'location' | 'faction', cells, plotCount };
    })
    .filter((r) => r.plotCount > 0)
    .sort((a, b) => b.plotCount - a.plotCount);

  return { plots: input.plots, rows };
}
