interface InsightPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function InsightPanel({ title, children, className = '' }: InsightPanelProps) {
  return (
    <div className={`my-6 w-full rounded-[26px] border border-accent/15 bg-gradient-to-br from-[#edf7f2] via-white to-[#fdf3ea] px-5 py-5 shadow-[0_16px_30px_rgba(15,23,42,0.04)] sm:px-6 ${className}`}>
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-accent">{title}</p>
      <div className="text-[15px] leading-[1.9] text-ink-soft">{children}</div>
    </div>
  );
}
