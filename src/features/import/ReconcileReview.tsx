import { useMemo, useState } from 'react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { Button, Chip } from '@/components/ui';
import type { ScenarioPackage } from '@/import/packageSchema';
import type { ReconcileDecision } from '@/import/applyBatch';
import { reconcileRef, candidatesFromLocations, candidatesFromNpcs, type ReconcileConfidence } from '@/import/reconcile';

export interface CollectedRef {
  ref: string;
  kind: 'location' | 'npc';
}

/** Gather every distinct location/NPC reference used by a scenario package. */
export function collectRefs(pkg: ScenarioPackage): CollectedRef[] {
  const locs = new Set<string>();
  const npcs = new Set<string>();
  for (const c of pkg.clues) { if (c.locationRef) locs.add(c.locationRef); if (c.npcRef) npcs.add(c.npcRef); }
  for (const s of pkg.scenes) if (s.locationRef) locs.add(s.locationRef);
  for (const l of pkg.locationLayers) locs.add(l.locationRef);
  for (const n of pkg.npcLayers) npcs.add(n.npcRef);
  return [
    ...[...locs].map((ref) => ({ ref, kind: 'location' as const })),
    ...[...npcs].map((ref) => ({ ref, kind: 'npc' as const })),
  ];
}

const CONF_TONE: Record<ReconcileConfidence, 'muted' | 'accent' | 'secret'> = {
  exata: 'accent',
  alias: 'accent',
  aproximada: 'muted',
  nenhuma: 'secret',
};

interface Props {
  pkg: ScenarioPackage;
  refs: CollectedRef[];
  onCancel: () => void;
  onApply: (decisions: Map<string, ReconcileDecision>) => void;
}

/** Reconciliation review table (section 6.1). Nothing is applied without confirm. */
export function ReconcileReview({ pkg, refs, onCancel, onApply }: Props) {
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];
  const npcs = useLiveData(() => db.npcs.toArray(), []) ?? [];

  // Initial decisions: auto-pick suggestions.
  const initial = useMemo(() => {
    const map = new Map<string, ReconcileDecision>();
    for (const { ref, kind } of refs) {
      const sug = kind === 'location'
        ? reconcileRef(ref, candidatesFromLocations(locations))
        : reconcileRef(ref, candidatesFromNpcs(npcs));
      if (sug.matchId) {
        map.set(ref, { ref, action: kind === 'npc' ? 'merge' : 'match', targetId: sug.matchId });
      } else {
        map.set(ref, { ref, action: 'ignore' });
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refs, locations.length, npcs.length]);

  const [decisions, setDecisions] = useState(initial);

  function setDecision(ref: string, d: ReconcileDecision) {
    setDecisions((prev) => new Map(prev).set(ref, d));
  }

  return (
    <div className="space-y-3">
      <h3 className="font-serif text-lg">Reconciliação — "{pkg.label}"</h3>
      <p className="text-sm text-muted">
        Cada local/NPC citado pelo cenário é comparado com os da cidade. Confirme as sugestões.
        <strong> Nada é aplicado sem sua confirmação.</strong>
      </p>

      <div className="space-y-2">
        {refs.map(({ ref, kind }) => {
          const candidates = kind === 'location' ? candidatesFromLocations(locations) : candidatesFromNpcs(npcs);
          const sug = reconcileRef(ref, candidates);
          const decision = decisions.get(ref)!;
          const options = kind === 'location' ? locations.map((l) => ({ id: l.id, name: l.name })) : npcs.map((n) => ({ id: n.id, name: n.name }));

          return (
            <div key={`${kind}-${ref}`} className="rounded border border-border bg-surface p-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-muted">{kind === 'location' ? 'Local' : 'NPC'}</span>
                <span className="font-medium">{ref}</span>
                <Chip tone={CONF_TONE[sug.confidence]}>
                  {sug.confidence === 'nenhuma' ? 'sem correspondência' : `sugestão: ${sug.matchName} (${sug.confidence}${sug.confidence === 'aproximada' ? ` ${Math.round(sug.similarity * 100)}%` : ''})`}
                </Chip>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  className="rounded border border-border bg-surface-2 px-2 py-1 text-xs"
                  value={decision.action}
                  onChange={(e) => setDecision(ref, { ...decision, action: e.target.value as ReconcileDecision['action'], targetId: decision.targetId ?? sug.matchId ?? undefined })}
                >
                  <option value="match">Casar com existente</option>
                  <option value="map">Mapear para outro (mover o palco)</option>
                  {kind === 'npc' && <option value="merge">Fundir com NPC existente</option>}
                  <option value="create">Criar novo</option>
                  <option value="ignore">Ignorar</option>
                </select>

                {(decision.action === 'match' || decision.action === 'map' || decision.action === 'merge') && (
                  <select
                    className="min-w-[180px] rounded border border-border bg-surface-2 px-2 py-1 text-xs"
                    value={decision.targetId ?? ''}
                    onChange={(e) => setDecision(ref, { ...decision, targetId: e.target.value })}
                  >
                    <option value="">— escolher —</option>
                    {options.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
        {refs.length === 0 && <p className="text-sm italic text-muted">Este cenário não referencia locais nem NPCs.</p>}
      </div>

      <div className="flex gap-2">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="accent" onClick={() => onApply(decisions)}>Aplicar cenário</Button>
      </div>
    </div>
  );
}
