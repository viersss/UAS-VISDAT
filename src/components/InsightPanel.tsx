interface InsightPanelProps {
  title: string;
  children: React.ReactNode;
}

export default function InsightPanel({ title, children }: InsightPanelProps) {
  return (
    <div className="my-6 rounded-[20px] border border-accent/15 bg-gradient-to-br from-accent-soft via-white to-warm-soft/70 px-5 py-4 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-accent mb-2">{title}</p>
      <div className="text-sm text-ink-soft leading-[1.75]">{children}</div>
    </div>
  );
}
