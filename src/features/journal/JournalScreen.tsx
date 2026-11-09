import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { ScreenHeader, Chip } from '@/components/ui';
import type { EventEntity, EventType } from '@/db/schema';

const TYPE_TONE: Record<EventType, 'muted' | 'accent' | 'secret'> = {
  descoberta: 'accent',
  morte: 'secret',
  'avanco-de-relogio': 'accent',
  'mudanca-de-estado': 'accent',
  nota: 'muted',
  'entrega-de-handout': 'accent',
  outro: 'muted',
};

/** Diário / Linha do Tempo: events by in-game date, filterable (section 6.9). */
export function JournalScreen() {
  const events = useLiveData(() => db.events.toArray(), []);
  const tables = useLiveData(() => db.gameTables.toArray(), []) ?? [];
  const [tableFilter, setTableFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | ''>('');

  const tableName = (id?: string) => (id ? tables.find((t) => t.id === id)?.name ?? '—' : 'mundo');

  const filtered = useMemo(() => {
    const list = (events ?? []).filter((e) => {
      if (tableFilter && e.tableId !== tableFilter) return false;
      if (typeFilter && e.type !== typeFilter) return false;
      return true;
    });
    // newest first by creation order; in-game date is free text, so we keep
    // insertion order (reversed) as the stable timeline.
    return [...list].reverse();
  }, [events, tableFilter, typeFilter]);

  async function updateText(id: string, text: string) {
    await db.events.update(id, { text, updatedAt: new Date().toISOString() });
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Diário / Linha do Tempo" />
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 text-sm">
        <select className="rounded border border-border bg-surface-2 px-2 py-1" value={tableFilter} onChange={(e) => setTableFilter(e.target.value)}>
          <option value="">Todas as mesas</option>
          {tables.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
        </select>
        <select className="rounded border border-border bg-surface-2 px-2 py-1" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as EventType | '')}>
          <option value="">Todos os tipos</option>
          {(Object.keys(TYPE_TONE) as EventType[]).map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <p className="text-muted">Nenhum evento registrado.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-4">
            {filtered.map((e: EventEntity) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[21px] top-2 h-2 w-2 rounded-full bg-accent" />
                <div className="rounded border border-border bg-surface p-2">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                    <span>{e.inGameDate}</span>
                    <Chip tone={TYPE_TONE[e.type]}>{e.type}</Chip>
                    <span>· {tableName(e.tableId)}</span>
                    <button className="ml-auto text-muted hover:text-secret" onClick={() => { if (confirm('Apagar evento?')) void db.events.delete(e.id); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <textarea
                    className="w-full resize-none rounded bg-transparent text-sm focus:bg-surface-2"
                    rows={Math.max(1, Math.ceil(e.text.length / 60))}
                    value={e.text}
                    onChange={(ev) => updateText(e.id, ev.target.value)}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
