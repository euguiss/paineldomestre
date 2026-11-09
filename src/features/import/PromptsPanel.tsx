import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cityPrompt, scenarioPrompt } from '@/import/prompts';
import { Button } from '@/components/ui';

/** Mode A: copy-ready conversion prompts with the schema embedded (6.1). */
export function PromptsPanel() {
  return (
    <div className="space-y-6 p-4">
      <p className="text-sm text-muted">
        Cole um destes prompts num chat de IA junto com o texto do seu livro e importe o JSON devolvido
        na aba <strong>Importar</strong>. Nada sai do app neste modo. (Também salvos em{' '}
        <code>docs/prompt-importar-cidade.md</code> e <code>docs/prompt-importar-cenario.md</code>.)
      </p>
      <PromptBlock title="Prompt — Cidade" text={cityPrompt()} />
      <PromptBlock title="Prompt — Cenário" text={scenarioPrompt()} />
    </div>
  );
}

function PromptBlock({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <section>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-serif text-lg">{title}</h3>
        <Button onClick={() => { void navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? <><Check size={14} className="mr-1 inline" /> Copiado</> : <><Copy size={14} className="mr-1 inline" /> Copiar</>}
        </Button>
      </div>
      <pre className="max-h-72 overflow-auto rounded border border-border bg-surface-2 p-3 text-xs">{text}</pre>
    </section>
  );
}
