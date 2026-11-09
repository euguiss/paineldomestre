import { useState } from 'react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { ScreenHeader, Button } from '@/components/ui';
import { PlotCard } from './PlotCard';
import type { PlotEntity } from '@/db/schema';

/** Quadro de Tramas: cards with clock, state and threat (section 6.5). */
export function PlotsScreen() {
  const plots = useLiveData(() => db.plots.toArray(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function addPlot() {
    const plot: PlotEntity = {
      ...newBase(),
      name: 'Nova trama',
      sourceModule: '',
      threatLevel: 1,
      hiddenTruth: '',
      antagonists: '',
      state: 'dormente',
      clock: { segments: 6, filled: 0, advanceRules: [] },
      scheduledBeats: [],
      conclusions: [],
    };
    await db.plots.put(plot);
    setSelectedId(plot.id);
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Quadro de Tramas">
        <Button variant="accent" onClick={addPlot}>
          + Nova trama
        </Button>
      </ScreenHeader>
      <div className="grid flex-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 xl:grid-cols-3">
        {plots?.map((p) => (
          <PlotCard
            key={p.id}
            plot={p}
            expanded={selectedId === p.id}
            onToggle={() => setSelectedId(selectedId === p.id ? null : p.id)}
          />
        ))}
        {plots?.length === 0 && <p className="text-muted">Nenhuma trama ainda.</p>}
      </div>
    </div>
  );
}
