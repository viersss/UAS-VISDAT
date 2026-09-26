interface MetricStripProps {
  metrics: { label: string; value: string; sub?: string }[];
}

const ACCENTS = ['bg-accent', 'bg-warm', 'bg-accent', 'bg-warm', 'bg-accent'];

export default function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line-soft sm:grid-cols-5">
      {metrics.map((m, i) => (
        <div key={i} className="relative bg-white px-5 py-6 text-left sm:px-6">
          <span className={`absolute left-0 top-0 h-[3px] w-8 rounded-full ${ACCENTS[i % ACCENTS.length]}`} />
          <span className="block text-[0.68rem] font-medium uppercase tracking-[0.1em] text-ink-muted">
            {m.label}
          </span>
          <span className="mt-2 block text-2xl font-bold tracking-tight text-ink sm:text-[1.7rem]">
            {m.value}
          </span>
          {m.sub && (
            <span className="mt-1 block text-xs text-ink-muted">{m.sub}</span>
          )}
        </div>
      ))}
    </div>
  );
}
