import type { ReactNode } from 'react';

interface HeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle: ReactNode;
  children?: ReactNode;
}

export default function Hero({ eyebrow, title, subtitle, children }: HeroProps) {
  return (
    <section id="hero" data-reveal data-parallax className="pt-20 pb-12 sm:pt-32 sm:pb-20 px-6 sm:px-8 max-w-[1360px] mx-auto text-center">
      <div className="rise-in reveal-up relative z-10 py-10 sm:py-16">
          {eyebrow && (
            <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-accent mb-4">
              {eyebrow}
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em] text-ink leading-[1.06]">
            {title}
          </h1>
          <div className="w-20 h-[3px] bg-gradient-to-r from-warm via-warm to-accent mx-auto my-7 rounded-full" />
          <p className="font-serif text-lg sm:text-xl text-ink-soft leading-[1.8] max-w-3xl mx-auto">
            {subtitle}
          </p>
          {children}
        </div>
    </section>
  );
}
