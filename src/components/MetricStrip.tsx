interface MetricStripProps {
  metrics: { label: string; value: string; sub?: string }[];
}

export default function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <div className="bg-ink rounded-2xl px-6 py-5 sm:px-8 sm:py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-5">
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-[#8ba8be]">
              {m.label}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-white mt-1 leading-tight">
              {m.value}
            </span>
            {m.sub && (
              <span className="text-[0.7rem] text-[#6b8294] mt-0.5">{m.sub}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
