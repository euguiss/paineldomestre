import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Play, Pause, RotateCcw, GripVertical } from 'lucide-react';
import type { SessionZeroEntity } from '@/db/schema';
import { patchSz } from './SessionZeroScreen';
import { TextInput, TextArea, Button } from '@/components/ui';

/** Roteiro: ordered blocks with estimated time, notes, done flag, timer. */
export function RoteiroTab({ sz }: { sz: SessionZeroEntity }) {
  function update(index: number, changes: Partial<SessionZeroEntity['agenda'][number]>) {
    const agenda = [...sz.agenda];
    agenda[index] = { ...agenda[index], ...changes };
    void patchSz(sz.id, { agenda });
  }

  function move(index: number, dir: -1 | 1) {
    const agenda = [...sz.agenda];
    const j = index + dir;
    if (j < 0 || j >= agenda.length) return;
    [agenda[index], agenda[j]] = [agenda[j], agenda[index]];
    void patchSz(sz.id, { agenda });
  }

  const totalMin = sz.agenda.reduce((a, b) => a + b.estimatedMinutes, 0);
  const doneCount = sz.agenda.filter((a) => a.done).length;

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {doneCount}/{sz.agenda.length} blocos · ~{totalMin} min estimados
        </p>
        <Timer />
      </div>

      {sz.agenda.map((block, i) => (
        <div key={i} className={`rounded border p-3 ${block.done ? 'border-accent/40 bg-accent/5' : 'border-border bg-surface'}`}>
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-muted">
              <button onClick={() => move(i, -1)} aria-label="Mover para cima" className="hover:text-text"><GripVertical size={14} /></button>
            </div>
            <input type="checkbox" checked={block.done} onChange={(e) => update(i, { done: e.target.checked })} aria-label="Concluído" />
            <TextInput className="flex-1 font-medium" value={block.title} onChange={(e) => update(i, { title: e.target.value })} />
            <input
              type="number"
              min={0}
              className="w-16 rounded border border-border bg-surface-2 px-1 py-1 text-sm"
              value={block.estimatedMinutes}
              onChange={(e) => update(i, { estimatedMinutes: Number(e.target.value) })}
              aria-label="Minutos estimados"
            />
            <span className="text-xs text-muted">min</span>
            <div className="flex flex-col">
              <button onClick={() => move(i, 1)} className="text-muted hover:text-text" aria-label="Mover para baixo"><GripVertical size={14} /></button>
            </div>
            <button className="text-muted hover:text-secret" onClick={() => patchSz(sz.id, { agenda: sz.agenda.filter((_, j) => j !== i) })} aria-label="Remover bloco">
              <Trash2 size={14} />
            </button>
          </div>
          <TextArea className="mt-2" rows={2} value={block.notes} onChange={(e) => update(i, { notes: e.target.value })} placeholder="Anotações do bloco…" />
        </div>
      ))}

      <Button variant="accent" onClick={() => patchSz(sz.id, { agenda: [...sz.agenda, { title: 'Novo bloco', estimatedMinutes: 10, notes: '', done: false }] })}>
        <Plus size={14} className="mr-1 inline" /> bloco
      </Button>
    </div>
  );
}

/** Optional stopwatch for the current block. */
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-sm">
      <span className="tabular-nums">{mm}:{ss}</span>
      <button className="text-muted hover:text-accent" onClick={() => setRunning((r) => !r)} aria-label={running ? 'Pausar' : 'Iniciar'}>
        {running ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button className="text-muted hover:text-text" onClick={() => { setRunning(false); setSeconds(0); }} aria-label="Zerar">
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
