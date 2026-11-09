import { describe, it, expect } from 'vitest';
import { computeCoverage, type CoverageInput } from './coverage';
import type { InvestigatorEntity, PlotEntity } from '@/db/schema';

function b() {
  return { createdAt: 't', updatedAt: 't', tags: [], notes: '' };
}

function inv(over: Partial<InvestigatorEntity>): InvestigatorEntity {
  return {
    ...b(),
    id: 'i',
    name: 'Inv',
    playerName: '',
    tableId: 'tbl',
    concept: '',
    occupation: '',
    age: 30,
    characteristics: { FOR: 50, CON: 50, TAM: 50, DES: 50, APA: 50, INT: 50, POD: 50, EDU: 50 },
    derived: { PV: 10, PM: 10, SAN: 50, Sorte: 50, Movimento: 8, Corpo: '0', BonusDeDano: 'Nenhum' },
    skills: [],
    backstory: '',
    equipment: '',
    hook: '',
    links: [],
    status: 'ativo',
    masterNotes: '',
    ...over,
  };
}

function plot(id: string, name: string): PlotEntity {
  return { ...b(), id, name, sourceModule: '', threatLevel: 1, hiddenTruth: '', antagonists: '', state: 'ativa', clock: { segments: 6, filled: 0, advanceRules: [] }, scheduledBeats: [], conclusions: [] };
}

describe('computeCoverage (Sessão 0)', () => {
  const plots = [plot('pA', 'Trama A'), plot('pB', 'Trama B')];
  const entityPlots = new Map<string, string[]>([
    ['npc1', ['pA']], // npc1 participates in plot A
  ]);

  it('maps investigators to plots directly and via linked entities', () => {
    const invDirect = inv({ id: 'i1', name: 'Direto', links: [{ targetType: 'plot', targetId: 'pB', note: '' }] });
    const invIndirect = inv({ id: 'i2', name: 'Indireto', links: [{ targetType: 'npc', targetId: 'npc1', note: '' }] });

    const input: CoverageInput = { tableId: 'tbl', investigators: [invDirect, invIndirect], plots, entityPlots };
    const r = computeCoverage(input);

    expect(r.investigatorPlots['i1']).toEqual(['pB']);
    expect(r.investigatorPlots['i2']).toEqual(['pA']);
    expect(r.plotsWithoutInvestigator).toHaveLength(0);
  });

  it('flags an investigator with no link', () => {
    const invNone = inv({ id: 'i3', name: 'Sem vínculo', links: [] });
    const input: CoverageInput = { tableId: 'tbl', investigators: [invNone], plots, entityPlots };
    const r = computeCoverage(input);
    expect(r.investigatorsWithoutLink).toEqual([{ id: 'i3', name: 'Sem vínculo' }]);
  });

  it('flags a plot with no investigator', () => {
    const invOnlyA = inv({ id: 'i4', links: [{ targetType: 'plot', targetId: 'pA', note: '' }] });
    const input: CoverageInput = { tableId: 'tbl', investigators: [invOnlyA], plots, entityPlots };
    const r = computeCoverage(input);
    expect(r.plotsWithoutInvestigator.map((p) => p.id)).toEqual(['pB']);
  });

  it('ignores investigators from other tables', () => {
    const other = inv({ id: 'i5', tableId: 'OTHER', links: [{ targetType: 'plot', targetId: 'pA', note: '' }] });
    const input: CoverageInput = { tableId: 'tbl', investigators: [other], plots, entityPlots };
    const r = computeCoverage(input);
    expect(Object.keys(r.investigatorPlots)).toHaveLength(0);
    expect(r.plotsWithoutInvestigator).toHaveLength(2);
  });
});
