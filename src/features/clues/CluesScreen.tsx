import { useMemo, useState } from 'react';
import { Link2 } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { ScreenHeader, Button, Chip, Select } from '@/components/ui';
import { ClueDetail } from './ClueDetail';
import type { ClueEntity, ClueStatus } from '@/db/schema';

const STATUSES: ClueStatus[] = ['nao-descoberta', 'descoberta', 'perdida'];
const STATUS_LABEL: Record<ClueStatus, string> = {
  'nao-descoberta': 'Não descoberta',
  descoberta: 'Descoberta',
  perdida: 'Perdida',
};
const STATUS_TONE: Record<ClueStatus, 'muted' | 'accent' | 'secret'> = {
  'nao-descoberta': 'muted',
  descoberta: 'accent',
  perdida: 'secret',
};

/** Gerenciador de Pistas: filtered list + per-clue detail editor (section 6.6). */
export function CluesScreen() {
  const clues = useLiveData(() => db.clues.toArray(), []);
  const plots = useLiveData(() => db.plots.toArray(), []) ?? [];
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];

  const [plotFilter, setPlotFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClueStatus | ''>('');
  const [bridgeOnly, setBridgeOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const plotName = (id: string) => plots.find((p) => p.id === id)?.name ?? '—';
  const locName = (id?: string) => (id ? locations.find((l) => l.id === id)?.name ?? '—' : '—');

  const filtered = useMemo(() => {
    return (clues ?? []).filter((c) => {
      if (plotFilter && !c.plotIds.includes(plotFilter)) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (bridgeOnly && !c.isBridge) return false;
      return true;
    });
  }, [clues, plotFilter, statusFilter, bridgeOnly]);

  async function addClue() {
    const clue: ClueEntity = {
      ...newBase(),
      text: 'Nova pista',
      plotIds: plots[0] ? [plots[0].id] : [],
      howToObtain: { method: '' },
      pointsToPlotIds: [],
      isBridge: false,
      handoutIds: [],
      status: 'nao-descoberta',
    };
    await db.clues.put(clue);
    setSelectedId(clue.id);
  }

  const selected = clues?.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <ScreenHeader title="Gerenciador de Pistas">
          <Button variant="accent" onClick={addClue}>+ Nova pista</Button>
        </ScreenHeader>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-2 text-sm">
          <Select className="w-auto" value={plotFilter} onChange={(e) => setPlotFilter(e.target.value)}>
            <option value="">Todas as tramas</option>
            {plots.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </Select>
          <Select className="w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ClueStatus | '')}>
            <option value="">Todos os status</option>
            {STATUSES.map((s) => (<option key={s} value={s}>{STATUS_LABEL[s]}</option>))}
          </Select>
          <label className="flex items-center gap-1.5 text-muted">
            <input type="checkbox" checked={bridgeOnly} onChange={(e) => setBridgeOnly(e.target.checked)} /> só pontes
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <ul className="space-y-2">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className={`block w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${selectedId === c.id ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:bg-surface-2'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm">{c.text || '(sem texto)'}</span>
                    <Chip tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Chip>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                    {c.isBridge && <Chip tone="accent"><Link2 size={10} className="mr-0.5 inline" />ponte</Chip>}
                    <span>{c.plotIds.map(plotName).join(', ') || 'sem trama'}</span>
                    <span>· {locName(c.locationId)}</span>
                    {c.handoutIds.length > 0 && <span>· {c.handoutIds.length} handout(s)</span>}
                  </div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-8 text-center text-muted">Nenhuma pista. Crie a primeira.</li>}
          </ul>
        </div>
      </div>

      {selected && (
        <aside className="flex w-[460px] shrink-0 flex-col overflow-hidden border-l border-border bg-surface">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ClueDetail key={selected.id} clue={selected} onClose={() => setSelectedId(null)} onDeleted={() => setSelectedId(null)} />
          </div>
        </aside>
      )}
    </div>
  );
}
