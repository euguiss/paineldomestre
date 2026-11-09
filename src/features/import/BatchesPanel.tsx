import { Undo2 } from 'lucide-react';
import { useLiveData } from '@/db/useLiveData';
import { db } from '@/db/database';
import { Button, Chip } from '@/components/ui';
import { undoBatch } from '@/import/applyBatch';

/** Lotes de importação com "Desfazer lote" (section 6.1). */
export function BatchesPanel() {
  const batches = useLiveData(() => db.importBatches.orderBy('createdAt').reverse().toArray(), []) ?? [];

  return (
    <div className="space-y-2 p-4">
      <p className="text-sm text-muted">Cada importação vira um lote com os ids criados e um snapshot do que mudou. Você pode desfazer um lote inteiro.</p>
      {batches.length === 0 ? (
        <p className="text-sm italic text-muted">Nenhum lote importado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {batches.map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded border border-border bg-surface p-2 text-sm">
              <div>
                <span className="font-medium">{b.label}</span>
                <div className="mt-0.5 flex items-center gap-1 text-xs">
                  <Chip>{b.mode}</Chip>
                  <Chip>{b.createdIds.length} criados</Chip>
                  <Chip>{b.snapshotOfUpdated.length} atualizados</Chip>
                  <span className="text-muted">{new Date(b.createdAt).toLocaleString('pt-BR')}</span>
                  {b.status === 'undone' && <Chip tone="secret">desfeito</Chip>}
                </div>
              </div>
              {b.status === 'applied' && (
                <Button variant="danger" onClick={() => { if (confirm(`Desfazer o lote "${b.label}"?`)) void undoBatch(b.id); }}>
                  <Undo2 size={14} className="mr-1 inline" /> Desfazer lote
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
