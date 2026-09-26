import type { ReactNode } from 'react';

interface HeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle: ReactNode;
  children?: ReactNode;
}

export default function Hero({ eyebrow, title, subtitle, children }: HeroProps) {
  return (
    <section id="hero" className="pt-20 pb-12 sm:pt-32 sm:pb-20 px-6 sm:px-8 max-w-6xl mx-auto text-center">
      <div className="rise-in rounded-[32px] border border-slate-200/80 bg-white/70 backdrop-blur-sm shadow-soft px-6 py-8 sm:px-10 sm:py-12">
        <div className="text-xs font-semibold tracking-[0.22em] uppercase text-accent mb-4">
          {eyebrow}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em] text-ink leading-[1.08]">
          {title}
        </h1>
        <div className="w-16 h-[3px] bg-gradient-to-r from-warm via-warm to-accent mx-auto my-7 rounded-full" />
        <p className="font-serif text-lg sm:text-xl text-ink-soft leading-[1.8] max-w-3xl mx-auto">
          {subtitle}
        </p>
        {children}
      </div>
    </section>
  );
}
