import { AlertTriangle, Check } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { computeCoverage } from '@/domain/coverage';
import { buildGraph } from '@/domain/graph';

/** Painel de cobertura: investigadores × tramas, com alertas (section 13). */
export function CoberturaTab({ tableId }: { tableId: string }) {
  const investigators = useLiveData(() => db.investigators.toArray(), []) ?? [];
  const plots = useLiveData(() => db.plots.toArray(), []) ?? [];
  const npcs = useLiveData(() => db.npcs.toArray(), []) ?? [];
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];
  const factions = useLiveData(() => db.factions.toArray(), []) ?? [];
  const clues = useLiveData(() => db.clues.toArray(), []) ?? [];
  const layers = useLiveData(() => db.locationPlotLayers.toArray(), []) ?? [];

  // entityId -> plotIds, derived from the graph (so indirect links resolve).
  const graph = buildGraph({ plots, npcs, locations, factions, clues, locationPlotLayers: layers });
  const entityPlots = new Map<string, string[]>();
  for (const e of graph.edges) {
    const plotIds = new Set(plots.map((p) => p.id));
    if (plotIds.has(e.target)) {
      entityPlots.set(e.source, [...(entityPlots.get(e.source) ?? []), e.target]);
    }
    if (plotIds.has(e.source)) {
      entityPlots.set(e.target, [...(entityPlots.get(e.target) ?? []), e.source]);
    }
  }

  const report = computeCoverage({ tableId, investigators, plots, entityPlots });
  const tableInvestigators = investigators.filter((i) => i.tableId === tableId);

  return (
    <div className="space-y-4 p-4">
      {(report.investigatorsWithoutLink.length > 0 || report.plotsWithoutInvestigator.length > 0) && (
        <div className="rounded border border-secret/30 bg-secret/10 p-3 text-sm text-secret">
          <div className="mb-1 flex items-center gap-2 font-medium"><AlertTriangle size={15} /> Alertas de cobertura</div>
          {report.investigatorsWithoutLink.map((i) => (
            <p key={i.id}>Investigador sem vínculo: <strong>{i.name}</strong></p>
          ))}
          {report.plotsWithoutInvestigator.map((p) => (
            <p key={p.id}>Trama sem nenhum investigador ligado: <strong>{p.name}</strong></p>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface px-3 py-2 text-left">Investigador</th>
              {plots.map((p) => (
                <th key={p.id} className="px-2 py-2 text-xs text-muted"><div className="mx-auto max-w-[90px] whitespace-normal">{p.name}</div></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableInvestigators.map((inv) => {
              const touched = new Set(report.investigatorPlots[inv.id] ?? []);
              return (
                <tr key={inv.id} className="border-t border-border">
                  <td className="sticky left-0 bg-surface px-3 py-2">{inv.name}</td>
                  {plots.map((p) => (
                    <td key={p.id} className="px-2 py-2 text-center">
                      {touched.has(p.id) ? <Check size={14} className="mx-auto text-accent" /> : <span className="text-border">·</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
            {tableInvestigators.length === 0 && (
              <tr><td colSpan={plots.length + 1} className="px-3 py-6 text-center text-muted">Nenhum investigador nesta mesa.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
