import { useState } from 'react';
import type { SuggestedBeat } from '@/domain/clocks';
import { Button } from '@/components/ui';
import { KeeperMarkdown } from '@/markdown/KeeperMarkdown';
import { recordEvent } from '@/domain/effects';
import { useSessionContext } from '@/features/shared/useSessionContext';

interface Props {
  suggested: SuggestedBeat[];
  onDone: () => void;
}

/**
 * "Acontecendo no mundo" queue (section 5.4): each suggested beat can be
 * confirmed (applies its effects + logs an event), edited, or discarded.
 * Nothing is applied automatically.
 */
export function BeatQueue({ suggested, onDone }: Props) {
  const ctx = useSessionContext();
  const [pending, setPending] = useState(suggested);
  const [edits, setEdits] = useState<Record<number, string>>({});

  async function confirm(index: number) {
    const item = pending[index];
    const text = edits[index] ?? `${item.beat.title}: ${item.beat.description}`;
    await recordEvent({
      type: 'outro',
      text: `[${item.plotName}] ${text}`,
      inGameDate: ctx.inGameDate,
      tableId: ctx.tableId ?? undefined,
      linkedEntityIds: [item.plotId],
      effects: item.beat.effects,
    });
    remove(index);
  }

  function remove(index: number) {
    const next = pending.filter((_, i) => i !== index);
    setPending(next);
    if (next.length === 0) onDone();
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-10">
      <div className="w-full max-w-xl rounded-lg border border-border bg-surface p-4 shadow-xl">
        <h3 className="mb-1 font-serif text-lg">Acontecendo no mundo</h3>
        <p className="mb-3 text-xs text-muted">
          O relógio atingiu marcos com eventos. Confirme, edite ou descarte cada um — nada é aplicado sozinho.
        </p>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          {pending.map((item, i) => (
            <div key={i} className="rounded border border-accent/40 bg-accent/5 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{item.beat.title}</span>
                <span className="text-xs text-accent">{item.plotName} · segmento {item.triggeredAtSegment}</span>
              </div>
              <KeeperMarkdown>{item.beat.description}</KeeperMarkdown>
              {item.beat.effects.length > 0 && (
                <p className="mt-1 text-xs text-muted">{item.beat.effects.length} efeito(s) serão aplicados ao confirmar.</p>
              )}
              <textarea
                className="mt-2 w-full rounded border border-border bg-surface-2 px-2 py-1 text-sm"
                rows={2}
                placeholder="Editar texto do evento (opcional)…"
                value={edits[i] ?? ''}
                onChange={(e) => setEdits((prev) => ({ ...prev, [i]: e.target.value }))}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button onClick={() => remove(i)}>Descartar</Button>
                <Button variant="accent" onClick={() => confirm(i)}>Confirmar</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-end">
          <Button onClick={onDone}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}
