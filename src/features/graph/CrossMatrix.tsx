import { buildCrossMatrix, type GraphInput } from '@/domain/graph';
import { Check } from 'lucide-react';

const TYPE_LABEL: Record<'npc' | 'location' | 'faction', string> = {
  npc: 'NPC',
  location: 'Local',
  faction: 'Facção',
};

/** Matriz de cruzamentos: rows = NPCs/locais/facções, columns = tramas (6.8). */
export function CrossMatrix({ input }: { input: GraphInput }) {
  const matrix = buildCrossMatrix(input);

  if (matrix.rows.length === 0) {
    return <div className="flex h-full items-center justify-center text-muted">Nenhum cruzamento entre entidades e tramas ainda.</div>;
  }

  return (
    <div className="h-full overflow-auto p-4">
      <table className="border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface px-3 py-2 text-left">Entidade</th>
            {matrix.plots.map((p) => (
              <th key={p.id} className="px-2 py-2 text-xs font-medium text-muted">
                <div className="mx-auto max-w-[90px] whitespace-normal">{p.name}</div>
              </th>
            ))}
            <th className="px-3 py-2 text-xs text-muted">#</th>
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => (
            <tr key={row.id} className={`border-t border-border ${row.plotCount >= 2 ? 'bg-accent/5' : ''}`}>
              <td className="sticky left-0 z-10 bg-surface px-3 py-2">
                <span className="text-[10px] uppercase text-muted">{TYPE_LABEL[row.type]}</span>
                <div className={row.plotCount >= 2 ? 'font-medium text-accent' : ''}>
                  {row.label}
                  {row.plotCount >= 2 && ' ✦'}
                </div>
              </td>
              {matrix.plots.map((p) => (
                <td key={p.id} className="px-2 py-2 text-center">
                  {row.cells[p.id] ? <Check size={14} className="mx-auto text-accent" /> : <span className="text-border">·</span>}
                </td>
              ))}
              <td className="px-3 py-2 text-center text-muted">{row.plotCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">✦ = nó de cruzamento (participa de 2+ tramas).</p>
    </div>
  );
}
