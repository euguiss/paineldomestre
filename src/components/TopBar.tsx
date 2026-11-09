import { useState } from 'react';
import { Moon, Sun, Clock, CloudRain, Search, Users } from 'lucide-react';
import { useUiStore } from '@/state/uiStore';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { SessionControls } from '@/features/session/SessionControls';
import { TablesManager } from '@/features/tables/TablesManager';
import { Select, IconButton } from '@/components/ui';
import type { DayPeriod } from '@/db/schema';

const PERIOD_LABELS: Record<DayPeriod, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  madrugada: 'Madrugada',
};

/** Top bar: table selector + manager, in-game date, day period, search, theme. */
export function TopBar() {
  const { activeTableId, setActiveTableId, period, setPeriod, weather, setWeather, theme, toggleTheme } = useUiStore();
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const tables = useLiveData(() => db.gameTables.toArray(), []);
  const activeTable = tables?.find((t) => t.id === activeTableId);
  const [tablesOpen, setTablesOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2">
        <span className="font-serif text-lg font-semibold text-accent">Painel do Mestre</span>
      </div>

      <div className="mx-1 h-6 w-px bg-border" />

      {/* Table selector + manager */}
      <div className="flex items-center gap-1.5 text-sm">
        <Users size={16} className="text-muted" aria-hidden />
        <Select
          className="w-auto min-w-[9rem]"
          value={activeTableId ?? ''}
          onChange={(e) => setActiveTableId(e.target.value || null)}
          aria-label="Selecionar mesa ativa"
        >
          <option value="">— nenhuma mesa —</option>
          {tables?.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
        </Select>
        <button
          onClick={() => setTablesOpen(true)}
          className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:border-border-strong hover:text-text"
          title="Gerenciar mesas / criar nova"
        >
          + Mesa
        </button>
      </div>

      {activeTable?.inGameDate && <span className="text-sm text-muted">· {activeTable.inGameDate}</span>}

      {/* Day period */}
      <label className="ml-1 flex items-center gap-1.5 text-sm">
        <Clock size={16} className="text-muted" aria-hidden />
        <Select className="w-auto" value={period} onChange={(e) => setPeriod(e.target.value as DayPeriod)} aria-label="Período do dia">
          {(Object.keys(PERIOD_LABELS) as DayPeriod[]).map((p) => (<option key={p} value={p}>{PERIOD_LABELS[p]}</option>))}
        </Select>
      </label>

      {/* Weather */}
      <button
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${weather === 'chuva' ? 'border-test/40 bg-test/15 text-test' : 'border-border bg-surface-2 text-muted hover:text-text'}`}
        onClick={() => setWeather(weather === 'chuva' ? 'seco' : 'chuva')}
        aria-pressed={weather === 'chuva'}
        aria-label="Alternar chuva"
      >
        <CloudRain size={15} aria-hidden /> {weather === 'chuva' ? 'Chuva' : 'Seco'}
      </button>

      <div className="ml-auto flex items-center gap-2">
        <SessionControls />
        <button
          className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-sm text-muted transition-colors hover:border-border-strong hover:text-text"
          onClick={() => setSearchOpen(true)}
          aria-label="Abrir busca global"
        >
          <Search size={15} aria-hidden />
          <span className="hidden lg:inline">Buscar</span>
          <kbd className="hidden rounded border border-border px-1 text-[10px] lg:inline">⌘K</kbd>
        </button>
        <IconButton label="Alternar tema claro/escuro" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </IconButton>
      </div>

      {tablesOpen && <TablesManager onClose={() => setTablesOpen(false)} />}
    </header>
  );
}
