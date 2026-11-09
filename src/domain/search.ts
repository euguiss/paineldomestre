import type {
  ClueEntity,
  FactionEntity,
  HandoutEntity,
  LocationEntity,
  NpcEntity,
  PlotEntity,
} from '@/db/schema';

export type SearchResultType = 'location' | 'npc' | 'faction' | 'plot' | 'clue' | 'handout';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  /** Lowercased haystack used for matching (name + text + tags). */
  score: number;
}

export interface SearchCorpus {
  locations: LocationEntity[];
  npcs: NpcEntity[];
  factions: FactionEntity[];
  plots: PlotEntity[];
  clues: ClueEntity[];
  handouts: HandoutEntity[];
}

/**
 * Global search across names, free text and tags (section 6.11). Pure &
 * testable. Returns ranked results (exact-ish name matches first).
 */
export function searchAll(query: string, corpus: SearchCorpus, limit = 30): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];
  const push = (type: SearchResultType, id: string, title: string, subtitle: string, haystacks: string[]) => {
    const hay = haystacks.join(' \u0001 ').toLowerCase();
    if (!hay.includes(q)) return;
    // Rank: title startsWith > title includes > body includes.
    const t = title.toLowerCase();
    const score = t.startsWith(q) ? 3 : t.includes(q) ? 2 : 1;
    results.push({ type, id, title, subtitle, score });
  };

  for (const l of corpus.locations) {
    push('location', l.id, l.name, l.district ?? l.kind, [l.name, l.baseDescription, ...l.tags, ...(l.aliases ?? [])]);
  }
  for (const n of corpus.npcs) {
    push('npc', n.id, n.name, n.status, [n.name, n.appearance, ...n.typicalLines, ...n.tags]);
  }
  for (const f of corpus.factions) {
    push('faction', f.id, f.name, 'facção', [f.name, f.goals, ...f.tags]);
  }
  for (const p of corpus.plots) {
    push('plot', p.id, p.name, p.state, [p.name, p.sourceModule, p.antagonists, ...p.tags]);
  }
  for (const c of corpus.clues) {
    push('clue', c.id, c.text.slice(0, 60), c.status, [c.text, ...c.tags]);
  }
  for (const h of corpus.handouts) {
    push('handout', h.id, h.title, 'handout', [h.title, h.textContent ?? '', h.playerSafeCaption, ...h.tags]);
  }

  results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return results.slice(0, limit);
}
