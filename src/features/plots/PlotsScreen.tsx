import { useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { ScreenHeader, Button, Chip } from '@/components/ui';
import { PlotCard } from './PlotCard';
import { AdvanceTimeDialog } from './AdvanceTimeDialog';
import { underCoveredConclusions } from '@/domain/threeCluesRule';
import type { PlotEntity } from '@/db/schema';

/** Quadro de Tramas: cards with clock, state and threat (section 6.5). */
export function PlotsScreen() {
  const plots = useLiveData(() => db.plots.toArray(), []);
  const clues = useLiveData(() => db.clues.toArray(), []) ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const underCovered = underCoveredConclusions(plots ?? [], clues);

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
        <Button onClick={() => setAdvancing(true)}>
          <Clock size={14} className="mr-1 inline" /> Avançar tempo
        </Button>
        <Button variant="accent" onClick={addPlot}>
          + Nova trama
        </Button>
      </ScreenHeader>

      {/* Three-clue rule alert (5.5) */}
      {underCovered.length > 0 && (
        <div className="border-b border-secret/30 bg-secret/10 px-4 py-2 text-sm text-secret">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle size={15} /> Conclusões com poucas pistas (regra dos três)
          </div>
          <ul className="mt-1 flex flex-wrap gap-2">
            {underCovered.map((c) => (
              <Chip key={c.conclusion.id} tone="secret">
                {c.plotName} · {c.conclusion.title}: {c.availableClueCount}/3
              </Chip>
            ))}
          </ul>
        </div>
      )}

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

      {advancing && plots && <AdvanceTimeDialog plots={plots} onClose={() => setAdvancing(false)} />}
    </div>
  );
}
