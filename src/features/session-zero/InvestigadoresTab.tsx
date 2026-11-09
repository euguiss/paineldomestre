import { useState } from 'react';
import { Plus, Trash2, Printer } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { Button } from '@/components/ui';
import { InvestigatorWizard } from './InvestigatorWizard';
import { printInvestigatorSheet } from './printSheet';
import { deriveAll } from '@/domain/cocRules';
import type { InvestigatorEntity } from '@/db/schema';

/** Criação de investigadores (section 13): list + wizard. */
export function InvestigadoresTab({ tableId }: { tableId: string }) {
  const investigators = useLiveData(
    () => db.investigators.where('tableId').equals(tableId).toArray(),
    [tableId],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = investigators?.find((i) => i.id === selectedId);

  async function addInvestigator() {
    const characteristics = { FOR: 50, CON: 50, TAM: 50, DES: 50, APA: 50, INT: 50, POD: 50, EDU: 50 };
    const inv: InvestigatorEntity = {
      ...newBase(),
      name: 'Novo investigador',
      playerName: '',
      tableId,
      concept: '',
      occupation: '',
      age: 30,
      characteristics,
      derived: deriveAll(characteristics),
      skills: [],
      backstory: '',
      equipment: '',
      hook: '',
      links: [],
      status: 'ativo',
      masterNotes: '',
    };
    await db.investigators.put(inv);
    setSelectedId(inv.id);
  }

  return (
    <div className="flex h-full">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-border p-3">
        <Button variant="accent" onClick={addInvestigator}><Plus size={14} className="mr-1 inline" /> investigador</Button>
        <ul className="mt-3 space-y-1">
          {investigators?.map((inv) => (
            <li key={inv.id}>
              <button onClick={() => setSelectedId(inv.id)} className={`w-full rounded border px-2 py-1 text-left text-sm ${selectedId === inv.id ? 'border-accent bg-accent/5' : 'border-border hover:bg-surface-2'}`}>
                <span className="font-medium">{inv.name}</span>
                <span className="block text-xs text-muted">{inv.playerName || 'sem jogador'} · {inv.occupation || 'sem ocupação'}</span>
              </button>
            </li>
          ))}
          {investigators?.length === 0 && <li className="text-sm text-muted">Nenhum investigador ainda.</li>}
        </ul>
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto">
        {selected ? (
          <>
            <div className="flex items-center justify-end gap-2 border-b border-border px-4 py-2">
              <Button onClick={() => printInvestigatorSheet(selected)}><Printer size={14} className="mr-1 inline" /> Ficha para impressão</Button>
              <button className="flex items-center gap-1 text-xs text-muted hover:text-secret" onClick={() => { if (confirm(`Apagar "${selected.name}"?`)) { void db.investigators.delete(selected.id); setSelectedId(null); } }}>
                <Trash2 size={13} /> Apagar
              </button>
            </div>
            <InvestigatorWizard investigator={selected} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted">Selecione ou crie um investigador.</div>
        )}
      </div>
    </div>
  );
}
