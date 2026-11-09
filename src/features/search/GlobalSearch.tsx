import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { searchAll, type SearchResult, type SearchResultType } from '@/domain/search';
import { useUiStore } from '@/state/uiStore';

const TYPE_LABEL: Record<SearchResultType, string> = {
  location: 'Local',
  npc: 'NPC',
  faction: 'Facção',
  plot: 'Trama',
  clue: 'Pista',
  handout: 'Handout',
};

/** Global search palette (Ctrl/Cmd+K) — section 6.11. */
export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const selectLocation = useUiStore((s) => s.selectLocation);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const locations = useLiveData(() => db.locations.toArray(), []) ?? [];
  const npcs = useLiveData(() => db.npcs.toArray(), []) ?? [];
  const factions = useLiveData(() => db.factions.toArray(), []) ?? [];
  const plots = useLiveData(() => db.plots.toArray(), []) ?? [];
  const clues = useLiveData(() => db.clues.toArray(), []) ?? [];
  const handouts = useLiveData(() => db.handouts.toArray(), []) ?? [];

  const results = useMemo(
    () => searchAll(query, { locations, npcs, factions, plots, clues, handouts }),
    [query, locations, npcs, factions, plots, clues, handouts],
  );

  useEffect(() => setActive(0), [query]);

  function go(r: SearchResult) {
    switch (r.type) {
      case 'location': selectLocation(r.id); navigate('/'); break;
      case 'npc': navigate('/npcs'); break;
      case 'faction': navigate('/faccoes'); break;
      case 'plot': navigate('/tramas'); break;
      case 'clue': navigate('/pistas'); break;
      case 'handout': navigate('/handouts'); break;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-start justify-center bg-black/50 p-24" onClick={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search size={18} className="text-muted" />
          <input
            autoFocus
            className="flex-1 bg-transparent py-1 outline-none"
            placeholder="Buscar locais, NPCs, tramas, pistas, handouts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === 'Enter' && results[active]) go(results[active]);
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>
        <ul className="max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <li key={`${r.type}-${r.id}`}>
              <button
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${i === active ? 'bg-accent/15' : 'hover:bg-surface-2'}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
              >
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-muted">{TYPE_LABEL[r.type]}</span>
                <span className="flex-1 truncate">{r.title}</span>
                <span className="truncate text-xs text-muted">{r.subtitle}</span>
              </button>
            </li>
          ))}
          {query && results.length === 0 && <li className="px-3 py-4 text-sm text-muted">Nada encontrado.</li>}
        </ul>
      </div>
    </div>
  );
}
