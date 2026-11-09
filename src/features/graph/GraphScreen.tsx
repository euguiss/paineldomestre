import { useMemo, useState } from 'react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { ScreenHeader, Button } from '@/components/ui';
import { buildGraph, type GraphInput, type GraphNodeType } from '@/domain/graph';
import { ConnectionGraph } from './ConnectionGraph';
import { CrossMatrix } from './CrossMatrix';

/** Grafo de Conexões + matriz de cruzamentos (section 6.8). */
export function GraphScreen() {
  const plots = useLiveData(() => db.plots.toArray(), []) ?? [];
  const npcs = useLiveData(() => db.npcs.toArray(), []) ?? [];
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];
  const factions = useLiveData(() => db.factions.toArray(), []) ?? [];
  const clues = useLiveData(() => db.clues.toArray(), []) ?? [];
  const layers = useLiveData(() => db.locationPlotLayers.toArray(), []) ?? [];

  const [view, setView] = useState<'grafo' | 'matriz'>('grafo');
  const [typeFilter, setTypeFilter] = useState<GraphNodeType | ''>('');
  const [plotFilter, setPlotFilter] = useState('');

  const input: GraphInput = { plots, npcs, locations, factions, clues, locationPlotLayers: layers };
  const graph = useMemo(() => buildGraph(input), [plots, npcs, locations, factions, clues, layers]);

  // Apply filters to the graph (type + plot).
  const filtered = useMemo(() => {
    let nodes = graph.nodes;
    let edges = graph.edges;
    if (plotFilter) {
      const keep = new Set<string>([plotFilter]);
      for (const e of edges) {
        if (e.source === plotFilter) keep.add(e.target);
        if (e.target === plotFilter) keep.add(e.source);
      }
      nodes = nodes.filter((n) => keep.has(n.id));
      edges = edges.filter((e) => keep.has(e.source) && keep.has(e.target));
    }
    if (typeFilter) {
      nodes = nodes.filter((n) => n.type === typeFilter || n.type === 'plot');
      const ids = new Set(nodes.map((n) => n.id));
      edges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    }
    return { nodes, edges };
  }, [graph, typeFilter, plotFilter]);

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Grafo de Conexões">
        <Button variant={view === 'grafo' ? 'accent' : 'default'} onClick={() => setView('grafo')}>Grafo</Button>
        <Button variant={view === 'matriz' ? 'accent' : 'default'} onClick={() => setView('matriz')}>Matriz</Button>
      </ScreenHeader>

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 text-sm">
        <select className="rounded border border-border bg-surface-2 px-2 py-1" value={plotFilter} onChange={(e) => setPlotFilter(e.target.value)}>
          <option value="">Todas as tramas</option>
          {plots.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
        <select className="rounded border border-border bg-surface-2 px-2 py-1" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as GraphNodeType | '')}>
          <option value="">Todos os tipos</option>
          <option value="npc">NPCs</option>
          <option value="location">Locais</option>
          <option value="faction">Facções</option>
        </select>
        <span className="text-xs text-muted">Nós de cruzamento (2+ tramas) aparecem destacados.</span>
      </div>

      <div className="min-h-0 flex-1">
        {view === 'grafo' ? (
          <ConnectionGraph nodes={filtered.nodes} edges={filtered.edges} />
        ) : (
          <CrossMatrix input={input} />
        )}
      </div>
    </div>
  );
}
