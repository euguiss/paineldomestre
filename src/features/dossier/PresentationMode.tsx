import { X } from 'lucide-react';
import { useEffect } from 'react';
import { KeeperMarkdown } from '@/markdown/KeeperMarkdown';

interface Props {
  text: string;
  onClose: () => void;
}

/** Full-screen, large-font read-aloud presentation (section 5.1). */
export function PresentationMode({ text, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-bg/98 p-10">
      <button
        className="absolute right-6 top-6 rounded-full border border-border bg-surface-2 p-2 text-muted hover:text-text"
        onClick={onClose}
        aria-label="Sair do modo apresentação"
      >
        <X size={22} />
      </button>
      <div className="max-w-4xl text-center [&_blockquote]:border-none [&_blockquote]:bg-transparent [&_.read-aloud]:text-3xl [&_.read-aloud]:leading-relaxed">
        {text ? (
          <KeeperMarkdown>{text}</KeeperMarkdown>
        ) : (
          <p className="font-serif text-2xl text-muted">Sem texto de leitura.</p>
        )}
      </div>
    </div>
  );
}
