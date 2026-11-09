import type { InvestigatorEntity, PlotEntity } from '@/db/schema';

export interface CoverageReport {
  /** Investigators that have no world link at all. */
  investigatorsWithoutLink: Array<{ id: string; name: string }>;
  /** Plots that no investigator (in the given table) is linked to. */
  plotsWithoutInvestigator: Array<{ id: string; name: string }>;
  /** investigatorId -> plotIds it touches (directly or via linked entities). */
  investigatorPlots: Record<string, string[]>;
}

export interface CoverageInput {
  tableId: string;
  investigators: InvestigatorEntity[];
  plots: PlotEntity[];
  /** Map of entityId -> plotIds, to resolve indirect links (loc/npc/faction). */
  entityPlots: Map<string, string[]>;
}

/**
 * Painel de cobertura da Sessão 0 (section 13).
 *
 * For a given table: which investigators touch which plots, which investigator
 * has no link at all, and which plot has no investigator linked. A link to a
 * plot counts directly; a link to a location/npc/faction counts for whatever
 * plots that entity participates in (via `entityPlots`). Pure & testable.
 */
export function computeCoverage(input: CoverageInput): CoverageReport {
  const tableInvestigators = input.investigators.filter((i) => i.tableId === input.tableId);
  const investigatorPlots: Record<string, string[]> = {};
  const coveredPlotIds = new Set<string>();

  const investigatorsWithoutLink: Array<{ id: string; name: string }> = [];

  for (const inv of tableInvestigators) {
    if (inv.links.length === 0) {
      investigatorsWithoutLink.push({ id: inv.id, name: inv.name });
    }

    const plotSet = new Set<string>();
    for (const link of inv.links) {
      if (link.targetType === 'plot') {
        plotSet.add(link.targetId);
      } else {
        for (const pid of input.entityPlots.get(link.targetId) ?? []) {
          plotSet.add(pid);
        }
      }
    }
    investigatorPlots[inv.id] = [...plotSet];
    for (const pid of plotSet) coveredPlotIds.add(pid);
  }

  const plotsWithoutInvestigator = input.plots
    .filter((p) => !coveredPlotIds.has(p.id))
    .map((p) => ({ id: p.id, name: p.name }));

  return { investigatorsWithoutLink, plotsWithoutInvestigator, investigatorPlots };
}
