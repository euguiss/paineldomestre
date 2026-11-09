import type { ReadAloudVariants, DayPeriod } from '@/db/schema';

export type VisitKind = 'primeiraVisita' | 'retorno';
export type Weather = 'chuva' | 'seco';

export interface ReadAloudContext {
  period: DayPeriod;
  visit: VisitKind;
  weather: Weather;
}

/**
 * The resolved read-aloud text plus which variant produced it, so the UI can
 * show the active variant chip (section 5.1).
 */
export interface ResolvedReadAloud {
  text: string;
  variant: keyof ReadAloudVariants | null;
}

/**
 * Pick the most specific available read-aloud variant with a fallback cascade.
 *
 * Priority (most specific first):
 *   1. visit (primeiraVisita / retorno)
 *   2. weather (chuva)
 *   3. day/night (dia / noite)  — noite covers 'noite' and 'madrugada'
 *   4. generico
 *
 * If the Keeper forces a variant, that one wins when present.
 */
export function resolveReadAloud(
  variants: ReadAloudVariants,
  ctx: ReadAloudContext,
  forced?: keyof ReadAloudVariants,
): ResolvedReadAloud {
  if (forced && variants[forced]) {
    return { text: variants[forced] as string, variant: forced };
  }

  const order: Array<keyof ReadAloudVariants> = [];

  // 1. visit
  order.push(ctx.visit);
  // 2. weather
  if (ctx.weather === 'chuva') order.push('chuva');
  // 3. time of day (madrugada falls back to noite)
  order.push(ctx.period === 'noite' || ctx.period === 'madrugada' ? 'noite' : 'dia');
  // 4. generic
  order.push('generico');

  for (const key of order) {
    const value = variants[key];
    if (value && value.trim().length > 0) {
      return { text: value, variant: key };
    }
  }

  return { text: '', variant: null };
}

/** All variant keys in Keeper-facing order, for rendering chips. */
export const READ_ALOUD_VARIANT_ORDER: Array<keyof ReadAloudVariants> = [
  'primeiraVisita',
  'retorno',
  'dia',
  'noite',
  'chuva',
  'generico',
];

export const READ_ALOUD_VARIANT_LABELS: Record<keyof ReadAloudVariants, string> = {
  primeiraVisita: 'Primeira visita',
  retorno: 'Retorno',
  dia: 'Dia',
  noite: 'Noite',
  chuva: 'Chuva',
  generico: 'Genérico',
};
