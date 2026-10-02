import AnimatedNumber from './AnimatedNumber';

interface MetricStripProps {
  metrics: { label: string; value: string | React.ReactNode; sub?: string }[];
}

export default function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <div data-reveal className="hero-metric-strip">
      {metrics.map(m => (
        <div key={m.label} className="hero-metric-card">
          <span className="hero-metric-label">{m.label}</span>
          <span className="hero-metric-value">
            {typeof m.value === 'string' || typeof m.value === 'number'
              ? <AnimatedNumber value={m.value} />
              : m.value}
          </span>
          {m.sub && <span className="hero-metric-sub">{m.sub}</span>}
        </div>
      ))}
    </div>
  );
}
