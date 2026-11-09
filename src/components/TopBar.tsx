import { Moon, Sun, Clock, CloudRain, Search } from 'lucide-react';
import { useUiStore } from '@/state/uiStore';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { SessionControls } from '@/features/session/SessionControls';
import type { DayPeriod } from '@/db/schema';

const PERIOD_LABELS: Record<DayPeriod, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  madrugada: 'Madrugada',
};

/** Top bar: table selector, in-game date, day period, global search, theme. */
export function TopBar() {
  const { activeTableId, setActiveTableId, period, setPeriod, weather, setWeather, theme, toggleTheme } =
    useUiStore();

  const tables = useLiveData(() => db.gameTables.toArray(), []);
  const activeTable = tables?.find((t) => t.id === activeTableId);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <span className="font-serif text-lg font-medium text-accent">Painel do Mestre</span>

      {/* Table selector */}
      <label className="ml-4 flex items-center gap-2 text-sm">
        <span className="text-muted">Mesa:</span>
        <select
          className="rounded border border-border bg-surface-2 px-2 py-1"
          value={activeTableId ?? ''}
          onChange={(e) => setActiveTableId(e.target.value || null)}
          aria-label="Selecionar mesa ativa"
        >
          <option value="">— nenhuma —</option>
          {tables?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      {activeTable && (
        <span className="text-sm text-muted">
          {activeTable.inGameDate}
        </span>
      )}

      {/* Day period */}
      <label className="flex items-center gap-1 text-sm">
        <Clock size={16} className="text-muted" aria-hidden />
        <select
          className="rounded border border-border bg-surface-2 px-2 py-1"
          value={period}
          onChange={(e) => setPeriod(e.target.value as DayPeriod)}
          aria-label="Período do dia"
        >
          {(Object.keys(PERIOD_LABELS) as DayPeriod[]).map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABELS[p]}
            </option>
          ))}
        </select>
      </label>

      {/* Weather */}
      <button
        className={`flex items-center gap-1 rounded border border-border px-2 py-1 text-sm ${
          weather === 'chuva' ? 'bg-test/20 text-test' : 'bg-surface-2 text-muted'
        }`}
        onClick={() => setWeather(weather === 'chuva' ? 'seco' : 'chuva')}
        aria-pressed={weather === 'chuva'}
        aria-label="Alternar chuva"
      >
        <CloudRain size={16} aria-hidden /> {weather === 'chuva' ? 'Chuva' : 'Seco'}
      </button>

      {/* Session controls */}
      <div className="ml-auto flex items-center gap-2">
        <SessionControls />
      </div>

      {/* Global search placeholder (Fase 5) */}
      <div className="flex items-center gap-2 rounded border border-border bg-surface-2 px-2 py-1 text-sm text-muted">
        <Search size={16} aria-hidden />
        <span className="hidden lg:inline">Busca (Ctrl/Cmd+K) — Fase 5</span>
      </div>

      <button
        className="rounded border border-border bg-surface-2 p-2"
        onClick={toggleTheme}
        aria-label="Alternar tema claro/escuro"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  );
}
