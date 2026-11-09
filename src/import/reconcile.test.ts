import { describe, it, expect } from 'vitest';
import { reconcileRef, similarity, APPROX_THRESHOLD } from './reconcile';

const candidates = [
  { id: 'l1', name: 'Armazém da Enseada', aliases: ['Galpão do Cais'] },
  { id: 'l2', name: 'Taverna Maré Mansa', externalKey: 'taverna-mare-mansa' },
];

describe('reconcileRef (6.1)', () => {
  it('matches by exact name', () => {
    const r = reconcileRef('Armazém da Enseada', candidates);
    expect(r.confidence).toBe('exata');
    expect(r.matchId).toBe('l1');
  });

  it('matches by externalKey exactly', () => {
    const r = reconcileRef('taverna-mare-mansa', candidates);
    expect(r.confidence).toBe('exata');
    expect(r.matchId).toBe('l2');
  });

  it('matches by alias', () => {
    const r = reconcileRef('Galpão do Cais', candidates);
    expect(r.confidence).toBe('alias');
    expect(r.matchId).toBe('l1');
  });

  it('matches approximately above threshold', () => {
    const r = reconcileRef('Armazem da Enseda', candidates); // typos, no accent
    expect(r.confidence).toBe('aproximada');
    expect(r.matchId).toBe('l1');
    expect(r.similarity).toBeGreaterThanOrEqual(APPROX_THRESHOLD);
  });

  it('returns none for a nonexistent reference', () => {
    const r = reconcileRef('Observatório Esquecido', candidates);
    expect(r.confidence).toBe('nenhuma');
    expect(r.matchId).toBeNull();
  });
});

describe('similarity', () => {
  it('is 1 for identical (normalized) strings and lower for different', () => {
    expect(similarity('Casa', 'casa')).toBe(1);
    expect(similarity('abc', 'xyz')).toBeLessThan(0.3);
  });
});
