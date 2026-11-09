import { Plus, Trash2 } from 'lucide-react';
import type { SessionZeroEntity } from '@/db/schema';
import { patchSz } from './SessionZeroScreen';
import { Field, TextArea, TextInput, Button } from '@/components/ui';

/** Tom e segurança + regras da casa (section 13). */
export function TomRegrasTab({ sz }: { sz: SessionZeroEntity }) {
  function updateTone(changes: Partial<SessionZeroEntity['tone']>) {
    void patchSz(sz.id, { tone: { ...sz.tone, ...changes } });
  }
  function updateRule(i: number, changes: Partial<SessionZeroEntity['houseRules'][number]>) {
    const houseRules = [...sz.houseRules];
    houseRules[i] = { ...houseRules[i], ...changes };
    void patchSz(sz.id, { houseRules });
  }

  return (
    <div className="space-y-6 p-4">
      <section className="space-y-3">
        <h3 className="font-serif text-lg">Tom e segurança</h3>
        <Field label="Linhas (não entram na mesa)"><TextArea rows={2} value={sz.tone.lines} onChange={(e) => updateTone({ lines: e.target.value })} /></Field>
        <Field label="Véus (acontecem fora de cena)"><TextArea rows={2} value={sz.tone.veils} onChange={(e) => updateTone({ veils: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sz.tone.xCard} onChange={(e) => updateTone({ xCard: e.target.checked })} />
          X-card em uso
        </label>
        <Field label="Nível de horror e violência"><TextInput value={sz.tone.horrorLevel} onChange={(e) => updateTone({ horrorLevel: e.target.value })} /></Field>
        <Field label="Combinados (notas)"><TextArea rows={2} value={sz.tone.notes} onChange={(e) => updateTone({ notes: e.target.value })} /></Field>
      </section>

      <section>
        <h3 className="mb-2 font-serif text-lg">Regras da casa</h3>
        <p className="mb-2 text-xs text-muted">Ative por mesa (inclui mudanças do Keeper's Companion que você escolher adotar).</p>
        <div className="space-y-2">
          {sz.houseRules.map((rule, i) => (
            <div key={i} className="flex items-start gap-2 rounded border border-border bg-surface p-2">
              <input type="checkbox" className="mt-2" checked={rule.active} onChange={(e) => updateRule(i, { active: e.target.checked })} aria-label="Ativa" />
              <TextArea className="flex-1" rows={2} value={rule.text} onChange={(e) => updateRule(i, { text: e.target.value })} />
              <button className="mt-1 text-muted hover:text-secret" onClick={() => patchSz(sz.id, { houseRules: sz.houseRules.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <Button className="mt-2" variant="accent" onClick={() => patchSz(sz.id, { houseRules: [...sz.houseRules, { text: '', active: true }] })}>
          <Plus size={14} className="mr-1 inline" /> regra
        </Button>
      </section>
    </div>
  );
}
