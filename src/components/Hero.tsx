import type { ReactNode } from 'react';

interface HeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle: ReactNode;
  children?: ReactNode;
}

export default function Hero({ eyebrow, title, subtitle, children }: HeroProps) {
  return (
    <section id="hero" data-reveal className="pt-20 pb-12 sm:pt-32 sm:pb-20 px-6 sm:px-8 max-w-[1360px] mx-auto text-center">
      <div className="rise-in reveal-up relative overflow-hidden rounded-[34px] border border-slate-200/80 bg-gradient-to-br from-white via-[#fffdfb] to-[#f6efe6] shadow-soft px-6 py-10 sm:px-14 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(29,109,123,0.13),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(224,130,74,0.16),transparent_30%)]" />
        <div className="relative z-10">
          <div className="text-xs font-semibold tracking-[0.22em] uppercase text-accent mb-4">
            {eyebrow}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em] text-ink leading-[1.08]">
            {title}
          </h1>
          <div className="w-20 h-[3px] bg-gradient-to-r from-warm via-warm to-accent mx-auto my-7 rounded-full" />
          <p className="font-serif text-lg sm:text-xl text-ink-soft leading-[1.8] max-w-3xl mx-auto">
            {subtitle}
          </p>
          {children}
        </div>
      </div>
    </section>
  );
}
