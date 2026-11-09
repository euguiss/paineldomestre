import type { LocationEntity, NpcEntity, FactionEntity } from '@/db/schema';

export type ReconcileConfidence = 'exata' | 'alias' | 'aproximada' | 'nenhuma';

export interface ReconcileSuggestion {
  /** The reference string from the scenario package. */
  ref: string;
  /** The best candidate existing entity id, if any. */
  matchId: string | null;
  matchName: string | null;
  confidence: ReconcileConfidence;
  /** 0..1 similarity used for the approximate case. */
  similarity: number;
}

interface Candidate {
  id: string;
  name: string;
  externalKey?: string;
  aliases?: string[];
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Dice coefficient on character bigrams — cheap, dependency-free similarity. */
export function similarity(a: string, b: string): number {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const bigrams = (s: string) => {
    const set = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i += 1) {
      const g = s.slice(i, i + 2);
      set.set(g, (set.get(g) ?? 0) + 1);
    }
    return set;
  };
  const bx = bigrams(x);
  const by = bigrams(y);
  let inter = 0;
  for (const [g, cx] of bx) {
    const cy = by.get(g);
    if (cy) inter += Math.min(cx, cy);
  }
  const total = [...bx.values()].reduce((a2, b2) => a2 + b2, 0) + [...by.values()].reduce((a2, b2) => a2 + b2, 0);
  return total === 0 ? 0 : (2 * inter) / total;
}

/** The approximate-match threshold. */
export const APPROX_THRESHOLD = 0.6;

/**
 * Reconcile a single reference against candidate entities (section 6.1):
 * exact name/externalKey, then alias, then fuzzy similarity. Pure & testable.
 */
export function reconcileRef(ref: string, candidates: Candidate[]): ReconcileSuggestion {
  const nref = norm(ref);

  // 1. exact name or externalKey
  for (const c of candidates) {
    if (norm(c.name) === nref || (c.externalKey && norm(c.externalKey) === nref)) {
      return { ref, matchId: c.id, matchName: c.name, confidence: 'exata', similarity: 1 };
    }
  }

  // 2. alias
  for (const c of candidates) {
    if (c.aliases?.some((a) => norm(a) === nref)) {
      return { ref, matchId: c.id, matchName: c.name, confidence: 'alias', similarity: 1 };
    }
  }

  // 3. approximate
  let best: { c: Candidate; sim: number } | null = null;
  for (const c of candidates) {
    const sim = similarity(ref, c.name);
    if (!best || sim > best.sim) best = { c, sim };
  }
  if (best && best.sim >= APPROX_THRESHOLD) {
    return { ref, matchId: best.c.id, matchName: best.c.name, confidence: 'aproximada', similarity: best.sim };
  }

  return { ref, matchId: null, matchName: null, confidence: 'nenhuma', similarity: best?.sim ?? 0 };
}

export function candidatesFromLocations(locations: LocationEntity[]): Candidate[] {
  return locations.map((l) => ({ id: l.id, name: l.name, externalKey: l.externalKey, aliases: l.aliases }));
}
export function candidatesFromNpcs(npcs: NpcEntity[]): Candidate[] {
  return npcs.map((n) => ({ id: n.id, name: n.name, externalKey: n.externalKey, aliases: n.aliases }));
}
export function candidatesFromFactions(factions: FactionEntity[]): Candidate[] {
  return factions.map((f) => ({ id: f.id, name: f.name, externalKey: f.externalKey, aliases: f.aliases }));
}
