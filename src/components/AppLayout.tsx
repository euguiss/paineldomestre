import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { DossierPanel } from '@/features/dossier/DossierPanel';
import { QuickNoteModal } from '@/features/session/QuickNoteModal';
import { useUiStore } from '@/state/uiStore';

/** Overall shell: top bar, left nav, central area, right dossier panel. */
export function AppLayout() {
  const selectedLocationId = useUiStore((s) => s.selectedLocationId);
  const activeSessionId = useUiStore((s) => s.activeSessionId);
  const [quickNote, setQuickNote] = useState(false);

  // Global 'N' shortcut opens the quick note during a live session (5.7).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (typing) return;
      if (e.key.toLowerCase() === 'n' && activeSessionId) {
        e.preventDefault();
        setQuickNote(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeSessionId]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-text">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <main className="min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
        {selectedLocationId && (
          <aside className="w-[420px] shrink-0 overflow-y-auto border-l border-border bg-surface">
            <DossierPanel locationId={selectedLocationId} />
          </aside>
        )}
      </div>
      {quickNote && <QuickNoteModal onClose={() => setQuickNote(false)} />}
    </div>
  );
}
