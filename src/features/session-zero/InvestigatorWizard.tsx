import { Plus, Trash2, Info } from 'lucide-react';
import type { InvestigatorEntity, InvestigatorLink } from '@/db/schema';
import { db } from '@/db/database';
import { Field, TextInput, TextArea, Chip } from '@/components/ui';
import {
  deriveAll,
  skillTiers,
  occupationSkillPoints,
  interestSkillPoints,
  computeBudget,
} from '@/domain/cocRules';
import { useLiveData } from '@/db/useLiveData';

const CHARS = ['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU'] as const;

async function patch(id: string, changes: Partial<InvestigatorEntity>) {
  await db.investigators.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

/**
 * Step-by-step CoC 7e investigator wizard (section 13). Derived values and the
 * half/fifth of each skill are computed automatically; the skill-point counters
 * (occupation EDUx4, interest INTx2) warn on overspending. The Keeper is always
 * reminded to confirm against the book and apply house rules.
 */
export function InvestigatorWizard({ investigator: inv }: { investigator: InvestigatorEntity }) {
  const plots = useLiveData(() => db.plots.toArray(), []) ?? [];
  const npcs = useLiveData(() => db.npcs.toArray(), []) ?? [];
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];
  const factions = useLiveData(() => db.factions.toArray(), []) ?? [];

  const derived = deriveAll(inv.characteristics);

  function updateChar(key: (typeof CHARS)[number], value: number) {
    const characteristics = { ...inv.characteristics, [key]: value };
    void patch(inv.id, { characteristics, derived: { ...deriveAll(characteristics), Sorte: inv.derived.Sorte } });
  }

  function updateSkill(i: number, changes: Partial<InvestigatorEntity['skills'][number]>) {
    const skills = [...inv.skills];
    skills[i] = { ...skills[i], ...changes };
    void patch(inv.id, { skills });
  }

  const occBudget = computeBudget(occupationSkillPoints(inv.characteristics), inv.skills.map((s) => s.value));
  const intBudget = interestSkillPoints(inv.characteristics);

  function updateLink(i: number, changes: Partial<InvestigatorLink>) {
    const links = [...inv.links];
    links[i] = { ...links[i], ...changes };
    void patch(inv.id, { links });
  }

  function optionsFor(type: InvestigatorLink['targetType']) {
    switch (type) {
      case 'plot': return plots.map((p) => ({ id: p.id, name: p.name }));
      case 'npc': return npcs.map((n) => ({ id: n.id, name: n.name }));
      case 'location': return locations.map((l) => ({ id: l.id, name: l.name }));
      case 'faction': return factions.map((f) => ({ id: f.id, name: f.name }));
    }
  }

  const hasLocationLink = inv.links.some((l) => l.targetType === 'location');
  const hasNpcLink = inv.links.some((l) => l.targetType === 'npc');

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-start gap-2 rounded border border-test/30 bg-test/10 p-2 text-xs text-test">
        <Info size={14} className="mt-0.5 shrink-0" />
        Os cálculos seguem CoC 7e e podem mudar com regras da casa. Confira sempre com o livro.
      </div>

      {/* Identity */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome"><TextInput value={inv.name} onChange={(e) => patch(inv.id, { name: e.target.value })} /></Field>
        <Field label="Jogador"><TextInput value={inv.playerName} onChange={(e) => patch(inv.id, { playerName: e.target.value })} /></Field>
        <Field label="Conceito"><TextInput value={inv.concept} onChange={(e) => patch(inv.id, { concept: e.target.value })} /></Field>
        <Field label="Ocupação"><TextInput value={inv.occupation} onChange={(e) => patch(inv.id, { occupation: e.target.value })} /></Field>
        <Field label="Idade"><TextInput type="number" value={inv.age} onChange={(e) => patch(inv.id, { age: Number(e.target.value) })} /></Field>
      </section>

      {/* Characteristics + auto-derived */}
      <section>
        <h3 className="mb-2 font-serif text-lg">Características</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CHARS.map((k) => {
            const tiers = skillTiers(inv.characteristics[k]);
            return (
              <div key={k} className="rounded border border-border bg-surface p-2">
                <label className="block text-xs font-medium uppercase text-muted">{k}</label>
                <input
                  type="number"
                  className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-sm"
                  value={inv.characteristics[k]}
                  onChange={(e) => updateChar(k, Number(e.target.value))}
                />
                <p className="mt-1 text-[11px] text-muted">{tiers.hard} / {tiers.extreme}</p>
              </div>
            );
          })}
        </div>

        <h3 className="mb-2 mt-4 font-serif text-lg">Valores derivados</h3>
        <div className="flex flex-wrap gap-2">
          <Chip>PV {derived.PV}</Chip>
          <Chip>PM {derived.PM}</Chip>
          <Chip>SAN {derived.SAN}</Chip>
          <Chip>MOV {derived.Movimento}</Chip>
          <Chip>Corpo {derived.Corpo}</Chip>
          <Chip>Bônus de Dano {derived.BonusDeDano}</Chip>
          <label className="flex items-center gap-1 text-xs">
            Sorte
            <input type="number" className="w-16 rounded border border-border bg-surface-2 px-1 py-0.5" value={inv.derived.Sorte}
              onChange={(e) => patch(inv.id, { derived: { ...inv.derived, Sorte: Number(e.target.value) } })} />
          </label>
        </div>
      </section>

      {/* Skills with point counters */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-serif text-lg">Perícias</h3>
          <div className="flex gap-2 text-xs">
            <Chip tone={occBudget.overspent ? 'secret' : 'accent'}>
              Ocupação (EDU×4): {occBudget.spent}/{occBudget.total}
              {occBudget.overspent ? ' — excedido!' : ` (resta ${occBudget.remaining})`}
            </Chip>
            <Chip>Interesse (INT×2): {intBudget} disponíveis</Chip>
          </div>
        </div>
        <p className="mb-2 text-[11px] text-muted">
          Contador simplificado: soma todos os pontos de perícia contra o orçamento de ocupação. Separe
          manualmente ocupação e interesse conforme o livro.
        </p>
        <div className="space-y-1">
          {inv.skills.map((s, i) => {
            const t = skillTiers(s.value);
            return (
              <div key={i} className="flex items-center gap-2 rounded border border-border bg-surface px-2 py-1">
                <TextInput className="flex-1" value={s.name} onChange={(e) => updateSkill(i, { name: e.target.value })} placeholder="perícia" />
                <input type="number" className="w-16 rounded border border-border bg-surface-2 px-1 py-0.5 text-sm" value={s.value} onChange={(e) => updateSkill(i, { value: Number(e.target.value) })} />
                <span className="w-16 text-right text-[11px] text-muted">{t.hard}/{t.extreme}</span>
                <button className="text-muted hover:text-secret" onClick={() => patch(inv.id, { skills: inv.skills.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
        <button className="mt-2 flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-sm hover:bg-surface" onClick={() => patch(inv.id, { skills: [...inv.skills, { name: '', value: 1 }] })}>
          <Plus size={13} /> perícia
        </button>
      </section>

      {/* Background */}
      <section className="grid gap-3">
        <Field label="Antecedentes"><TextArea rows={3} value={inv.backstory} onChange={(e) => patch(inv.id, { backstory: e.target.value })} /></Field>
        <Field label="Equipamento"><TextArea rows={2} value={inv.equipment} onChange={(e) => patch(inv.id, { equipment: e.target.value })} /></Field>
        <Field label="Gancho pessoal"><TextInput value={inv.hook} onChange={(e) => patch(inv.id, { hook: e.target.value })} /></Field>
      </section>

      {/* World links */}
      <section>
        <h3 className="mb-1 font-serif text-lg">Vínculos com o mundo</h3>
        <div className="mb-2 flex flex-wrap gap-2 text-xs">
          <Chip tone={hasLocationLink ? 'accent' : 'secret'}>{hasLocationLink ? '✓' : '!'} local de ligação</Chip>
          <Chip tone={hasNpcLink ? 'accent' : 'secret'}>{hasNpcLink ? '✓' : '!'} NPC conhecido</Chip>
          <Chip tone={inv.hook ? 'accent' : 'secret'}>{inv.hook ? '✓' : '!'} gancho pessoal</Chip>
        </div>
        <div className="space-y-2">
          {inv.links.map((link, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded border border-border bg-surface p-2 text-sm">
              <select className="rounded border border-border bg-surface-2 px-2 py-1" value={link.targetType} onChange={(e) => updateLink(i, { targetType: e.target.value as InvestigatorLink['targetType'], targetId: '' })}>
                <option value="location">Local</option>
                <option value="npc">NPC</option>
                <option value="faction">Facção</option>
                <option value="plot">Trama</option>
              </select>
              <select className="min-w-0 flex-1 rounded border border-border bg-surface-2 px-2 py-1" value={link.targetId} onChange={(e) => updateLink(i, { targetId: e.target.value })}>
                <option value="">— escolher —</option>
                {optionsFor(link.targetType).map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
              </select>
              <TextInput className="flex-1" value={link.note} onChange={(e) => updateLink(i, { note: e.target.value })} placeholder="nota do vínculo" />
              <button className="text-muted hover:text-secret" onClick={() => patch(inv.id, { links: inv.links.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <button className="mt-2 flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-sm hover:bg-surface" onClick={() => patch(inv.id, { links: [...inv.links, { targetType: 'location', targetId: '', note: '' }] })}>
          <Plus size={13} /> vínculo
        </button>
      </section>
    </div>
  );
}
