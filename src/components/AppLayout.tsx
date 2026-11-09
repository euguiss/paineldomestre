import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { DossierPanel } from '@/features/dossier/DossierPanel';
import { useUiStore } from '@/state/uiStore';

/** Overall shell: top bar, left nav, central area, right dossier panel. */
export function AppLayout() {
  const selectedLocationId = useUiStore((s) => s.selectedLocationId);

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
    </div>
  );
}
