import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { remarkKeeperDirectives, type KeeperDirectiveKind } from './remarkKeeperDirectives';
import { Lock, Dices, Brain } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  children: string;
  /**
   * When true, :::segredo:::, :::teste::: and :::sanidade::: blocks are dropped
   * entirely. The Player View always passes `hideSecrets`.
   */
  hideSecrets?: boolean;
  className?: string;
}

const DIRECTIVE_META: Record<
  KeeperDirectiveKind,
  { label: string; icon: ReactNode; cls: string }
> = {
  segredo: { label: 'Segredo do Mestre', icon: <Lock size={14} />, cls: 'border-secret/60 bg-secret/10 text-secret' },
  teste: { label: 'Teste', icon: <Dices size={14} />, cls: 'border-test/60 bg-test/10 text-test' },
  sanidade: { label: 'Sanidade', icon: <Brain size={14} />, cls: 'border-sanity/60 bg-sanity/10 text-sanity' },
};

/** Render Keeper markdown with read-aloud blockquotes and directive blocks. */
export function KeeperMarkdown({ children, hideSecrets, className }: Props) {
  const components: Components = {
    // Read-aloud: a blockquote becomes a serif highlight box.
    blockquote: ({ children }) => (
      <blockquote className="read-aloud my-2 rounded-r border-l-4 border-accent bg-surface-2/60 px-3 py-2">
        {children}
      </blockquote>
    ),
    // Custom directive div emitted by the remark plugin.
    div: (props) => {
      const kind = (props as { 'data-keeper-directive'?: KeeperDirectiveKind })[
        'data-keeper-directive'
      ];
      if (!kind) return <div {...props} />;
      if (hideSecrets) return null;
      const meta = DIRECTIVE_META[kind];
      return (
        <div className={`my-2 rounded border px-3 py-2 text-sm ${meta.cls}`}>
          <div className="mb-1 flex items-center gap-1 font-medium uppercase tracking-wide">
            {meta.icon} {meta.label}
          </div>
          <div className="text-text">{props.children}</div>
        </div>
      );
    },
  };

  return (
    <div className={className}>
      <Markdown remarkPlugins={[remarkGfm, remarkKeeperDirectives]} components={components}>
        {children}
      </Markdown>
    </div>
  );
}
