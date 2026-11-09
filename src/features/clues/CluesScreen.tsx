import { useMemo, useState } from 'react';
import { Link2, Trash2 } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { ScreenHeader, Button, Chip } from '@/components/ui';
import type { ClueEntity, ClueStatus } from '@/db/schema';

const STATUSES: ClueStatus[] = ['nao-descoberta', 'descoberta', 'perdida'];
const STATUS_TONE: Record<ClueStatus, 'muted' | 'accent' | 'secret'> = {
  'nao-descoberta': 'muted',
  descoberta: 'accent',
  perdida: 'secret',
};

/** Gerenciador de Pistas: filterable table (section 6.6). */
export function CluesScreen() {
  const clues = useLiveData(() => db.clues.toArray(), []);
  const plots = useLiveData(() => db.plots.toArray(), []) ?? [];
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];

  const [plotFilter, setPlotFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClueStatus | ''>('');
  const [bridgeOnly, setBridgeOnly] = useState(false);

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
  }

  async function setStatus(id: string, status: ClueStatus) {
    await db.clues.update(id, { status, updatedAt: new Date().toISOString() });
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Gerenciador de Pistas">
        <Button variant="accent" onClick={addClue}>+ Nova pista</Button>
      </ScreenHeader>

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 text-sm">
        <select className="rounded border border-border bg-surface-2 px-2 py-1" value={plotFilter} onChange={(e) => setPlotFilter(e.target.value)}>
          <option value="">Todas as tramas</option>
          {plots.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
        <select className="rounded border border-border bg-surface-2 px-2 py-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ClueStatus | '')}>
          <option value="">Todos os status</option>
          {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={bridgeOnly} onChange={(e) => setBridgeOnly(e.target.checked)} /> só pontes
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface-2 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-2">Pista</th>
              <th className="px-3 py-2">Tramas</th>
              <th className="px-3 py-2">Local</th>
              <th className="px-3 py-2">Como obter</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border align-top hover:bg-surface-2/40">
                <td className="px-3 py-2">
                  <input
                    className="w-full bg-transparent"
                    value={c.text}
                    onChange={(e) => db.clues.update(c.id, { text: e.target.value, updatedAt: new Date().toISOString() })}
                  />
                  {c.isBridge && <Chip tone="accent"><Link2 size={10} className="mr-0.5 inline" />ponte</Chip>}
                </td>
                <td className="px-3 py-2">{c.plotIds.map(plotName).join(', ')}</td>
                <td className="px-3 py-2">{locName(c.locationId)}</td>
                <td className="px-3 py-2 text-muted">
                  {c.howToObtain.method}
                  {c.howToObtain.difficulty ? ` (${c.howToObtain.difficulty})` : ''}
                </td>
                <td className="px-3 py-2">
                  <select
                    className={`rounded border border-border bg-surface-2 px-1 py-0.5 text-xs`}
                    value={c.status}
                    onChange={(e) => setStatus(c.id, e.target.value as ClueStatus)}
                  >
                    {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                  <span className="ml-1"><Chip tone={STATUS_TONE[c.status]}>{c.status}</Chip></span>
                </td>
                <td className="px-3 py-2">
                  <button className="text-muted hover:text-secret" onClick={() => { if (confirm('Apagar pista?')) void db.clues.delete(c.id); }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">Nenhuma pista.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
