import { useState } from 'react';
import { X, Plus, Trash2, Users } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { Button, IconButton, Field, TextInput } from '@/components/ui';
import { useUiStore } from '@/state/uiStore';
import type { TableEntity } from '@/db/schema';

async function patch(id: string, changes: Partial<TableEntity>) {
  await db.gameTables.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

/** Create and manage game tables (mesas) and their players. */
export function TablesManager({ onClose }: { onClose: () => void }) {
  const tables = useLiveData(() => db.gameTables.toArray(), []) ?? [];
  const setActiveTableId = useUiStore((s) => s.setActiveTableId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tables.find((t) => t.id === selectedId) ?? null;

  async function addTable() {
    const t: TableEntity = {
      ...newBase(),
      name: `Mesa ${tables.length + 1}`,
      players: [],
      inGameDate: '',
    };
    await db.gameTables.put(t);
    setSelectedId(t.id);
    setActiveTableId(t.id);
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div className="animate-in flex h-[80vh] w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* List */}
        <div className="flex w-64 shrink-0 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="font-serif text-lg">Mesas</span>
            <Button variant="accent" onClick={addTable}><Plus size={14} /> Nova</Button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {tables.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setSelectedId(t.id)}
                  className={`mb-1 w-full rounded-md border px-2.5 py-2 text-left text-sm transition-colors ${selectedId === t.id ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-surface-2'}`}
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="block text-xs text-muted">{t.players.length} jogador(es){t.inGameDate ? ` · ${t.inGameDate}` : ''}</span>
                </button>
              </li>
            ))}
            {tables.length === 0 && <li className="px-2 py-3 text-sm text-muted">Nenhuma mesa. Crie a primeira.</li>}
          </ul>
        </div>

        {/* Detail */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-sm text-muted">Detalhes da mesa</span>
            <IconButton label="Fechar" onClick={onClose}><X size={18} /></IconButton>
          </div>

          {selected ? (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome da mesa"><TextInput value={selected.name} onChange={(e) => patch(selected.id, { name: e.target.value })} /></Field>
                <Field label="Data em jogo" hint="texto livre"><TextInput value={selected.inGameDate} onChange={(e) => patch(selected.id, { inGameDate: e.target.value })} placeholder="ex.: 14 de setembro de 1925" /></Field>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted"><Users size={13} /> Jogadores</span>
                  <Button onClick={() => patch(selected.id, { players: [...selected.players, { name: '', characterName: '' }] })}><Plus size={13} /> jogador</Button>
                </div>
                <div className="space-y-2">
                  {selected.players.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <TextInput className="flex-1" placeholder="Jogador" value={p.name} onChange={(e) => { const players = [...selected.players]; players[i] = { ...players[i], name: e.target.value }; void patch(selected.id, { players }); }} />
                      <TextInput className="flex-1" placeholder="Investigador" value={p.characterName} onChange={(e) => { const players = [...selected.players]; players[i] = { ...players[i], characterName: e.target.value }; void patch(selected.id, { players }); }} />
                      <IconButton label="Remover jogador" tone="danger" onClick={() => patch(selected.id, { players: selected.players.filter((_, j) => j !== i) })}><Trash2 size={14} /></IconButton>
                    </div>
                  ))}
                  {selected.players.length === 0 && <p className="text-sm italic text-muted">Sem jogadores ainda.</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-border pt-3">
                <Button variant="accent" onClick={() => { setActiveTableId(selected.id); onClose(); }}>Tornar mesa ativa</Button>
                <Button variant="danger" onClick={() => { if (confirm(`Apagar a mesa "${selected.name}"?`)) { void db.gameTables.delete(selected.id); setSelectedId(null); } }}><Trash2 size={14} /> Apagar</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted">Selecione ou crie uma mesa.</div>
          )}
        </div>
      </div>
    </div>
  );
}
