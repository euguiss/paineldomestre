import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { SessionZeroEntity } from '@/db/schema';
import { KeeperMarkdown } from '@/markdown/KeeperMarkdown';

/**
 * Full-screen, large-font reading mode for the Keeper to read the guide and
 * roteiro (section 13). Local only — NO synchronisation with other windows.
 */
export function ReadingMode({ sz, onClose }: { sz: SessionZeroEntity; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[2000] overflow-y-auto bg-bg p-10">
      <button className="fixed right-6 top-6 rounded-full border border-border bg-surface-2 p-2 text-muted hover:text-text" onClick={onClose} aria-label="Sair do modo leitura">
        <X size={22} />
      </button>
      <div className="mx-auto max-w-3xl space-y-8 font-serif text-xl leading-relaxed">
        <section>
          <h1 className="mb-3 text-3xl text-accent">Roteiro</h1>
          <ol className="list-decimal space-y-2 pl-6">
            {sz.agenda.map((a, i) => (
              <li key={i} className={a.done ? 'text-muted line-through' : ''}>
                {a.title} <span className="text-base text-muted">(~{a.estimatedMinutes} min)</span>
                {a.notes && <p className="text-base text-muted">{a.notes}</p>}
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h1 className="mb-3 text-3xl text-accent">Guia de ambientação</h1>
          {sz.loreCards.map((c, i) => (
            <div key={i} className="mb-6">
              <h2 className="text-2xl">{c.title} <span className="text-base text-muted">({c.scope})</span></h2>
              <KeeperMarkdown>{`${c.readAloud}\n\n${c.masterNotes}`}</KeeperMarkdown>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
