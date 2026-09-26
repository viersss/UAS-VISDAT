import type { ReactNode } from 'react';

interface ChapterSectionProps {
  chapter: string;
  title: string;
  subtitle?: string;
  narration: ReactNode;
  context: ReactNode;
  children: ReactNode;
}

export default function ChapterSection({
  chapter,
  title,
  subtitle,
  narration,
  context,
  children,
}: ChapterSectionProps) {
  return (
    <section className="max-w-6xl mx-auto px-6 sm:px-8 py-16 sm:py-24">
      <div className="mb-10 rounded-[26px] border border-slate-200/80 bg-white/70 p-6 sm:p-8 shadow-card backdrop-blur-sm">
        <div className="text-xs font-semibold tracking-[0.18em] uppercase text-accent mb-3">
          {chapter}
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-ink leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="font-serif italic text-lg text-ink-soft mt-3 leading-relaxed max-w-3xl">
            {subtitle}
          </p>
        )}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-5xl">
          <div className="lg:col-span-3">
            <p className="font-serif text-base text-ink-soft leading-[1.8] narrative-lead">
              {narration}
            </p>
          </div>
          <div className="lg:col-span-2 border-l-[3px] border-warm pl-5">
            <p className="text-sm text-ink-muted leading-[1.75]">
              {context}
            </p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}
