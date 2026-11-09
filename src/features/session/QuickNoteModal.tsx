import { useEffect, useState } from 'react';
import { useUiStore } from '@/state/uiStore';
import { useSessionContext } from '@/features/shared/useSessionContext';
import { recordEvent } from '@/domain/effects';
import { Button } from '@/components/ui';

/** Quick note (shortcut N) -> an Event of type 'nota' linked to the focused entity. */
export function QuickNoteModal({ onClose }: { onClose: () => void }) {
  const focused = useUiStore((s) => s.focusedEntity);
  const ctx = useSessionContext();
  const [text, setText] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save() {
    if (!text.trim()) {
      onClose();
      return;
    }
    await recordEvent({
      type: 'nota',
      text: text.trim(),
      inGameDate: ctx.inGameDate,
      tableId: ctx.tableId ?? undefined,
      linkedEntityIds: focused ? [focused.id] : [],
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/60 p-20" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 font-serif text-lg">Nota rápida</h3>
        <p className="mb-2 text-xs text-muted">
          {ctx.inGameDate}
          {ctx.tableId ? '' : ' · nenhuma mesa selecionada'}
          {focused ? ` · vinculada a: ${focused.label}` : ''}
        </p>
        <textarea
          autoFocus
          rows={4}
          className="w-full rounded border border-border bg-surface-2 px-2 py-1 text-sm"
          placeholder="Digite a nota… (Ctrl+Enter para salvar)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void save();
          }}
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="accent" onClick={save}>Salvar nota</Button>
        </div>
      </div>
    </div>
  );
}
