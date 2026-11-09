import { create } from 'zustand';
import type { DayPeriod } from '@/db/schema';
import type { VisitKind, Weather } from '@/domain/readAloud';

/**
 * UI-only state (Zustand). Persisted data lives in Dexie; this store holds the
 * "table context" that influences how dossiers are rendered: active table,
 * in-game day period, weather, and whether a session is live.
 */
interface UiState {
  activeTableId: string | null;
  period: DayPeriod;
  weather: Weather;
  /** Whether the party has visited the currently-open location before. */
  visit: VisitKind;
  activeSessionId: string | null;

  /** Currently selected location (opens the dossier panel). */
  selectedLocationId: string | null;

  /** Entity in focus for the quick-note shortcut (N): id + human label. */
  focusedEntity: { id: string; label: string } | null;

  /** Whether the global search palette is open (Ctrl/Cmd+K). */
  searchOpen: boolean;

  theme: 'dark' | 'light';

  setActiveTableId: (id: string | null) => void;
  setPeriod: (p: DayPeriod) => void;
  setWeather: (w: Weather) => void;
  setVisit: (v: VisitKind) => void;
  setActiveSessionId: (id: string | null) => void;
  selectLocation: (id: string | null) => void;
  setFocusedEntity: (e: { id: string; label: string } | null) => void;
  setSearchOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTableId: null,
  period: 'tarde',
  weather: 'seco',
  visit: 'primeiraVisita',
  activeSessionId: null,
  selectedLocationId: null,
  focusedEntity: null,
  searchOpen: false,
  theme: 'dark',

  setActiveTableId: (id) => set({ activeTableId: id }),
  setPeriod: (p) => set({ period: p }),
  setWeather: (w) => set({ weather: w }),
  setVisit: (v) => set({ visit: v }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  selectLocation: (id) => set({ selectedLocationId: id, focusedEntity: id ? { id, label: 'local' } : null }),
  setFocusedEntity: (e) => set({ focusedEntity: e }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;
      root.classList.toggle('dark', next === 'dark');
      root.classList.toggle('light', next === 'light');
      return { theme: next };
    }),
}));
