import type { ActivationCondition } from '@/db/schema';

/** Lookup maps so the describer can print names instead of raw ids. */
export interface NameLookup {
  plotName: (id: string) => string;
  clueText: (id: string) => string;
  npcName: (id: string) => string;
  locationName: (id: string) => string;
}

const PLOT_STATE_PT: Record<string, string> = {
  dormente: 'dormente',
  ativa: 'ativa',
  escalando: 'escalando',
  resolvida: 'resolvida',
  fracassada: 'fracassada',
};

const CLUE_STATUS_PT: Record<string, string> = {
  'nao-descoberta': 'não descoberta',
  descoberta: 'descoberta',
  perdida: 'perdida',
};

const NPC_STATUS_PT: Record<string, string> = {
  vivo: 'vivo',
  morto: 'morto',
  desaparecido: 'desaparecido',
  enlouquecido: 'enlouquecido',
  convertido: 'convertido',
  outro: 'outro',
};

/**
 * Render a declarative activation condition as readable pt-BR, so the Keeper
 * sees exactly what turns a layer on/off (section 5.2). Pure & testable.
 */
export function describeCondition(cond: ActivationCondition, names: NameLookup): string {
  switch (cond.kind) {
    case 'always':
      return 'sempre ativa';

    case 'all':
      if (cond.conditions.length === 0) return 'sempre ativa';
      return cond.conditions.map((c) => wrap(c, names)).join(' E ');

    case 'any':
      if (cond.conditions.length === 0) return 'nunca ativa';
      return cond.conditions.map((c) => wrap(c, names)).join(' OU ');

    case 'plotState':
      return `trama "${names.plotName(cond.plotId)}" ${
        cond.op === 'is' ? 'é' : 'não é'
      } ${PLOT_STATE_PT[cond.value] ?? cond.value}`;

    case 'plotClockFilled':
      return `relógio da trama "${names.plotName(cond.plotId)}" ≥ ${cond.value}`;

    case 'clueStatus':
      return `pista "${names.clueText(cond.clueId)}" é ${CLUE_STATUS_PT[cond.value] ?? cond.value}`;

    case 'npcStatus':
      return `NPC "${names.npcName(cond.npcId)}" é ${NPC_STATUS_PT[cond.value] ?? cond.value}`;

    case 'locationDiscovered':
      return `local "${names.locationName(cond.locationId)}" ${
        cond.value ? 'descoberto' : 'não descoberto'
      }`;

    default: {
      const _never: never = cond;
      return String(_never);
    }
  }
}

/** Parenthesise nested groups for clarity. */
function wrap(cond: ActivationCondition, names: NameLookup): string {
  const text = describeCondition(cond, names);
  return cond.kind === 'all' || cond.kind === 'any' ? `(${text})` : text;
}
