import { describe, it, expect } from 'vitest';
import {
  skillTiers,
  hitPoints,
  magicPoints,
  sanity,
  buildAndDamageBonus,
  baseMove,
  occupationSkillPoints,
  interestSkillPoints,
  deriveAll,
  computeBudget,
} from './cocRules';
import type { Characteristics } from './cocRules';

const avg: Characteristics = { FOR: 50, CON: 50, TAM: 50, DES: 50, APA: 50, INT: 50, POD: 50, EDU: 50 };

describe('skillTiers (metade e quinto)', () => {
  it('computes regular, hard (half), extreme (fifth)', () => {
    expect(skillTiers(70)).toEqual({ regular: 70, hard: 35, extreme: 14 });
    expect(skillTiers(45)).toEqual({ regular: 45, hard: 22, extreme: 9 });
    expect(skillTiers(1)).toEqual({ regular: 1, hard: 0, extreme: 0 });
  });
});

describe('derived values', () => {
  it('hit points = (CON + TAM) / 10 rounded down', () => {
    expect(hitPoints({ ...avg, CON: 55, TAM: 60 })).toBe(11);
    expect(hitPoints({ ...avg, CON: 50, TAM: 50 })).toBe(10);
  });

  it('magic points = POD / 5', () => {
    expect(magicPoints({ ...avg, POD: 65 })).toBe(13);
  });

  it('sanity starts at POD', () => {
    expect(sanity({ ...avg, POD: 60 })).toBe(60);
  });
});

describe('build & damage bonus', () => {
  it('matches the CoC 7e thresholds', () => {
    expect(buildAndDamageBonus({ ...avg, FOR: 30, TAM: 30 })).toEqual({ build: -2, damageBonus: '-2' }); // 60
    expect(buildAndDamageBonus({ ...avg, FOR: 40, TAM: 40 })).toEqual({ build: -1, damageBonus: '-1' }); // 80
    expect(buildAndDamageBonus({ ...avg, FOR: 50, TAM: 50 })).toEqual({ build: 0, damageBonus: 'Nenhum' }); // 100
    expect(buildAndDamageBonus({ ...avg, FOR: 70, TAM: 70 })).toEqual({ build: 1, damageBonus: '+1d4' }); // 140
    expect(buildAndDamageBonus({ ...avg, FOR: 90, TAM: 90 })).toEqual({ build: 2, damageBonus: '+1d6' }); // 180
    expect(buildAndDamageBonus({ ...avg, FOR: 110, TAM: 100 })).toEqual({ build: 3, damageBonus: '+2d6' }); // 210
  });
});

describe('move and skill points', () => {
  it('base move depends on FOR/DES vs TAM', () => {
    expect(baseMove({ ...avg, FOR: 40, DES: 40, TAM: 60 })).toBe(7);
    expect(baseMove({ ...avg, FOR: 70, DES: 70, TAM: 50 })).toBe(9);
    expect(baseMove({ ...avg, FOR: 60, DES: 40, TAM: 50 })).toBe(8);
  });

  it('occupation points = EDU x 4, interest = INT x 2', () => {
    expect(occupationSkillPoints({ ...avg, EDU: 70 })).toBe(280);
    expect(interestSkillPoints({ ...avg, INT: 60 })).toBe(120);
  });
});

describe('deriveAll', () => {
  it('returns all derived fields', () => {
    const d = deriveAll({ FOR: 50, CON: 60, TAM: 55, DES: 60, APA: 50, INT: 70, POD: 65, EDU: 80 });
    expect(d.PV).toBe(11); // (60+55)/10
    expect(d.PM).toBe(13); // 65/5
    expect(d.SAN).toBe(65); // POD
    expect(d.Movimento).toBe(8);
    expect(d.BonusDeDano).toBe('Nenhum'); // 105
  });
});

describe('computeBudget (contador de pontos)', () => {
  it('tracks spent/remaining and overspending', () => {
    const b = computeBudget(280, [70, 60, 50]);
    expect(b.spent).toBe(180);
    expect(b.remaining).toBe(100);
    expect(b.overspent).toBe(false);

    const over = computeBudget(100, [60, 60]);
    expect(over.remaining).toBe(-20);
    expect(over.overspent).toBe(true);
  });
});
