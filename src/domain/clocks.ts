import type { Beat, PlotEntity } from '@/db/schema';

export interface PlotAdvance {
  plotId: string;
  /** How many segments to add to this plot's clock. */
  by: number;
}

export interface SuggestedBeat {
  plotId: string;
  plotName: string;
  beat: Beat;
  /** The segment index that triggered it. */
  triggeredAtSegment: number;
}

/**
 * Compute which beats become due when a set of plots advance their clocks
 * (section 5.4). A beat at segment N is suggested when the clock crosses from
 * below N to >= N. The app only SUGGESTS — the Keeper confirms before effects
 * are applied. Pure & testable.
 */
export function suggestBeatsForAdvance(
  plots: PlotEntity[],
  advances: PlotAdvance[],
): SuggestedBeat[] {
  const byId = new Map(plots.map((p) => [p.id, p]));
  const suggested: SuggestedBeat[] = [];

  for (const adv of advances) {
    const plot = byId.get(adv.plotId);
    if (!plot || adv.by <= 0) continue;

    const before = plot.clock.filled;
    const after = Math.min(plot.clock.segments, before + adv.by);

    for (const beat of plot.scheduledBeats) {
      // Triggered when the beat's segment is newly reached by this advance.
      if (beat.atSegment > before && beat.atSegment <= after) {
        suggested.push({
          plotId: plot.id,
          plotName: plot.name,
          beat,
          triggeredAtSegment: beat.atSegment,
        });
      }
    }
  }

  // Order by plot then segment for a stable queue.
  suggested.sort((a, b) =>
    a.plotName === b.plotName ? a.triggeredAtSegment - b.triggeredAtSegment : a.plotName.localeCompare(b.plotName),
  );

  return suggested;
}

/** The resulting filled value after an advance, clamped to the segment count. */
export function clampedFilled(plot: PlotEntity, by: number): number {
  return Math.max(0, Math.min(plot.clock.segments, plot.clock.filled + by));
}
