import { Play, Square, StickyNote } from 'lucide-react';
import { useState } from 'react';
import { useUiStore } from '@/state/uiStore';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { newBase } from '@/db/ids';
import { QuickNoteModal } from './QuickNoteModal';
import type { SessionEntity } from '@/db/schema';

/** Start/stop a live session and open the quick-note modal (section 5.7). */
export function SessionControls() {
  const activeTableId = useUiStore((s) => s.activeTableId);
  const activeSessionId = useUiStore((s) => s.activeSessionId);
  const setActiveSessionId = useUiStore((s) => s.setActiveSessionId);
  const [noteOpen, setNoteOpen] = useState(false);

  const table = useLiveData(
    () => (activeTableId ? db.gameTables.get(activeTableId) : Promise.resolve(undefined)),
    [activeTableId],
  );

  async function startSession() {
    if (!activeTableId || !table) {
      alert('Selecione uma mesa antes de iniciar a sessão.');
      return;
    }
    const session: SessionEntity = {
      ...newBase(),
      tableId: activeTableId,
      realDate: new Date().toISOString().slice(0, 10),
      inGameStart: table.inGameDate,
      inGameEnd: '',
      summary: '',
      eventIds: [],
    };
    await db.sessions.put(session);
    setActiveSessionId(session.id);
  }

  async function stopSession() {
    if (activeSessionId && table) {
      await db.sessions.update(activeSessionId, { inGameEnd: table.inGameDate, updatedAt: new Date().toISOString() });
    }
    setActiveSessionId(null);
  }

  return (
    <>
      {activeSessionId ? (
        <>
          <button
            className="flex items-center gap-1 rounded border border-accent/50 bg-accent/10 px-2 py-1 text-sm text-accent"
            onClick={() => setNoteOpen(true)}
            title="Nota rápida (N)"
          >
            <StickyNote size={15} /> Nota
          </button>
          <button className="flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-sm" onClick={stopSession}>
            <Square size={14} /> Encerrar sessão
          </button>
          <span className="flex items-center gap-1 text-xs text-accent">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> em sessão
          </span>
        </>
      ) : (
        <button className="flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-sm" onClick={startSession}>
          <Play size={14} /> Iniciar sessão
        </button>
      )}

      {noteOpen && <QuickNoteModal onClose={() => setNoteOpen(false)} />}
    </>
  );
}
