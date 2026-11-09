import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

/** Small shared UI primitives (shadcn-ish, but hand-rolled and offline). */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded border border-border bg-surface-2 px-2 py-1 text-sm ${props.className ?? ''}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded border border-border bg-surface-2 px-2 py-1 text-sm ${props.className ?? ''}`}
    />
  );
}

export function Chip({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'accent' | 'secret' }) {
  const cls =
    tone === 'accent'
      ? 'bg-accent/20 text-accent'
      : tone === 'secret'
        ? 'bg-secret/20 text-secret'
        : 'bg-surface-2 text-muted';
  return <span className={`rounded px-2 py-0.5 text-[11px] ${cls}`}>{children}</span>;
}

export function Button({
  children,
  onClick,
  variant = 'default',
  type = 'button',
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'accent' | 'danger';
  type?: 'button' | 'submit';
  className?: string;
}) {
  const cls =
    variant === 'accent'
      ? 'bg-accent/20 text-accent hover:bg-accent/30'
      : variant === 'danger'
        ? 'bg-secret/20 text-secret hover:bg-secret/30'
        : 'bg-surface-2 text-text hover:bg-surface';
  return (
    <button type={type} onClick={onClick} className={`rounded border border-border px-3 py-1 text-sm ${cls} ${className}`}>
      {children}
    </button>
  );
}

export function ScreenHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <h1 className="font-serif text-2xl">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
