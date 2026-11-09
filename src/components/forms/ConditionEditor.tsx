import { Plus, Trash2 } from 'lucide-react';
import type {
  ActivationCondition,
  ActivationLeaf,
  ClueEntity,
  LocationEntity,
  NpcEntity,
  PlotEntity,
  PlotState,
  ClueStatus,
  NpcStatus,
} from '@/db/schema';

/** Entity options used to populate the selects (names, not ids). */
export interface ConditionOptions {
  plots: PlotEntity[];
  clues: ClueEntity[];
  npcs: NpcEntity[];
  locations: LocationEntity[];
}

interface Props {
  value: ActivationCondition;
  onChange: (next: ActivationCondition) => void;
  options: ConditionOptions;
  /** internal: nesting depth for indentation */
  depth?: number;
}

const PLOT_STATES: PlotState[] = ['dormente', 'ativa', 'escalando', 'resolvida', 'fracassada'];
const CLUE_STATUSES: ClueStatus[] = ['nao-descoberta', 'descoberta', 'perdida'];
const NPC_STATUSES: NpcStatus[] = ['vivo', 'morto', 'desaparecido', 'enlouquecido', 'convertido', 'outro'];

type LeafKind = ActivationLeaf['kind'];

/**
 * Recursive, form-based editor for activation conditions (section 5.2).
 * The Keeper never types code — only picks from selects and adds E/OU groups.
 */
export function ConditionEditor({ value, onChange, options, depth = 0 }: Props) {
  // Group node (all / any)
  if (value.kind === 'all' || value.kind === 'any') {
    const joiner = value.kind === 'all' ? 'E (todas)' : 'OU (qualquer)';
    return (
      <div
        className="rounded border border-border bg-surface-2/40 p-2"
        style={{ marginLeft: depth > 0 ? 8 : 0 }}
      >
        <div className="mb-2 flex items-center gap-2">
          <select
            className="rounded border border-border bg-surface-2 px-2 py-1 text-sm"
            value={value.kind}
            onChange={(e) => onChange({ ...value, kind: e.target.value as 'all' | 'any' })}
            aria-label="Operador do grupo"
          >
            <option value="all">E (todas)</option>
            <option value="any">OU (qualquer)</option>
          </select>
          <span className="text-xs text-muted">{joiner}</span>
        </div>

        <div className="space-y-2">
          {value.conditions.map((c, i) => (
            <div key={i} className="flex items-start gap-1">
              <div className="flex-1">
                <ConditionEditor
                  value={c}
                  options={options}
                  depth={depth + 1}
                  onChange={(next) => {
                    const arr = [...value.conditions];
                    arr[i] = next;
                    onChange({ ...value, conditions: arr });
                  }}
                />
              </div>
              <button
                className="mt-1 rounded p-1 text-muted hover:text-secret"
                onClick={() => onChange({ ...value, conditions: value.conditions.filter((_, j) => j !== i) })}
                aria-label="Remover condição"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-2 flex gap-2">
          <button
            className="flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-xs hover:bg-surface"
            onClick={() =>
              onChange({ ...value, conditions: [...value.conditions, defaultLeaf(options)] })
            }
          >
            <Plus size={12} /> condição
          </button>
          <button
            className="flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-xs hover:bg-surface"
            onClick={() =>
              onChange({ ...value, conditions: [...value.conditions, { kind: 'all', conditions: [] }] })
            }
          >
            <Plus size={12} /> grupo
          </button>
        </div>
      </div>
    );
  }

  // 'always'
  if (value.kind === 'always') {
    return (
      <div className="flex items-center gap-2" style={{ marginLeft: depth > 0 ? 8 : 0 }}>
        <LeafKindSelect
          current="always"
          onPick={(kind) => onChange(kind === 'always' ? { kind: 'always' } : defaultLeafOf(kind, options))}
        />
        <span className="text-sm text-muted">sempre ativa</span>
      </div>
    );
  }

  // Leaf node
  return (
    <div className="flex flex-wrap items-center gap-2" style={{ marginLeft: depth > 0 ? 8 : 0 }}>
      <LeafKindSelect
        current={value.kind}
        onPick={(kind) => onChange(kind === 'always' ? { kind: 'always' } : defaultLeafOf(kind, options))}
      />
      <LeafFields value={value} onChange={onChange} options={options} />
    </div>
  );
}

function LeafKindSelect({
  current,
  onPick,
}: {
  current: LeafKind | 'always';
  onPick: (kind: LeafKind | 'always') => void;
}) {
  return (
    <select
      className="rounded border border-border bg-surface-2 px-2 py-1 text-sm"
      value={current}
      onChange={(e) => onPick(e.target.value as LeafKind | 'always')}
      aria-label="Tipo de condição"
    >
      <option value="always">Sempre</option>
      <option value="plotState">Estado da trama</option>
      <option value="plotClockFilled">Relógio da trama ≥</option>
      <option value="clueStatus">Status da pista</option>
      <option value="npcStatus">Status do NPC</option>
      <option value="locationDiscovered">Local descoberto</option>
    </select>
  );
}

function LeafFields({
  value,
  onChange,
  options,
}: {
  value: ActivationLeaf;
  onChange: (next: ActivationCondition) => void;
  options: ConditionOptions;
}) {
  const sel = 'rounded border border-border bg-surface-2 px-2 py-1 text-sm';

  switch (value.kind) {
    case 'plotState':
      return (
        <>
          <select className={sel} value={value.plotId} onChange={(e) => onChange({ ...value, plotId: e.target.value })}>
            {options.plots.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select className={sel} value={value.op} onChange={(e) => onChange({ ...value, op: e.target.value as 'is' | 'isNot' })}>
            <option value="is">é</option>
            <option value="isNot">não é</option>
          </select>
          <select className={sel} value={value.value} onChange={(e) => onChange({ ...value, value: e.target.value as PlotState })}>
            {PLOT_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </>
      );
    case 'plotClockFilled':
      return (
        <>
          <select className={sel} value={value.plotId} onChange={(e) => onChange({ ...value, plotId: e.target.value })}>
            {options.plots.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
          <span className="text-sm text-muted">≥</span>
          <input
            type="number"
            min={0}
            className={`${sel} w-16`}
            value={value.value}
            onChange={(e) => onChange({ ...value, value: Number(e.target.value) })}
          />
        </>
      );
    case 'clueStatus':
      return (
        <>
          <select className={`${sel} max-w-[200px]`} value={value.clueId} onChange={(e) => onChange({ ...value, clueId: e.target.value })}>
            {options.clues.map((c) => (<option key={c.id} value={c.id}>{c.text.slice(0, 40)}</option>))}
          </select>
          <span className="text-sm text-muted">é</span>
          <select className={sel} value={value.value} onChange={(e) => onChange({ ...value, value: e.target.value as ClueStatus })}>
            {CLUE_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </>
      );
    case 'npcStatus':
      return (
        <>
          <select className={sel} value={value.npcId} onChange={(e) => onChange({ ...value, npcId: e.target.value })}>
            {options.npcs.map((n) => (<option key={n.id} value={n.id}>{n.name}</option>))}
          </select>
          <span className="text-sm text-muted">é</span>
          <select className={sel} value={value.value} onChange={(e) => onChange({ ...value, value: e.target.value as NpcStatus })}>
            {NPC_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </>
      );
    case 'locationDiscovered':
      return (
        <>
          <select className={sel} value={value.locationId} onChange={(e) => onChange({ ...value, locationId: e.target.value })}>
            {options.locations.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
          </select>
          <select className={sel} value={String(value.value)} onChange={(e) => onChange({ ...value, value: e.target.value === 'true' })}>
            <option value="true">descoberto</option>
            <option value="false">não descoberto</option>
          </select>
        </>
      );
    default:
      return null;
  }
}

/** A sensible default leaf for a freshly-added condition. */
function defaultLeaf(options: ConditionOptions): ActivationCondition {
  return defaultLeafOf('plotState', options);
}

function defaultLeafOf(kind: LeafKind, options: ConditionOptions): ActivationCondition {
  const firstPlot = options.plots[0]?.id ?? '';
  const firstClue = options.clues[0]?.id ?? '';
  const firstNpc = options.npcs[0]?.id ?? '';
  const firstLoc = options.locations[0]?.id ?? '';
  switch (kind) {
    case 'plotState':
      return { kind, plotId: firstPlot, op: 'is', value: 'ativa' };
    case 'plotClockFilled':
      return { kind, plotId: firstPlot, op: 'gte', value: 1 };
    case 'clueStatus':
      return { kind, clueId: firstClue, op: 'is', value: 'descoberta' };
    case 'npcStatus':
      return { kind, npcId: firstNpc, op: 'is', value: 'morto' };
    case 'locationDiscovered':
      return { kind, locationId: firstLoc, value: true };
  }
}
