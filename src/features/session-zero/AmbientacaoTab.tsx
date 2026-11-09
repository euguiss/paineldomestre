import { Plus, Trash2, Sprout } from 'lucide-react';
import type { SessionZeroEntity, LoreScope, ClueEntity } from '@/db/schema';
import { patchSz } from './SessionZeroScreen';
import { TextInput, TextArea, Button, Chip } from '@/components/ui';
import { KeeperMarkdown } from '@/markdown/KeeperMarkdown';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';

const SCOPES: LoreScope[] = ['epoca', 'cidade', 'cultura', 'faccao'];

/** Guia de ambientação: lore cards (public vs secret) + rumors. */
export function AmbientacaoTab({ sz }: { sz: SessionZeroEntity }) {
  const tables = useLiveData(() => db.gameTables.toArray(), []) ?? [];
  const plots = useLiveData(() => db.plots.toArray(), []) ?? [];

  function updateLore(i: number, changes: Partial<SessionZeroEntity['loreCards'][number]>) {
    const loreCards = [...sz.loreCards];
    loreCards[i] = { ...loreCards[i], ...changes };
    void patchSz(sz.id, { loreCards });
  }
  function updateRumor(i: number, changes: Partial<SessionZeroEntity['rumors'][number]>) {
    const rumors = [...sz.rumors];
    rumors[i] = { ...rumors[i], ...changes };
    void patchSz(sz.id, { rumors });
  }

  /** Turn a rumor into a seed clue with one click. */
  async function rumorToClue(index: number) {
    const rumor = sz.rumors[index];
    const clue: ClueEntity = {
      ...newBase(),
      text: rumor.text,
      plotIds: rumor.plotId ? [rumor.plotId] : [],
      howToObtain: { method: 'Boato ouvido na Sessão 0' },
      pointsToPlotIds: rumor.plotId ? [rumor.plotId] : [],
      isBridge: false,
      handoutIds: [],
      status: 'nao-descoberta',
      tags: ['pista-semente'],
    };
    await db.clues.put(clue);
    updateRumor(index, { clueId: clue.id });
  }

  return (
    <div className="space-y-6 p-4">
      {/* Lore cards */}
      <section>
        <h3 className="mb-2 font-serif text-lg">Cartões de lore</h3>
        <p className="mb-3 text-xs text-muted">
          Use <code>&gt;</code> para o texto de leitura (conhecimento comum, pode contar) e{' '}
          <code>:::segredo ... :::</code> para o que é só do Mestre.
        </p>
        <div className="space-y-3">
          {sz.loreCards.map((card, i) => (
            <div key={i} className="rounded border border-border bg-surface p-3">
              <div className="mb-2 flex items-center gap-2">
                <TextInput className="flex-1 font-medium" value={card.title} onChange={(e) => updateLore(i, { title: e.target.value })} />
                <select className="rounded border border-border bg-surface-2 px-2 py-1 text-sm" value={card.scope} onChange={(e) => updateLore(i, { scope: e.target.value as LoreScope })}>
                  {SCOPES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                <button className="text-muted hover:text-secret" onClick={() => patchSz(sz.id, { loreCards: sz.loreCards.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs uppercase text-muted">Leitura (comum)</p>
                  <TextArea rows={3} value={card.readAloud} onChange={(e) => updateLore(i, { readAloud: e.target.value })} />
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase text-muted">Notas do Mestre (segredo)</p>
                  <TextArea rows={3} value={card.masterNotes} onChange={(e) => updateLore(i, { masterNotes: e.target.value })} />
                </div>
              </div>
              {(card.readAloud || card.masterNotes) && (
                <div className="mt-2 rounded border border-border bg-surface-2/40 p-2">
                  <p className="mb-1 text-[10px] uppercase text-muted">Prévia</p>
                  <KeeperMarkdown>{`${card.readAloud}\n\n${card.masterNotes}`}</KeeperMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button className="mt-2" variant="accent" onClick={() => patchSz(sz.id, { loreCards: [...sz.loreCards, { title: 'Novo cartão', scope: 'cidade', readAloud: '> ', masterNotes: '' }] })}>
          <Plus size={14} className="mr-1 inline" /> cartão de lore
        </Button>
      </section>

      {/* Rumors */}
      <section>
        <h3 className="mb-2 font-serif text-lg">Rumores</h3>
        <div className="space-y-2">
          {sz.rumors.map((rumor, i) => (
            <div key={i} className="rounded border border-border bg-surface p-2">
              <div className="flex items-start gap-2">
                <TextArea className="flex-1" rows={2} value={rumor.text} onChange={(e) => updateRumor(i, { text: e.target.value })} />
                <button className="text-muted hover:text-secret" onClick={() => patchSz(sz.id, { rumors: sz.rumors.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <select className="rounded border border-border bg-surface-2 px-2 py-1" value={rumor.plotId ?? ''} onChange={(e) => updateRumor(i, { plotId: e.target.value || undefined })}>
                  <option value="">— trama —</option>
                  {plots.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
                {rumor.clueId ? (
                  <Chip tone="accent"><Sprout size={10} className="mr-0.5 inline" />já é pista-semente</Chip>
                ) : (
                  <button className="flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 hover:text-accent" onClick={() => rumorToClue(i)}>
                    <Sprout size={11} /> virar pista-semente
                  </button>
                )}
                <span className="text-muted">Contado a:</span>
                {tables.map((t) => {
                  const told = rumor.toldToTableIds.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => updateRumor(i, { toldToTableIds: told ? rumor.toldToTableIds.filter((x) => x !== t.id) : [...rumor.toldToTableIds, t.id] })}
                      className={`rounded px-2 py-0.5 ${told ? 'bg-accent/20 text-accent' : 'bg-surface-2 text-muted'}`}>
                      {t.name}{told ? ' ✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <Button className="mt-2" variant="accent" onClick={() => patchSz(sz.id, { rumors: [...sz.rumors, { text: 'Novo boato…', toldToTableIds: [] }] })}>
          <Plus size={14} className="mr-1 inline" /> rumor
        </Button>
      </section>
    </div>
  );
}
