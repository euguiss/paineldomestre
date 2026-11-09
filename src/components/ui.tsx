import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

/** Shared UI primitives — a small, consistent design system (hand-rolled, offline). */

const FIELD_BASE =
  'w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-sm transition-colors ' +
  'placeholder:text-muted hover:border-border-strong focus:border-accent focus:outline-none ' +
  'focus:ring-1 focus:ring-accent/40';

export function Field({ label, hint, children }: { label: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {hint && <span className="text-[11px] text-muted/80">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${FIELD_BASE} ${props.className ?? ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${FIELD_BASE} ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${FIELD_BASE} ${props.className ?? ''}`} />;
}

export function Chip({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'accent' | 'secret' | 'ok' }) {
  const cls =
    tone === 'accent'
      ? 'bg-accent/15 text-accent ring-1 ring-inset ring-accent/25'
      : tone === 'secret'
        ? 'bg-secret/15 text-secret ring-1 ring-inset ring-secret/25'
        : tone === 'ok'
          ? 'bg-ok/15 text-ok ring-1 ring-inset ring-ok/25'
          : 'bg-surface-3 text-muted ring-1 ring-inset ring-border';
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

export function Button({
  children,
  onClick,
  variant = 'default',
  type = 'button',
  className = '',
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'accent' | 'danger' | 'ghost';
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const cls =
    variant === 'accent'
      ? 'bg-accent text-black/90 hover:bg-accent/90 border-transparent shadow-sm'
      : variant === 'danger'
        ? 'bg-transparent text-secret border-secret/40 hover:bg-secret/10'
        : variant === 'ghost'
          ? 'bg-transparent text-muted border-transparent hover:bg-surface-2 hover:text-text'
          : 'bg-surface-2 text-text border-border hover:bg-surface-3 hover:border-border-strong';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${cls} ${className}`}
    >
      {children}
    </button>
  );
}

/** Icon-only button for toolbars and row actions. */
export function IconButton({
  children,
  onClick,
  label,
  tone = 'default',
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  tone?: 'default' | 'danger';
  className?: string;
}) {
  const cls = tone === 'danger' ? 'text-muted hover:text-secret hover:bg-secret/10' : 'text-muted hover:text-text hover:bg-surface-2';
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={`rounded-md p-1.5 transition-colors ${cls} ${className}`}>
      {children}
    </button>
  );
}

export function ScreenHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/60 px-5 py-3 backdrop-blur">
      <div>
        <h1 className="font-serif text-2xl leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

/** A titled card/section container used throughout detail panels. */
export function Card({ title, actions, children, className = '' }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-surface p-3 ${className}`}>
      {(title || actions) && (
        <div className="mb-2 flex items-center justify-between">
          {title && <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
