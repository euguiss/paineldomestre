import type { ClueEntity, Conclusion, PlotEntity } from '@/db/schema';

/** The minimum number of still-available clues each conclusion should have. */
export const MIN_CLUES_PER_CONCLUSION = 3;

export interface ConclusionCoverage {
  plotId: string;
  plotName: string;
  conclusion: Conclusion;
  /** Clues that still point to this conclusion and are not yet discovered. */
  availableClueCount: number;
  /** True when below the three-clue threshold (yellow alert). */
  isUnderCovered: boolean;
}

/**
 * Regra dos três (section 5.5): for each conclusion, count how many
 * NOT-yet-discovered clues still lead to it. If fewer than three, flag it.
 *
 * A clue "leads to" a conclusion when `clue.revealsConclusionId` matches.
 * Pure & testable.
 */
export function computeConclusionCoverage(plots: PlotEntity[], clues: ClueEntity[]): ConclusionCoverage[] {
  const result: ConclusionCoverage[] = [];

  for (const plot of plots) {
    for (const conclusion of plot.conclusions) {
      const availableClueCount = clues.filter(
        (c) => c.revealsConclusionId === conclusion.id && c.status === 'nao-descoberta',
      ).length;

      result.push({
        plotId: plot.id,
        plotName: plot.name,
        conclusion,
        availableClueCount,
        isUnderCovered: availableClueCount < MIN_CLUES_PER_CONCLUSION,
      });
    }
  }

  return result;
}

/** Just the under-covered conclusions, for the alert panel. */
export function underCoveredConclusions(plots: PlotEntity[], clues: ClueEntity[]): ConclusionCoverage[] {
  return computeConclusionCoverage(plots, clues).filter((c) => c.isUnderCovered);
}
