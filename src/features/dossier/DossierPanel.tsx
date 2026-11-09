import { X, Copy, Maximize2, Eye, EyeOff, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useDossier } from './useDossier';
import { KeeperMarkdown } from '@/markdown/KeeperMarkdown';
import { useUiStore } from '@/state/uiStore';
import { db } from '@/db/database';
import { recordEvent } from '@/domain/effects';
import { useSessionContext } from '@/features/shared/useSessionContext';
import { PresentationMode } from './PresentationMode';

interface Props {
  locationId: string;
}

/** Right-side dossier (screen 2): fixed section order, inline quick actions. */
export function DossierPanel({ locationId }: Props) {
  const dossier = useDossier(locationId);
  const selectLocation = useUiStore((s) => s.selectLocation);
  const ctx = useSessionContext();
  const [presenting, setPresenting] = useState(false);

  if (!dossier) {
    return <div className="p-4 text-muted">Carregando dossiê…</div>;
  }

  const { location, readAloud, npcsPresent, layers, cluesAvailable, cluesDiscovered, sceneCards, handouts, history } =
    dossier;

  async function toggleDiscovered() {
    if (!location.discovered) {
      await recordEvent({
        type: 'descoberta',
        text: `Local revelado aos jogadores: ${location.name}.`,
        inGameDate: ctx.inGameDate,
        tableId: ctx.tableId ?? undefined,
        linkedEntityIds: [location.id],
        effects: [{ type: 'markLocationDiscovered', locationId: location.id }],
      });
    } else {
      await db.locations.update(location.id, { discovered: false, updatedAt: new Date().toISOString() });
    }
  }

  function copyReadAloud() {
    void navigator.clipboard.writeText(readAloud.composed.replace(/^>\s?/gm, ''));
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3">
        <div>
          <h2 className="font-serif text-xl">{location.name}</h2>
          <p className="text-xs uppercase tracking-wide text-muted">
            {location.kind}
            {location.district ? ` · ${location.district}` : ''}
          </p>
        </div>
        <button className="rounded p-1 text-muted hover:text-text" onClick={() => selectLocation(null)} aria-label="Fechar dossiê">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5 p-4">
        {/* 1. Read-aloud */}
        <section>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Leitura</h3>
            <div className="flex items-center gap-1">
              {readAloud.variant && (
                <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] text-accent">{readAloud.variant}</span>
              )}
              <button className="rounded p-1 text-muted hover:text-text" onClick={copyReadAloud} aria-label="Copiar leitura">
                <Copy size={15} />
              </button>
              <button
                className="rounded p-1 text-muted hover:text-text"
                onClick={() => setPresenting(true)}
                aria-label="Modo apresentação"
              >
                <Maximize2 size={15} />
              </button>
            </div>
          </div>
          {readAloud.composed ? (
            <KeeperMarkdown>{readAloud.composed}</KeeperMarkdown>
          ) : (
            <p className="text-sm italic text-muted">Sem texto de leitura para este contexto.</p>
          )}
        </section>

        {/* 2. Who is here now */}
        <Section title="Quem está aqui agora">
          {npcsPresent.length === 0 ? (
            <Empty>Ninguém de nota neste período.</Empty>
          ) : (
            <ul className="space-y-1">
              {npcsPresent.map((n) => {
                const activity = n.schedule.find((s) => s.locationId === location.id)?.activity;
                return (
                  <li key={n.id} className="flex items-center justify-between rounded border border-border bg-surface-2 px-2 py-1 text-sm">
                    <span>
                      <span className="font-medium">{n.name}</span>
                      {activity && <span className="text-muted"> — {activity}</span>}
                    </span>
                    <button
                      className="rounded bg-secret/10 px-2 py-0.5 text-[11px] text-secret hover:bg-secret/20"
                      title="Registrar morte do NPC"
                      onClick={() =>
                        recordEvent({
                          type: 'morte',
                          text: `${n.name} morreu em ${location.name}.`,
                          inGameDate: ctx.inGameDate,
                          tableId: ctx.tableId ?? undefined,
                          linkedEntityIds: [n.id, location.id],
                          effects: [{ type: 'setNpcStatus', npcId: n.id, status: 'morto' }],
                        })
                      }
                    >
                      morreu
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* 3. Clues available */}
        <Section title={`Pistas disponíveis (${cluesAvailable.length})`}>
          {cluesAvailable.length === 0 ? (
            <Empty>Nenhuma pista disponível aqui.</Empty>
          ) : (
            <ul className="space-y-1">
              {cluesAvailable.map((c) => (
                <li key={c.id} className="rounded border border-border bg-surface-2 p-2 text-sm">
                  <p>{c.text}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted">
                    <span>
                      {c.howToObtain.method}
                      {c.howToObtain.difficulty ? ` (${c.howToObtain.difficulty})` : ''}
                      {c.isBridge && <span className="ml-1 text-accent">· ponte</span>}
                    </span>
                    <button
                      className="rounded bg-accent/20 px-2 py-0.5 text-accent hover:bg-accent/30"
                      onClick={() =>
                        recordEvent({
                          type: 'descoberta',
                          text: `Pista descoberta em ${location.name}: ${c.text}`,
                          inGameDate: ctx.inGameDate,
                          tableId: ctx.tableId ?? undefined,
                          linkedEntityIds: [c.id, location.id],
                          effects: [{ type: 'setClueStatus', clueId: c.id, status: 'descoberta' }],
                        })
                      }
                    >
                      Marcar descoberta
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {cluesDiscovered.length > 0 && (
            <details className="mt-2 text-xs text-muted">
              <summary className="cursor-pointer">Já descobertas ({cluesDiscovered.length})</summary>
              <ul className="mt-1 space-y-1">
                {cluesDiscovered.map((c) => (
                  <li key={c.id} className="line-through">
                    {c.text}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Section>

        {/* 4. Scene cards */}
        <Section title="Cartões de cena">
          {sceneCards.length === 0 ? (
            <Empty>Nenhum cartão de cena ativo.</Empty>
          ) : (
            <ul className="space-y-2">
              {sceneCards.map((s) => (
                <li key={s.id} className="rounded border border-border bg-surface-2 p-2">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted">Gatilho: {s.trigger}</p>
                  {s.openingText && (
                    <div className="mt-1">
                      <KeeperMarkdown>{s.openingText}</KeeperMarkdown>
                    </div>
                  )}
                  {s.outcomes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-muted">Desfechos</p>
                      {s.outcomes.map((o, i) => (
                        <button
                          key={i}
                          className="block w-full rounded border border-border bg-surface px-2 py-1 text-left text-xs hover:border-accent"
                          title={o.description}
                          onClick={() =>
                            recordEvent({
                              type: 'outro',
                              text: `Cena "${s.title}" → ${o.label}: ${o.description}`,
                              inGameDate: ctx.inGameDate,
                              tableId: ctx.tableId ?? undefined,
                              linkedEntityIds: [s.id, location.id],
                              effects: [...o.effects, { type: 'markSceneUsed', sceneCardId: s.id }],
                            })
                          }
                        >
                          <span className="font-medium text-accent">{o.label}</span>
                          <span className="text-muted"> — {o.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 5. Plot layers (active + inactive) */}
        <Section title="Camadas de trama">
          {layers.length === 0 ? (
            <Empty>Nenhuma trama toca este local.</Empty>
          ) : (
            <ul className="space-y-2">
              {layers.map((l) => (
                <li
                  key={l.layer.id}
                  className={`rounded border p-2 text-sm ${
                    l.active ? 'border-accent/50 bg-accent/5' : 'border-border bg-surface-2/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{l.plot?.name ?? 'Trama'}</span>
                    <span className={`text-[11px] ${l.active ? 'text-accent' : 'text-muted'}`}>
                      {l.active ? 'ativa' : l.reason}
                    </span>
                  </div>
                  <p className="mt-1 text-muted">{l.layer.whatChanges}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 6. Handouts */}
        <Section title="Handouts">
          {handouts.length === 0 ? (
            <Empty>Nenhum handout vinculado.</Empty>
          ) : (
            <ul className="space-y-1">
              {handouts.map(({ handout, deliveredToActiveTable }) => (
                <li key={handout.id} className="rounded border border-border bg-surface-2 px-2 py-1 text-sm">
                  <span className="font-medium">{handout.title}</span>
                  <span className="ml-2 text-xs text-muted">
                    {deliveredToActiveTable ? 'entregue à mesa ativa' : 'não entregue'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 7. Sensory details */}
        <Section title="Detalhes sensoriais">
          {location.sensoryDetails.length === 0 ? (
            <Empty>Sem detalhes sensoriais.</Empty>
          ) : (
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted">
              {location.sensoryDetails.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </Section>

        {/* 8. History */}
        <Section title="Histórico">
          {history.length === 0 ? (
            <Empty>Nada registrado aqui ainda.</Empty>
          ) : (
            <ul className="space-y-1 text-sm">
              {history.map((e) => (
                <li key={e.id} className="rounded border border-border bg-surface-2 px-2 py-1">
                  <span className="text-xs text-muted">{e.inGameDate} · {e.type}</span>
                  <p>{e.text}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Footer actions */}
        <div className="flex items-center gap-2 border-t border-border pt-3 text-sm">
          <button
            className="flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 hover:bg-surface"
            onClick={toggleDiscovered}
          >
            {location.discovered ? <Eye size={14} /> : <EyeOff size={14} />}
            {location.discovered ? 'Visível aos jogadores' : 'Oculto dos jogadores'}
          </button>
          <span className="flex items-center gap-1 text-xs text-muted">
            <MapPin size={12} />
            {location.geometry.type === 'point'
              ? `(${Math.round(location.geometry.x)}, ${Math.round(location.geometry.y)})`
              : 'polígono'}
          </span>
        </div>
      </div>

      {presenting && (
        <PresentationMode text={readAloud.composed} onClose={() => setPresenting(false)} />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm italic text-muted">{children}</p>;
}
