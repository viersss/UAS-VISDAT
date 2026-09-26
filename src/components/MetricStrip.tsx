interface MetricStripProps {
  metrics: { label: string; value: string; sub?: string }[];
}

const ACCENTS = ['bg-accent', 'bg-warm', 'bg-accent', 'bg-warm', 'bg-accent'];

export default function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <div data-reveal className="overflow-hidden rounded-[20px] border border-slate-200/80 bg-[#f5efe8] p-1 shadow-[0_10px_25px_rgba(15,23,42,0.03)]">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="relative min-h-[118px] rounded-[16px] bg-white px-3 py-3 text-left sm:px-4 sm:py-4"
          >
            <span className={`absolute inset-x-0 top-0 h-[4px] rounded-t-[16px] ${ACCENTS[i % ACCENTS.length]}`} />
            <span className="mt-2 block text-[0.52rem] font-semibold uppercase tracking-[0.14em] text-ink-muted sm:text-[0.6rem]">
              {m.label}
            </span>
            <span className="mt-4 block text-[1.55rem] font-bold leading-none tracking-[-0.05em] text-ink sm:text-[1.9rem]">
              {m.value}
            </span>
            {m.sub && (
              <span className="mt-1.5 block text-[0.68rem] text-ink-muted sm:text-[0.72rem]">{m.sub}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
