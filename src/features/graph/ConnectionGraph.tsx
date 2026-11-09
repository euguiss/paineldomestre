import { useMemo } from 'react';
import { ReactFlow, Background, Controls, type Node, type Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { GraphNode, GraphEdge } from '@/domain/graph';
import { useUiStore } from '@/state/uiStore';
import { useNavigate } from 'react-router-dom';

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const TYPE_COLOR: Record<GraphNode['type'], string> = {
  plot: 'rgb(180,120,70)',
  npc: 'rgb(90,150,200)',
  location: 'rgb(120,180,120)',
  faction: 'rgb(200,120,160)',
};

const EDGE_COLOR: Record<GraphEdge['kind'], string> = {
  pertence: 'rgb(150,150,160)',
  'aparece-em': 'rgb(120,130,150)',
  'pista-ponte': 'rgb(200,120,70)',
  controla: 'rgb(200,120,160)',
};

/**
 * Connection graph via React Flow. Uses a simple deterministic layout: plots
 * on an inner circle, other nodes on an outer circle. Clicking a node routes
 * to the relevant screen.
 */
export function ConnectionGraph({ nodes, edges }: Props) {
  const navigate = useNavigate();
  const selectLocation = useUiStore((s) => s.selectLocation);

  const flowNodes = useMemo<Node[]>(() => {
    const plots = nodes.filter((n) => n.type === 'plot');
    const others = nodes.filter((n) => n.type !== 'plot');
    const place = (i: number, total: number, radius: number, cx = 400, cy = 300) => {
      const angle = (i / Math.max(1, total)) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    };
    const result: Node[] = [];
    plots.forEach((n, i) => {
      result.push({
        id: n.id,
        position: place(i, plots.length, 140),
        data: { label: n.label },
        style: nodeStyle(n),
      });
    });
    others.forEach((n, i) => {
      result.push({
        id: n.id,
        position: place(i, others.length, 320),
        data: { label: `${n.label}${n.isCrossing ? ' ✦' : ''}` },
        style: nodeStyle(n),
      });
    });
    return result;
  }, [nodes]);

  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.kind === 'pista-ponte',
        style: { stroke: EDGE_COLOR[e.kind], strokeWidth: e.kind === 'pista-ponte' ? 2.5 : 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR[e.kind] },
        label: e.kind,
        labelStyle: { fill: 'rgb(148,154,170)', fontSize: 10 },
        labelBgStyle: { fill: 'rgb(24,26,35)' },
      })),
    [edges],
  );

  function onNodeClick(id: string) {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    if (node.type === 'location') {
      selectLocation(id);
      navigate('/');
    } else if (node.type === 'npc') {
      navigate('/npcs');
    } else if (node.type === 'faction') {
      navigate('/faccoes');
    } else if (node.type === 'plot') {
      navigate('/tramas');
    }
  }

  if (nodes.length === 0) {
    return <div className="flex h-full items-center justify-center text-muted">Sem conexões para exibir com os filtros atuais.</div>;
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        nodesDraggable
        onNodeClick={(_, node) => onNodeClick(node.id)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgb(52,56,72)" gap={24} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function nodeStyle(n: GraphNode): React.CSSProperties {
  const color = TYPE_COLOR[n.type];
  return {
    background: 'rgb(24,26,35)',
    color: 'rgb(226,228,236)',
    border: `${n.isCrossing ? 3 : 1.5}px solid ${color}`,
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 12,
    boxShadow: n.isCrossing ? `0 0 10px ${color}` : 'none',
  };
}
