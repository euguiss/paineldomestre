interface Props {
  title: string;
  phase: string;
  standalone?: boolean;
}

/** Placeholder for screens implemented in later phases. */
export function PlaceholderScreen({ title, phase, standalone }: Props) {
  const content = (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="font-serif text-3xl text-text">{title}</h1>
      <p className="text-muted">
        Esta tela será implementada na <span className="text-accent">{phase}</span>.
      </p>
    </div>
  );
  if (standalone) {
    return <div className="h-screen w-screen bg-bg text-text">{content}</div>;
  }
  return content;
}
