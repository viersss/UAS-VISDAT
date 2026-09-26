interface MetricStripProps {
  metrics: { label: string; value: string; sub?: string }[];
}

export default function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <div className="rounded-[24px] border border-amber-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5 shadow-soft sm:px-8 sm:py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-5">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="metric-card flex flex-col rounded-xl border border-white/8 bg-white/5 px-3 py-3 backdrop-blur-sm"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-amber-100/90">
              {m.label}
            </span>
            <span className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {m.value}
            </span>
            {m.sub && (
              <span className="mt-1 text-[0.7rem] text-slate-300/85">{m.sub}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
