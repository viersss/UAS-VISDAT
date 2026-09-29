import AnimatedNumber from './AnimatedNumber';

interface MetricStripProps {
  metrics: { label: string; value: string | React.ReactNode; sub?: string }[];
}

const ACCENTS = [
  'linear-gradient(90deg, rgba(249, 179, 125, 0.9), rgba(249, 179, 125, 0.3))',
  'linear-gradient(90deg, rgba(40, 148, 164, 0.9), rgba(40, 148, 164, 0.3))',
  'linear-gradient(90deg, rgba(249, 179, 125, 0.9), rgba(249, 179, 125, 0.3))',
  'linear-gradient(90deg, rgba(40, 148, 164, 0.9), rgba(40, 148, 164, 0.3))',
  'linear-gradient(90deg, rgba(249, 179, 125, 0.9), rgba(249, 179, 125, 0.3))',
];

export default function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <div data-reveal className="hero-metric-strip">
      {metrics.map((m, i) => (
        <div key={i} className="hero-metric-card">
          <span
            className="hero-metric-accent"
            style={{ background: ACCENTS[i % ACCENTS.length] }}
          />
          <span className="hero-metric-label">{m.label}</span>
          <span className="hero-metric-value">
            {typeof m.value === 'string' || typeof m.value === 'number'
              ? <AnimatedNumber value={m.value} />
              : m.value}
          </span>
          {m.sub && (
            <span className="hero-metric-sub">{m.sub}</span>
          )}
        </div>
      ))}
    </div>
  );
}
