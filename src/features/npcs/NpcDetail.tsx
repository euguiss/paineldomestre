import { useState } from 'react';
import { X, Plus, Trash2, Heart, Brain, Clover, Sparkles } from 'lucide-react';
import type { NpcEntity, NpcPlotLayer, NpcStatus, DayPeriod, ScheduleEntry, CocStatBlock } from '@/db/schema';
import { db } from '@/db/database';
import { Field, TextInput, TextArea, Select, Chip, Button, IconButton } from '@/components/ui';
import { ConditionEditor } from '@/components/forms/ConditionEditor';
import { useConditionOptions } from '@/features/shared/useConditionOptions';
import { describeCondition } from '@/domain/describeCondition';
import { makeNameLookup } from '@/features/shared/nameLookup';
import { consistencyWarningsForEntity } from '@/domain/consistency';
import { InvestigatorLinks } from '@/features/shared/InvestigatorLinks';
import { useLiveData } from '@/db/useLiveData';
import { AlertTriangle } from 'lucide-react';

interface Props {
  npc: NpcEntity;
  onClose: () => void;
}

type Tab = 'geral' | 'ficha' | 'agenda' | 'tramas' | 'relacoes';
const TABS: { id: Tab; label: string }[] = [
  { id: 'geral', label: 'Geral' },
  { id: 'ficha', label: 'Ficha CoC' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'tramas', label: 'Por trama' },
  { id: 'relacoes', label: 'Relações' },
];
const STATUSES: NpcStatus[] = ['vivo', 'morto', 'desaparecido', 'enlouquecido', 'convertido', 'outro'];
const PERIODS: DayPeriod[] = ['manha', 'tarde', 'noite', 'madrugada'];
const PERIOD_LABELS: Record<DayPeriod, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', madrugada: 'Madrugada' };

async function patch(id: string, changes: Partial<NpcEntity>) {
  await db.npcs.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

export function NpcDetail({ npc, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('geral');
  const options = useConditionOptions();
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];
  const plots = options.plots;
  const factions = useLiveData(() => db.factions.toArray(), []) ?? [];
  const tables = useLiveData(() => db.gameTables.toArray(), []) ?? [];
  const investigators = useLiveData(() => db.investigators.toArray(), []) ?? [];
  const events = useLiveData(() => db.events.toArray(), []) ?? [];
  const names = makeNameLookup({ plots, clues: options.clues, npcs: options.npcs, locations });

  const warnings = consistencyWarningsForEntity({ tables, investigators, events, entityId: npc.id });

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <h2 className="font-serif text-xl">{npc.name}</h2>
        <button className="text-muted hover:text-text" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
      </div>

      {warnings.length > 0 && (
        <div className="border-b border-secret/30 bg-secret/10 px-4 py-2 text-xs text-secret">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span><strong>{w.tableName}:</strong> {w.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b border-border px-2 py-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded px-2 py-1 text-sm ${tab === t.id ? 'bg-accent/20 text-accent' : 'text-muted hover:text-text'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 p-4">
        {tab === 'geral' && (
          <>
            <Field label="Nome"><TextInput value={npc.name} onChange={(e) => patch(npc.id, { name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <select
                  className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-sm"
                  value={npc.status}
                  onChange={(e) => patch(npc.id, { status: e.target.value as NpcStatus })}
                >
                  {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </Field>
              <Field label="Conhecido dos jogadores?">
                <select
                  className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-sm"
                  value={String(npc.isKnownToPlayers)}
                  onChange={(e) => patch(npc.id, { isKnownToPlayers: e.target.value === 'true' })}
                >
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </Field>
            </div>
            <Field label="Aparência"><TextArea rows={2} value={npc.appearance} onChange={(e) => patch(npc.id, { appearance: e.target.value })} /></Field>
            <Field label="Voz e maneirismos"><TextArea rows={2} value={npc.voiceAndMannerisms} onChange={(e) => patch(npc.id, { voiceAndMannerisms: e.target.value })} /></Field>
            <Field label="Falas típicas (uma por linha)">
              <TextArea
                rows={3}
                value={npc.typicalLines.join('\n')}
                onChange={(e) => patch(npc.id, { typicalLines: e.target.value.split('\n').filter(Boolean) })}
              />
            </Field>
            <Field label="Facções">
              <div className="flex flex-wrap gap-1">
                {factions.map((f) => {
                  const on = npc.factionIds.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() =>
                        patch(npc.id, {
                          factionIds: on ? npc.factionIds.filter((x) => x !== f.id) : [...npc.factionIds, f.id],
                        })
                      }
                      className={`rounded px-2 py-0.5 text-[11px] ${on ? 'bg-accent/20 text-accent' : 'bg-surface-2 text-muted'}`}
                    >
                      {f.name}
                    </button>
                  );
                })}
                {factions.length === 0 && <span className="text-xs italic text-muted">Nenhuma facção.</span>}
              </div>
            </Field>
          </>
        )}

        {tab === 'ficha' && <FichaTab npc={npc} />}

        {tab === 'agenda' && (
          <div className="space-y-3">
            <p className="text-xs text-muted">Onde o NPC está e o que faz em cada período do dia. O dossiê usa isso para mostrar quem está presente.</p>
            {npc.schedule.map((s, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-accent">{PERIOD_LABELS[s.period]}</span>
                  <IconButton label="Remover período" tone="danger" onClick={() => patch(npc.id, { schedule: npc.schedule.filter((_, j) => j !== i) })}>
                    <Trash2 size={14} />
                  </IconButton>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Período">
                    <Select value={s.period} onChange={(e) => updateSchedule(npc, i, { period: e.target.value as DayPeriod })}>
                      {PERIODS.map((p) => (<option key={p} value={p}>{PERIOD_LABELS[p]}</option>))}
                    </Select>
                  </Field>
                  <Field label="Local">
                    <Select value={s.locationId} onChange={(e) => updateSchedule(npc, i, { locationId: e.target.value })}>
                      <option value="">— nenhum —</option>
                      {locations.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
                    </Select>
                  </Field>
                </div>
                <div className="mt-2">
                  <Field label="Atividade">
                    <TextArea rows={2} value={s.activity} onChange={(e) => updateSchedule(npc, i, { activity: e.target.value })} placeholder="O que está fazendo aqui…" />
                  </Field>
                </div>
              </div>
            ))}
            <Button variant="accent" onClick={() => patch(npc.id, { schedule: [...npc.schedule, { period: 'manha', locationId: '', activity: '' }] })}>
              <Plus size={14} /> período
            </Button>
          </div>
        )}

        {tab === 'tramas' && (
          <div className="space-y-3">
            {npc.layers.map((layer, i) => (
              <div key={i} className="rounded border border-border bg-surface-2/40 p-2">
                <div className="mb-2 flex items-center justify-between">
                  <select
                    className="rounded border border-border bg-surface-2 px-2 py-1 text-sm"
                    value={layer.plotId}
                    onChange={(e) => updateLayer(npc, i, { plotId: e.target.value })}
                  >
                    <option value="">— trama —</option>
                    {plots.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                  <button className="text-muted hover:text-secret" onClick={() => patch(npc.id, { layers: npc.layers.filter((_, j) => j !== i) })}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <Field label="Sabe"><TextArea rows={2} value={layer.knows} onChange={(e) => updateLayer(npc, i, { knows: e.target.value })} /></Field>
                <Field label="Esconde"><TextArea rows={2} value={layer.hides} onChange={(e) => updateLayer(npc, i, { hides: e.target.value })} /></Field>
                <Field label="Revela se pressionado"><TextArea rows={2} value={layer.revealsIfPressed} onChange={(e) => updateLayer(npc, i, { revealsIfPressed: e.target.value })} /></Field>
                <div className="mt-2">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Condição de ativação</p>
                  <p className="mb-1 text-xs text-accent">
                    {describeCondition(layer.activationCondition ?? { kind: 'always' }, names)}
                  </p>
                  <ConditionEditor
                    value={layer.activationCondition ?? { kind: 'always' }}
                    options={options}
                    onChange={(next) => updateLayer(npc, i, { activationCondition: next })}
                  />
                </div>
              </div>
            ))}
            <Button
              variant="accent"
              onClick={() =>
                patch(npc.id, {
                  layers: [...npc.layers, { plotId: plots[0]?.id ?? '', knows: '', hides: '', revealsIfPressed: '', activationCondition: { kind: 'always' } }],
                })
              }
            >
              <Plus size={12} className="inline" /> camada de trama
            </Button>
          </div>
        )}

        {tab === 'relacoes' && (
          <div className="space-y-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted">Facções</p>
            <div className="flex flex-wrap gap-1">
              {npc.factionIds.map((fid) => (<Chip key={fid} tone="accent">{factions.find((f) => f.id === fid)?.name ?? fid}</Chip>))}
              {npc.factionIds.length === 0 && <span className="italic text-muted">Nenhuma.</span>}
            </div>
            <p className="mt-2 text-xs uppercase tracking-wide text-muted">Aparece nas tramas</p>
            <div className="flex flex-wrap gap-1">
              {npc.layers.map((l, i) => (<Chip key={i}>{plots.find((p) => p.id === l.plotId)?.name ?? '—'}</Chip>))}
              {npc.layers.length === 0 && <span className="italic text-muted">Nenhuma.</span>}
            </div>
            <div className="mt-2">
              <InvestigatorLinks entityId={npc.id} />
            </div>
          </div>
        )}

        <button
          className="mt-4 flex items-center gap-1 text-xs text-muted hover:text-secret"
          onClick={() => {
            if (confirm(`Apagar "${npc.name}"?`)) {
              void db.npcs.delete(npc.id);
              onClose();
            }
          }}
        >
          <Trash2 size={13} /> Apagar NPC
        </button>
      </div>
    </div>
  );
}

const CHARS = ['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU'] as const;

/** Ficha CoC: características, atributos vitais, perícias e ataques/itens. */
function FichaTab({ npc }: { npc: NpcEntity }) {
  const sb = npc.statBlock;
  const setSb = (changes: Partial<CocStatBlock>) => patch(npc.id, { statBlock: { ...sb, ...changes } });
  const skills = sb.skills ?? [];
  const attacks = sb.attacks ?? [];

  const numField = (k: 'SAN' | 'PV' | 'PM' | 'Sorte') => (
    <TextInput
      type="number"
      value={sb[k] ?? ''}
      onChange={(e) => setSb({ [k]: e.target.value ? Number(e.target.value) : undefined })}
    />
  );

  return (
    <div className="space-y-4">
      {/* Vitals */}
      <div className="grid grid-cols-4 gap-2">
        <Field label={<span className="flex items-center gap-1"><Heart size={11} /> PV</span>}>{numField('PV')}</Field>
        <Field label={<span className="flex items-center gap-1"><Brain size={11} /> SAN</span>}>{numField('SAN')}</Field>
        <Field label={<span className="flex items-center gap-1"><Sparkles size={11} /> PM</span>}>{numField('PM')}</Field>
        <Field label={<span className="flex items-center gap-1"><Clover size={11} /> Sorte</span>}>{numField('Sorte')}</Field>
      </div>

      {/* Characteristics */}
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Características</p>
        <div className="grid grid-cols-4 gap-2">
          {CHARS.map((k) => (
            <label key={k} className="rounded-md border border-border bg-surface-2 p-2 text-center">
              <span className="block text-[11px] font-medium uppercase text-muted">{k}</span>
              <input
                type="number"
                className="mt-1 w-full bg-transparent text-center text-lg focus:outline-none"
                value={sb[k] ?? ''}
                onChange={(e) => setSb({ [k]: e.target.value ? Number(e.target.value) : undefined })}
              />
              <span className="block text-[10px] text-muted">{sb[k] ? `${Math.floor(sb[k]! / 2)} / ${Math.floor(sb[k]! / 5)}` : '—'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Perícias</p>
          <Button onClick={() => setSb({ skills: [...skills, { name: '', value: 0 }] })}><Plus size={13} /> perícia</Button>
        </div>
        <div className="space-y-1.5">
          {skills.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <TextInput className="flex-1" placeholder="nome da perícia" value={s.name}
                onChange={(e) => { const n = [...skills]; n[i] = { ...n[i], name: e.target.value }; setSb({ skills: n }); }} />
              <TextInput type="number" className="w-20" placeholder="%" value={s.value}
                onChange={(e) => { const n = [...skills]; n[i] = { ...n[i], value: Number(e.target.value) }; setSb({ skills: n }); }} />
              <span className="w-16 text-right text-[11px] text-muted">{Math.floor(s.value / 2)}/{Math.floor(s.value / 5)}</span>
              <IconButton label="Remover perícia" tone="danger" onClick={() => setSb({ skills: skills.filter((_, j) => j !== i) })}><Trash2 size={14} /></IconButton>
            </div>
          ))}
          {skills.length === 0 && <p className="text-sm italic text-muted">Nenhuma perícia.</p>}
        </div>
      </div>

      {/* Attacks / items */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Ataques e itens</p>
          <Button onClick={() => setSb({ attacks: [...attacks, { name: '' }] })}><Plus size={13} /> ataque/item</Button>
        </div>
        <div className="space-y-2">
          {attacks.map((a, i) => (
            <div key={i} className="rounded-md border border-border bg-surface-2 p-2">
              <div className="flex items-center gap-2">
                <TextInput className="flex-1" placeholder="nome (ex.: Faca, Revólver .38, Lanterna)" value={a.name}
                  onChange={(e) => { const n = [...attacks]; n[i] = { ...n[i], name: e.target.value }; setSb({ attacks: n }); }} />
                <TextInput type="number" className="w-16" placeholder="%" value={a.value ?? ''}
                  onChange={(e) => { const n = [...attacks]; n[i] = { ...n[i], value: e.target.value ? Number(e.target.value) : undefined }; setSb({ attacks: n }); }} />
                <TextInput className="w-24" placeholder="dano" value={a.damage ?? ''}
                  onChange={(e) => { const n = [...attacks]; n[i] = { ...n[i], damage: e.target.value }; setSb({ attacks: n }); }} />
                <IconButton label="Remover" tone="danger" onClick={() => setSb({ attacks: attacks.filter((_, j) => j !== i) })}><Trash2 size={14} /></IconButton>
              </div>
              <TextInput className="mt-2" placeholder="descrição (alcance, munição, observações…)" value={a.description ?? ''}
                onChange={(e) => { const n = [...attacks]; n[i] = { ...n[i], description: e.target.value }; setSb({ attacks: n }); }} />
            </div>
          ))}
          {attacks.length === 0 && <p className="text-sm italic text-muted">Nenhum ataque ou item.</p>}
        </div>
        <p className="mt-1 text-[11px] text-muted">% = chance de acerto · dano ex.: 1d4+BD, 1d10</p>
      </div>

      {/* Free notes */}
      <Field label="Bloco livre (markdown)">
        <TextArea rows={4} value={sb.markdown} onChange={(e) => setSb({ markdown: e.target.value })} />
      </Field>
    </div>
  );
}

function updateSchedule(npc: NpcEntity, index: number, changes: Partial<ScheduleEntry>) {
  const schedule = [...npc.schedule];
  schedule[index] = { ...schedule[index], ...changes };
  void patch(npc.id, { schedule });
}

function updateLayer(npc: NpcEntity, index: number, changes: Partial<NpcPlotLayer>) {
  const layers = [...npc.layers];
  layers[index] = { ...layers[index], ...changes };
  void patch(npc.id, { layers });
}
