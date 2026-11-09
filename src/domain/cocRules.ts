import type { InvestigatorEntity } from '@/db/schema';

/**
 * Call of Cthulhu 7th edition investigator math (section 13).
 *
 * These follow the standard CoC 7e rules, but the app always reminds the
 * Keeper to check the book, since house rules can change them. Every function
 * is pure and unit tested.
 */

export type Characteristics = InvestigatorEntity['characteristics'];

/** Half and fifth values of a skill/characteristic (CoC 7e success levels). */
export interface SkillTiers {
  regular: number;
  hard: number; // half
  extreme: number; // fifth
}

export function skillTiers(value: number): SkillTiers {
  const v = Math.max(0, Math.round(value));
  return {
    regular: v,
    hard: Math.floor(v / 2),
    extreme: Math.floor(v / 5),
  };
}

/** Hit points = (CON + TAM) / 10, rounded down. */
export function hitPoints(c: Characteristics): number {
  return Math.floor((c.CON + c.TAM) / 10);
}

/** Magic points = POD / 5, rounded down. */
export function magicPoints(c: Characteristics): number {
  return Math.floor(c.POD / 5);
}

/** Starting Sanity = POD (before any loss). */
export function sanity(c: Characteristics): number {
  return c.POD;
}

/**
 * Build & Damage bonus from (FOR + TAM), per the CoC 7e table.
 * Returns a tuple { build, damageBonus } where damageBonus is a dice string.
 */
export function buildAndDamageBonus(c: Characteristics): { build: number; damageBonus: string } {
  const sum = c.FOR + c.TAM;
  if (sum <= 64) return { build: -2, damageBonus: '-2' };
  if (sum <= 84) return { build: -1, damageBonus: '-1' };
  if (sum <= 124) return { build: 0, damageBonus: 'Nenhum' };
  if (sum <= 164) return { build: 1, damageBonus: '+1d4' };
  if (sum <= 204) return { build: 2, damageBonus: '+1d6' };
  // Above 204: +1 die step per 80 points (simplified, matches book progression).
  const extra = Math.floor((sum - 205) / 80);
  const builds = ['+2d6', '+3d6', '+4d6', '+5d6'];
  return { build: 3 + extra, damageBonus: builds[Math.min(extra, builds.length - 1)] };
}

/**
 * Base move (MOV) from FOR/DES vs TAM, with an age penalty summary.
 * Age penalties below 40 are ignored; this returns the pre-age MOV and the
 * Keeper applies age modifiers in the wizard.
 */
export function baseMove(c: Characteristics): number {
  if (c.FOR < c.TAM && c.DES < c.TAM) return 7;
  if (c.FOR >= c.TAM && c.DES >= c.TAM) return 9;
  return 8;
}

/** Occupation skill points: usually EDU x 4 (the common default). */
export function occupationSkillPoints(c: Characteristics): number {
  return c.EDU * 4;
}

/** Personal interest skill points: INT x 2. */
export function interestSkillPoints(c: Characteristics): number {
  return c.INT * 2;
}

/** All derived values in one shot, matching InvestigatorEntity['derived']. */
export function deriveAll(c: Characteristics): InvestigatorEntity['derived'] {
  const { build, damageBonus } = buildAndDamageBonus(c);
  return {
    PV: hitPoints(c),
    PM: magicPoints(c),
    SAN: sanity(c),
    Sorte: 0, // rolled separately (3d6 x 5); Keeper enters it
    Movimento: baseMove(c),
    Corpo: String(build),
    BonusDeDano: damageBonus,
  };
}

/** Points spent/remaining for the skill-point counters in the wizard. */
export interface PointBudget {
  total: number;
  spent: number;
  remaining: number;
  overspent: boolean;
}

export function computeBudget(total: number, allocations: number[]): PointBudget {
  const spent = allocations.reduce((a, b) => a + Math.max(0, b), 0);
  return {
    total,
    spent,
    remaining: total - spent,
    overspent: spent > total,
  };
}
