import { useState } from 'react';
import { X } from 'lucide-react';
import type { PlotEntity } from '@/db/schema';
import { suggestBeatsForAdvance, clampedFilled, type PlotAdvance } from '@/domain/clocks';
import { Button, Field } from '@/components/ui';
import { db } from '@/db/database';
import { useSessionContext } from '@/features/shared/useSessionContext';
import { recordEvent } from '@/domain/effects';
import { BeatQueue } from './BeatQueue';
import type { SuggestedBeat } from '@/domain/clocks';

interface Props {
  plots: PlotEntity[];
  onClose: () => void;
}

/**
 * "Avançar tempo" (section 5.4 / 6.5): choose how many in-game days pass and
 * which plots advance and by how much. Beats that become due are SUGGESTED in
 * a queue; the Keeper confirms, edits or discards each one.
 */
export function AdvanceTimeDialog({ plots, onClose }: Props) {
  const ctx = useSessionContext();
  const [days, setDays] = useState(1);
  const [advances, setAdvances] = useState<Record<string, number>>({});
  const [queue, setQueue] = useState<SuggestedBeat[] | null>(null);

  function setAdvance(plotId: string, by: number) {
    setAdvances((prev) => ({ ...prev, [plotId]: by }));
  }

  async function apply() {
    const list: PlotAdvance[] = Object.entries(advances)
      .map(([plotId, by]) => ({ plotId, by }))
      .filter((a) => a.by > 0);

    // Suggest beats BEFORE mutating, using current filled values.
    const suggested = suggestBeatsForAdvance(plots, list);

    // Apply the clock advances and log an event per plot.
    for (const a of list) {
      const plot = plots.find((p) => p.id === a.plotId);
      if (!plot) continue;
      const filled = clampedFilled(plot, a.by);
      await db.plots.update(a.plotId, { clock: { ...plot.clock, filled }, updatedAt: new Date().toISOString() });
      await recordEvent({
        type: 'avanco-de-relogio',
        text: `Tempo avançou ${days} dia(s). Relógio de "${plot.name}" +${a.by} (→ ${filled}/${plot.clock.segments}).`,
        inGameDate: ctx.inGameDate,
        tableId: ctx.tableId ?? undefined,
        linkedEntityIds: [plot.id],
      });
    }

    if (suggested.length > 0) {
      setQueue(suggested);
    } else {
      onClose();
    }
  }

  if (queue) {
    return <BeatQueue suggested={queue} onDone={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-10" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg">Avançar tempo</h3>
          <button className="text-muted hover:text-text" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>

        <Field label="Quantos dias de jogo passam?">
          <input type="number" min={0} className="w-24 rounded border border-border bg-surface-2 px-2 py-1 text-sm" value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </Field>

        <p className="mt-3 mb-1 text-xs font-medium uppercase tracking-wide text-muted">Quais tramas avançam e quanto?</p>
        <div className="space-y-1">
          {plots.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded border border-border bg-surface-2 px-2 py-1 text-sm">
              <span>{p.name} <span className="text-muted">({p.clock.filled}/{p.clock.segments})</span></span>
              <input
                type="number"
                min={0}
                max={p.clock.segments}
                className="w-16 rounded border border-border bg-surface px-1 py-0.5 text-sm"
                value={advances[p.id] ?? 0}
                onChange={(e) => setAdvance(p.id, Number(e.target.value))}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="accent" onClick={apply}>Avançar</Button>
        </div>
      </div>
    </div>
  );
}
