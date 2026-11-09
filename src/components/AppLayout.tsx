import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { DossierPanel } from '@/features/dossier/DossierPanel';
import { QuickNoteModal } from '@/features/session/QuickNoteModal';
import { GlobalSearch } from '@/features/search/GlobalSearch';
import { useUiStore } from '@/state/uiStore';

/** Overall shell: top bar, left nav, central area, right dossier panel. */
export function AppLayout() {
  const selectedLocationId = useUiStore((s) => s.selectedLocationId);
  const activeSessionId = useUiStore((s) => s.activeSessionId);
  const searchOpen = useUiStore((s) => s.searchOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const [quickNote, setQuickNote] = useState(false);

  // Global 'N' shortcut opens the quick note during a live session (5.7).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
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
  }, [activeSessionId, setSearchOpen]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-text">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <main className="min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
        {selectedLocationId && (
          <aside className="flex w-[440px] shrink-0 flex-col overflow-hidden border-l border-border bg-surface shadow-[inset_1px_0_0_rgb(var(--border))]">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DossierPanel locationId={selectedLocationId} />
            </div>
          </aside>
        )}
      </div>
      {quickNote && <QuickNoteModal onClose={() => setQuickNote(false)} />}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
