import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { ScreenHeader, Button, Field, TextInput, TextArea, Chip } from '@/components/ui';
import type { FactionEntity, FactionPlotLayer } from '@/db/schema';

async function patch(id: string, changes: Partial<FactionEntity>) {
  await db.factions.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

/** Facções: sheet with members, locations and controlled plots (section 6.4). */
export function FactionsScreen() {
  const factions = useLiveData(() => db.factions.toArray(), []);
  const npcs = useLiveData(() => db.npcs.toArray(), []) ?? [];
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];
  const plots = useLiveData(() => db.plots.toArray(), []) ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = factions?.find((f) => f.id === selectedId);

  async function addFaction() {
    const f: FactionEntity = {
      ...newBase(),
      name: 'Nova facção',
      goals: '',
      resources: '',
      memberNpcIds: [],
      locationIds: [],
      layers: [],
    };
    await db.factions.put(f);
    setSelectedId(f.id);
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <ScreenHeader title="Facções">
          <Button variant="accent" onClick={addFaction}>+ Nova facção</Button>
        </ScreenHeader>
        <div className="grid flex-1 content-start gap-2 overflow-y-auto p-4 sm:grid-cols-2">
          {factions?.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedId(f.id)}
              className={`rounded-lg border p-3 text-left ${selectedId === f.id ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:bg-surface-2'}`}
            >
              <span className="font-serif text-lg">{f.name}</span>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{f.goals || 'Sem objetivos definidos.'}</p>
              <div className="mt-1 flex gap-1">
                <Chip>{f.memberNpcIds.length} membro(s)</Chip>
                <Chip>{f.locationIds.length} local(is)</Chip>
              </div>
            </button>
          ))}
          {factions?.length === 0 && <p className="text-muted">Nenhuma facção ainda.</p>}
        </div>
      </div>

      {selected && (
        <aside className="w-[420px] shrink-0 overflow-y-auto border-l border-border bg-surface">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
            <h2 className="font-serif text-xl">{selected.name}</h2>
            <button className="text-muted hover:text-text" onClick={() => setSelectedId(null)} aria-label="Fechar"><X size={18} /></button>
          </div>
          <div className="space-y-3 p-4">
            <Field label="Nome"><TextInput value={selected.name} onChange={(e) => patch(selected.id, { name: e.target.value })} /></Field>
            <Field label="Objetivos"><TextArea rows={2} value={selected.goals} onChange={(e) => patch(selected.id, { goals: e.target.value })} /></Field>
            <Field label="Recursos"><TextArea rows={2} value={selected.resources} onChange={(e) => patch(selected.id, { resources: e.target.value })} /></Field>
            <Field label="Símbolo"><TextInput value={selected.symbol ?? ''} onChange={(e) => patch(selected.id, { symbol: e.target.value })} /></Field>

            <Field label="Membros">
              <div className="flex flex-wrap gap-1">
                {npcs.map((n) => {
                  const on = selected.memberNpcIds.includes(n.id);
                  return (
                    <button key={n.id} onClick={() => patch(selected.id, { memberNpcIds: on ? selected.memberNpcIds.filter((x) => x !== n.id) : [...selected.memberNpcIds, n.id] })}
                      className={`rounded px-2 py-0.5 text-[11px] ${on ? 'bg-accent/20 text-accent' : 'bg-surface-2 text-muted'}`}>{n.name}</button>
                  );
                })}
              </div>
            </Field>

            <Field label="Locais">
              <div className="flex flex-wrap gap-1">
                {locations.filter((l) => l.kind !== 'distrito').map((l) => {
                  const on = selected.locationIds.includes(l.id);
                  return (
                    <button key={l.id} onClick={() => patch(selected.id, { locationIds: on ? selected.locationIds.filter((x) => x !== l.id) : [...selected.locationIds, l.id] })}
                      className={`rounded px-2 py-0.5 text-[11px] ${on ? 'bg-accent/20 text-accent' : 'bg-surface-2 text-muted'}`}>{l.name}</button>
                  );
                })}
              </div>
            </Field>

            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Camadas de trama</p>
              {selected.layers.map((layer, i) => (
                <div key={i} className="mb-2 rounded border border-border bg-surface-2/40 p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <select className="rounded border border-border bg-surface-2 px-2 py-1 text-sm" value={layer.plotId}
                      onChange={(e) => updateLayer(selected, i, { plotId: e.target.value })}>
                      <option value="">— trama —</option>
                      {plots.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                    <button className="text-muted hover:text-secret" onClick={() => patch(selected.id, { layers: selected.layers.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
                  </div>
                  <TextArea rows={2} value={layer.whatChanges} onChange={(e) => updateLayer(selected, i, { whatChanges: e.target.value })} placeholder="O que muda quando a trama ativa…" />
                </div>
              ))}
              <Button onClick={() => patch(selected.id, { layers: [...selected.layers, { plotId: plots[0]?.id ?? '', whatChanges: '' }] })}>
                <Plus size={12} className="inline" /> camada
              </Button>
            </div>

            <button className="flex items-center gap-1 text-xs text-muted hover:text-secret"
              onClick={() => { if (confirm(`Apagar "${selected.name}"?`)) { void db.factions.delete(selected.id); setSelectedId(null); } }}>
              <Trash2 size={13} /> Apagar facção
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

function updateLayer(f: FactionEntity, index: number, changes: Partial<FactionPlotLayer>) {
  const layers = [...f.layers];
  layers[index] = { ...layers[index], ...changes };
  void patch(f.id, { layers });
}
