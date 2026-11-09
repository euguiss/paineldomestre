interface Props {
  segments: number;
  filled: number;
  onChange?: (filled: number) => void;
  size?: number;
}

/**
 * A segmented clock drawn as pie slices (section 6.5). Clicking a slice sets
 * the filled count; clicking the filled edge again clears the last one.
 */
export function ClockDisplay({ segments, filled, onChange, size = 72 }: Props) {
  const r = size / 2;
  const cx = r;
  const cy = r;

  function slicePath(i: number): string {
    const start = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const end = ((i + 1) / segments) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Relógio ${filled} de ${segments}`}>
      {Array.from({ length: segments }, (_, i) => (
        <path
          key={i}
          d={slicePath(i)}
          className={i < filled ? 'fill-accent' : 'fill-surface-2'}
          stroke="rgb(var(--bg))"
          strokeWidth={2}
          style={{ cursor: onChange ? 'pointer' : 'default' }}
          onClick={() => onChange?.(i + 1 === filled ? i : i + 1)}
        />
      ))}
      <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="rgb(var(--border))" strokeWidth={2} />
    </svg>
  );
}
