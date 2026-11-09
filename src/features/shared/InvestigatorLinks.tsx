import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { Chip } from '@/components/ui';

/**
 * Shows investigator links that target a given entity ("ligado ao investigador
 * X"), used on the location dossier and NPC detail (section 13).
 */
export function InvestigatorLinks({ entityId }: { entityId: string }) {
  const investigators = useLiveData(() => db.investigators.toArray(), []) ?? [];
  const linked = investigators.flatMap((inv) =>
    inv.links.filter((l) => l.targetId === entityId).map((l) => ({ inv, note: l.note })),
  );

  if (linked.length === 0) return null;

  return (
    <div className="rounded border border-accent/30 bg-accent/5 p-2">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-accent">Vínculos de investigadores</p>
      <ul className="space-y-1 text-sm">
        {linked.map(({ inv, note }, i) => (
          <li key={i}>
            <Chip tone="accent">{inv.name}</Chip>
            {note && <span className="ml-1 text-muted">{note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
