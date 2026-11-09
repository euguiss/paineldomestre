import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import type { PlotEntity, PlotState } from '@/db/schema';
import { db } from '@/db/database';
import { ClockDisplay } from './ClockDisplay';
import { Chip, Field, TextInput, TextArea } from '@/components/ui';
import { KeeperMarkdown } from '@/markdown/KeeperMarkdown';

interface Props {
  plot: PlotEntity;
  expanded: boolean;
  onToggle: () => void;
}

const STATES: PlotState[] = ['dormente', 'ativa', 'escalando', 'resolvida', 'fracassada'];
const STATE_TONE: Record<PlotState, 'muted' | 'accent' | 'secret'> = {
  dormente: 'muted',
  ativa: 'accent',
  escalando: 'secret',
  resolvida: 'muted',
  fracassada: 'secret',
};

async function patch(id: string, changes: Partial<PlotEntity>) {
  await db.plots.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

/**
 * A plot card. Changing state or the clock here is what turns layers on/off
 * across the app (acceptance criterion: "mudar o estado de uma trama liga/
 * desliga suas camadas"), because the dossier re-evaluates live.
 */
export function PlotCard({ plot, expanded, onToggle }: Props) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface p-3">
      <div className="flex items-start gap-3">
        <ClockDisplay
          segments={plot.clock.segments}
          filled={plot.clock.filled}
          onChange={(filled) => patch(plot.id, { clock: { ...plot.clock, filled } })}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-serif text-lg">{plot.name}</h3>
            <button className="text-muted hover:text-text" onClick={onToggle} aria-label="Expandir trama">
              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Chip tone={STATE_TONE[plot.state]}>{plot.state}</Chip>
            <Chip>ameaça {plot.threatLevel}</Chip>
            <Chip>
              relógio {plot.clock.filled}/{plot.clock.segments}
            </Chip>
            {plot.sourceModule && <Chip>{plot.sourceModule}</Chip>}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <Field label="Nome">
            <TextInput value={plot.name} onChange={(e) => patch(plot.id, { name: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Estado">
              <select
                className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-sm"
                value={plot.state}
                onChange={(e) => patch(plot.id, { state: e.target.value as PlotState })}
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nível de ameaça">
              <TextInput
                type="number"
                min={0}
                max={10}
                value={plot.threatLevel}
                onChange={(e) => patch(plot.id, { threatLevel: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="Segmentos do relógio">
            <select
              className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-sm"
              value={plot.clock.segments}
              onChange={(e) =>
                patch(plot.id, {
                  clock: { ...plot.clock, segments: Number(e.target.value), filled: Math.min(plot.clock.filled, Number(e.target.value)) },
                })
              }
            >
              {[4, 6, 8, 12].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Verdade oculta (segredo do Mestre)">
            <TextArea rows={3} value={plot.hiddenTruth} onChange={(e) => patch(plot.id, { hiddenTruth: e.target.value })} />
          </Field>

          <Field label="Antagonistas">
            <TextArea rows={2} value={plot.antagonists} onChange={(e) => patch(plot.id, { antagonists: e.target.value })} />
          </Field>

          {/* Conclusions (read-only list for now; clue coverage lands in Fase 4) */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Conclusões</p>
            {plot.conclusions.length === 0 ? (
              <p className="text-sm italic text-muted">Nenhuma conclusão.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm">
                {plot.conclusions.map((c) => (
                  <li key={c.id} className="rounded border border-border bg-surface-2 px-2 py-1">
                    <span className="font-medium">{c.title}</span>
                    <p className="text-muted">{c.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Beats */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Marcos (beats)</p>
            {plot.scheduledBeats.length === 0 ? (
              <p className="text-sm italic text-muted">Nenhum marco.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm">
                {plot.scheduledBeats.map((b, i) => (
                  <li key={i} className="rounded border border-border bg-surface-2 px-2 py-1">
                    <span className="text-xs text-accent">no segmento {b.atSegment}</span>
                    <p className="font-medium">{b.title}</p>
                    <KeeperMarkdown>{b.description}</KeeperMarkdown>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            className="flex items-center gap-1 text-xs text-muted hover:text-secret"
            onClick={() => {
              if (confirm(`Apagar a trama "${plot.name}"?`)) void db.plots.delete(plot.id);
            }}
          >
            <Trash2 size={13} /> Apagar trama
          </button>
        </div>
      )}
    </div>
  );
}
