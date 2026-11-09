import { useMemo, useState } from 'react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { ScreenHeader, Button, Chip, TextInput } from '@/components/ui';
import { NpcDetail } from './NpcDetail';
import type { NpcEntity, NpcStatus } from '@/db/schema';

const STATUS_TONE: Record<NpcStatus, 'muted' | 'accent' | 'secret'> = {
  vivo: 'accent',
  morto: 'secret',
  desaparecido: 'secret',
  enlouquecido: 'secret',
  convertido: 'muted',
  outro: 'muted',
};

/** NPCs: searchable/filterable grid + detail with tabs (section 6.3). */
export function NpcsScreen() {
  const npcs = useLiveData(() => db.npcs.toArray(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<NpcStatus | ''>('');

  const filtered = useMemo(() => {
    return (npcs ?? []).filter((n) => {
      if (statusFilter && n.status !== statusFilter) return false;
      if (query && !n.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [npcs, query, statusFilter]);

  async function addNpc() {
    const npc: NpcEntity = {
      ...newBase(),
      name: 'Novo NPC',
      appearance: '',
      voiceAndMannerisms: '',
      typicalLines: [],
      factionIds: [],
      statBlock: { markdown: '' },
      schedule: [],
      status: 'vivo',
      isKnownToPlayers: false,
      layers: [],
    };
    await db.npcs.put(npc);
    setSelectedId(npc.id);
  }

  const selected = npcs?.find((n) => n.id === selectedId);

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <ScreenHeader title="NPCs">
          <Button variant="accent" onClick={addNpc}>+ Novo NPC</Button>
        </ScreenHeader>
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <TextInput placeholder="Buscar por nome…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
          <select
            className="rounded border border-border bg-surface-2 px-2 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as NpcStatus | '')}
          >
            <option value="">Todos os status</option>
            {(['vivo', 'morto', 'desaparecido', 'enlouquecido', 'convertido', 'outro'] as NpcStatus[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="grid flex-1 content-start gap-2 overflow-y-auto p-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedId(n.id)}
              className={`rounded-lg border p-3 text-left ${
                selectedId === n.id ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:bg-surface-2'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg">{n.name}</span>
                <Chip tone={STATUS_TONE[n.status]}>{n.status}</Chip>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{n.appearance || 'Sem descrição.'}</p>
              {n.layers.length > 0 && <p className="mt-1 text-[11px] text-accent">{n.layers.length} camada(s) de trama</p>}
            </button>
          ))}
          {filtered.length === 0 && <p className="text-muted">Nenhum NPC encontrado.</p>}
        </div>
      </div>

      {selected && (
        <aside className="flex w-[480px] shrink-0 flex-col overflow-hidden border-l border-border bg-surface">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NpcDetail npc={selected} onClose={() => setSelectedId(null)} />
          </div>
        </aside>
      )}
    </div>
  );
}
