import { describe, it, expect } from 'vitest';
import { resolveReadAloud } from './readAloud';
import type { ReadAloudVariants } from '@/db/schema';

const full: ReadAloudVariants = {
  primeiraVisita: 'PRIMEIRA',
  retorno: 'RETORNO',
  dia: 'DIA',
  noite: 'NOITE',
  chuva: 'CHUVA',
  generico: 'GENERICO',
};

describe('resolveReadAloud', () => {
  it('prefers first-visit over everything else', () => {
    const r = resolveReadAloud(full, { period: 'tarde', visit: 'primeiraVisita', weather: 'seco' });
    expect(r.variant).toBe('primeiraVisita');
    expect(r.text).toBe('PRIMEIRA');
  });

  it('falls back from visit to weather to period to generic', () => {
    const onlyGeneric: ReadAloudVariants = { generico: 'G' };
    const r = resolveReadAloud(onlyGeneric, { period: 'manha', visit: 'retorno', weather: 'chuva' });
    expect(r.variant).toBe('generico');
  });

  it('uses chuva when visit variant is missing and it is raining', () => {
    const v: ReadAloudVariants = { chuva: 'C', dia: 'D', generico: 'G' };
    const r = resolveReadAloud(v, { period: 'tarde', visit: 'primeiraVisita', weather: 'chuva' });
    expect(r.variant).toBe('chuva');
  });

  it('maps madrugada to the noite variant', () => {
    const v: ReadAloudVariants = { dia: 'D', noite: 'N', generico: 'G' };
    const r = resolveReadAloud(v, { period: 'madrugada', visit: 'retorno', weather: 'seco' });
    expect(r.variant).toBe('noite');
  });

  it('respects a forced variant when present', () => {
    const r = resolveReadAloud(full, { period: 'tarde', visit: 'primeiraVisita', weather: 'seco' }, 'noite');
    expect(r.variant).toBe('noite');
    expect(r.text).toBe('NOITE');
  });

  it('ignores a forced variant that is empty and falls through', () => {
    const v: ReadAloudVariants = { dia: 'D', generico: 'G' };
    const r = resolveReadAloud(v, { period: 'manha', visit: 'retorno', weather: 'seco' }, 'noite');
    // forced 'noite' absent -> cascade -> dia
    expect(r.variant).toBe('dia');
  });

  it('returns empty text and null variant when nothing is available', () => {
    const r = resolveReadAloud({}, { period: 'manha', visit: 'retorno', weather: 'seco' });
    expect(r.text).toBe('');
    expect(r.variant).toBeNull();
  });
});
