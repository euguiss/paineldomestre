import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { NpcEntity, NpcPlotLayer, NpcStatus, DayPeriod, ScheduleEntry } from '@/db/schema';
import { db } from '@/db/database';
import { Field, TextInput, TextArea, Chip, Button } from '@/components/ui';
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

        {tab === 'ficha' && (
          <>
            <div className="grid grid-cols-4 gap-2">
              {(['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU'] as const).map((k) => (
                <Field key={k} label={k}>
                  <TextInput
                    type="number"
                    value={npc.statBlock[k] ?? ''}
                    onChange={(e) =>
                      patch(npc.id, { statBlock: { ...npc.statBlock, [k]: e.target.value ? Number(e.target.value) : undefined } })
                    }
                  />
                </Field>
              ))}
            </div>
            <Field label="Bloco livre (markdown)">
              <TextArea rows={4} value={npc.statBlock.markdown} onChange={(e) => patch(npc.id, { statBlock: { ...npc.statBlock, markdown: e.target.value } })} />
            </Field>
          </>
        )}

        {tab === 'agenda' && (
          <div className="space-y-2">
            {npc.schedule.map((s, i) => (
              <div key={i} className="flex items-center gap-1 rounded border border-border bg-surface-2 p-2">
                <select
                  className="rounded border border-border bg-surface px-1 py-1 text-xs"
                  value={s.period}
                  onChange={(e) => updateSchedule(npc, i, { period: e.target.value as DayPeriod })}
                >
                  {PERIODS.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
                <select
                  className="min-w-0 flex-1 rounded border border-border bg-surface px-1 py-1 text-xs"
                  value={s.locationId}
                  onChange={(e) => updateSchedule(npc, i, { locationId: e.target.value })}
                >
                  <option value="">— local —</option>
                  {locations.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
                </select>
                <TextInput className="flex-1" value={s.activity} onChange={(e) => updateSchedule(npc, i, { activity: e.target.value })} placeholder="atividade" />
                <button className="text-muted hover:text-secret" onClick={() => patch(npc.id, { schedule: npc.schedule.filter((_, j) => j !== i) })}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <Button onClick={() => patch(npc.id, { schedule: [...npc.schedule, { period: 'manha', locationId: '', activity: '' }] })}>
              <Plus size={12} className="inline" /> período
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
