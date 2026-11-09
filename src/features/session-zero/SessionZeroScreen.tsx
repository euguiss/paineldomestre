import { useEffect, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { ScreenHeader, Button } from '@/components/ui';
import { useUiStore } from '@/state/uiStore';
import { RoteiroTab } from './RoteiroTab';
import { AmbientacaoTab } from './AmbientacaoTab';
import { TomRegrasTab } from './TomRegrasTab';
import { InvestigadoresTab } from './InvestigadoresTab';
import { CoberturaTab } from './CoberturaTab';
import { ReadingMode } from './ReadingMode';
import type { SessionZeroEntity } from '@/db/schema';

type Tab = 'roteiro' | 'ambientacao' | 'tom' | 'investigadores' | 'cobertura';
const TABS: { id: Tab; label: string }[] = [
  { id: 'roteiro', label: 'Roteiro' },
  { id: 'ambientacao', label: 'Guia de ambientação' },
  { id: 'tom', label: 'Tom e regras' },
  { id: 'investigadores', label: 'Investigadores' },
  { id: 'cobertura', label: 'Cobertura' },
];

/**
 * Sessão 0 — exclusive Keeper tool (section 13).
 *
 * The whole app is Keeper-only and offline: there is no player-facing route,
 * window or sync channel anywhere, so Session Zero content has no way to reach
 * players. It is just one more tab inside the Keeper shell.
 */
export function SessionZeroScreen() {
  const activeTableId = useUiStore((s) => s.activeTableId);
  const [tab, setTab] = useState<Tab>('roteiro');
  const [reading, setReading] = useState(false);

  const sessionZero = useLiveData<SessionZeroEntity | undefined>(
    () => (activeTableId ? db.sessionZeros.where('tableId').equals(activeTableId).first() : Promise.resolve(undefined)),
    [activeTableId],
  );

  // Ensure a SessionZero exists for the active table.
  useEffect(() => {
    if (activeTableId && sessionZero === undefined) {
      // sessionZero is undefined both while loading and when absent; guard with a count.
      db.sessionZeros.where('tableId').equals(activeTableId).count().then((n) => {
        if (n === 0) {
          const sz: SessionZeroEntity = {
            ...newBase(),
            tableId: activeTableId,
            agenda: [],
            tone: { lines: '', veils: '', xCard: true, horrorLevel: '', notes: '' },
            houseRules: [],
            loreCards: [],
            rumors: [],
          };
          void db.sessionZeros.put(sz);
        }
      });
    }
  }, [activeTableId, sessionZero]);

  if (!activeTableId) {
    return (
      <div className="flex h-full items-center justify-center text-center text-muted">
        <p>Selecione uma mesa no topo para preparar a Sessão 0.</p>
      </div>
    );
  }

  if (!sessionZero) {
    return <div className="p-8 text-muted">Preparando Sessão 0…</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Sessão 0">
        <span className="rounded bg-secret/10 px-2 py-1 text-xs text-secret">Exclusivo do Mestre — nunca visível aos jogadores</span>
        <Button onClick={() => setReading(true)}>
          <Maximize2 size={14} className="mr-1 inline" /> Modo leitura
        </Button>
      </ScreenHeader>

      <div className="flex gap-1 overflow-x-auto border-b border-border px-2 py-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded px-3 py-1 text-sm ${tab === t.id ? 'bg-accent/20 text-accent' : 'text-muted hover:text-text'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'roteiro' && <RoteiroTab sz={sessionZero} />}
        {tab === 'ambientacao' && <AmbientacaoTab sz={sessionZero} />}
        {tab === 'tom' && <TomRegrasTab sz={sessionZero} />}
        {tab === 'investigadores' && <InvestigadoresTab tableId={activeTableId} />}
        {tab === 'cobertura' && <CoberturaTab tableId={activeTableId} />}
      </div>

      {reading && <ReadingMode sz={sessionZero} onClose={() => setReading(false)} />}
    </div>
  );
}

/** Helper shared by tabs to patch the SessionZero record. */
export async function patchSz(id: string, changes: Partial<SessionZeroEntity>) {
  await db.sessionZeros.update(id, { ...changes, updatedAt: new Date().toISOString() });
}
