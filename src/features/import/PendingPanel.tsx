import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { Chip } from '@/components/ui';
import { underCoveredConclusions } from '@/domain/threeCluesRule';

/** Painel de Pendências (section 6.1). */
export function PendingPanel() {
  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];
  const npcs = useLiveData(() => db.npcs.toArray(), []) ?? [];
  const clues = useLiveData(() => db.clues.toArray(), []) ?? [];
  const plots = useLiveData(() => db.plots.toArray(), []) ?? [];

  // "Sem pino": imported off-canvas (negative coords) or flagged pending 'pino'.
  const semPino = locations.filter((l) => l.pending?.includes('pino') || (l.geometry.type === 'point' && l.geometry.x < 0));
  const leituraPendente = locations.filter((l) => l.pending?.includes('leitura'));
  const npcSemAgenda = npcs.filter((n) => n.schedule.length === 0);
  const pistaSemLocal = clues.filter((c) => !c.locationId && !c.npcId);
  const conclusoesFracas = underCoveredConclusions(plots, clues);

  const Section = ({ title, items }: { title: string; items: { id: string; label: string }[] }) => (
    <section>
      <h3 className="mb-1 font-serif text-lg">{title} <Chip>{items.length}</Chip></h3>
      {items.length === 0 ? (
        <p className="text-sm italic text-muted">Nada pendente aqui.</p>
      ) : (
        <ul className="flex flex-wrap gap-1">
          {items.map((i) => (<li key={i.id}><Chip>{i.label}</Chip></li>))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-5 p-4">
      <p className="text-sm text-muted">Itens que o texto-fonte não trouxe ou que precisam da sua mão — o app não inventa.</p>
      <Section title="Locais sem pino (arraste para o mapa)" items={semPino.map((l) => ({ id: l.id, label: l.name }))} />
      <Section title="Leituras pendentes" items={leituraPendente.map((l) => ({ id: l.id, label: l.name }))} />
      <Section title="NPCs sem agenda" items={npcSemAgenda.map((n) => ({ id: n.id, label: n.name }))} />
      <Section title="Pistas sem local" items={pistaSemLocal.map((c) => ({ id: c.id, label: c.text.slice(0, 40) }))} />
      <Section title="Conclusões com poucas pistas (regra dos três)" items={conclusoesFracas.map((c) => ({ id: c.conclusion.id, label: `${c.plotName} · ${c.conclusion.title} (${c.availableClueCount}/3)` }))} />
    </div>
  );
}
