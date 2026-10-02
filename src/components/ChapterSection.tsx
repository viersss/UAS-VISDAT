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
    <section data-reveal data-parallax className="max-w-[1360px] mx-auto px-6 sm:px-8 py-14 sm:py-20">
      <div className="mb-10 sm:mb-14">
        <h2 className="max-w-full text-3xl font-bold tracking-[-0.03em] text-ink leading-tight sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="font-serif italic text-lg text-ink-soft mt-3 leading-relaxed max-w-[62ch]">
            {subtitle}
          </p>
        )}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-x-10 gap-y-6">
          <div className="lg:col-span-3">
            <p className="font-serif text-base text-ink-soft leading-[1.8] narrative-lead max-w-[62ch]">
              {narration}
            </p>
          </div>
          <div className="lg:col-span-2 border-l-[3px] border-warm/80 pl-5">
            <p className="text-sm text-ink-muted leading-[1.75] max-w-[48ch]">
              {context}
            </p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}
