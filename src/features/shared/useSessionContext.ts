import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { useUiStore } from '@/state/uiStore';

export interface SessionContext {
  tableId: string | null;
  inGameDate: string;
  /** Whether a session is live (quick actions auto-log events — section 5.7). */
  sessionActive: boolean;
}

/** Resolve the current table/date context used by every quick action. */
export function useSessionContext(): SessionContext {
  const activeTableId = useUiStore((s) => s.activeTableId);
  const activeSessionId = useUiStore((s) => s.activeSessionId);
  const table = useLiveData(
    () => (activeTableId ? db.gameTables.get(activeTableId) : Promise.resolve(undefined)),
    [activeTableId],
  );

  return {
    tableId: activeTableId,
    inGameDate: table?.inGameDate ?? 'data desconhecida',
    sessionActive: Boolean(activeSessionId),
  };
}
