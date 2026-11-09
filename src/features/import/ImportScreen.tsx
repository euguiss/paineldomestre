import { useState } from 'react';
import { ScreenHeader } from '@/components/ui';
import { ImportWizard } from './ImportWizard';
import { PromptsPanel } from './PromptsPanel';
import { PendingPanel } from './PendingPanel';
import { BatchesPanel } from './BatchesPanel';

type Tab = 'importar' | 'prompts' | 'pendencias' | 'lotes';
const TABS: { id: Tab; label: string }[] = [
  { id: 'importar', label: 'Importar' },
  { id: 'prompts', label: 'Prompts de conversão' },
  { id: 'pendencias', label: 'Pendências' },
  { id: 'lotes', label: 'Lotes' },
];

/** Importador Cidade/Cenário (section 6.1). */
export function ImportScreen() {
  const [tab, setTab] = useState<Tab>('importar');

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Importador (Cidade e Cenário)" />
      <div className="flex items-start gap-2 border-b border-border px-4 py-2 text-xs text-muted">
        <span>
          Para <strong>uso pessoal</strong>: carregue o conteúdo dos seus próprios livros. O app não lê PDF —
          extraia o texto antes e divida por capítulo/distrito. Mapas e handouts em imagem entram à parte.
        </span>
      </div>
      <div className="flex gap-1 border-b border-border px-2 py-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`rounded px-3 py-1 text-sm ${tab === t.id ? 'bg-accent/20 text-accent' : 'text-muted hover:text-text'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'importar' && <ImportWizard />}
        {tab === 'prompts' && <PromptsPanel />}
        {tab === 'pendencias' && <PendingPanel />}
        {tab === 'lotes' && <BatchesPanel />}
      </div>
    </div>
  );
}
