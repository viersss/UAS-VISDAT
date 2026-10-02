import type { ReactNode } from 'react';

interface HeroProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle: ReactNode;
  children?: ReactNode;
}

export default function Hero({ eyebrow, title, subtitle, children }: HeroProps) {
  return (
    <section
      id="hero"
      className="hero-section relative w-full"
      style={{ minHeight: '100svh' }}
    >
      <div className="hero-photo-wrap absolute inset-0" aria-hidden="true">
        <img
          src="/hero.jpg"
          alt=""
          className="hero-photo"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-photo-overlay absolute inset-0" />
      </div>

      <div className="hero-content relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1360px] flex-col items-center justify-center px-5 pt-32 pb-16 sm:px-8 lg:px-12 xl:px-16">
        <div className="hero-center-block">
          {eyebrow && <div className="hero-eyebrow">{eyebrow}</div>}
          <div className="hero-rule" />
          <h1 className="hero-headline font-display tracking-normal leading-tight">{title}</h1>
          <p className="hero-subhead font-rubik leading-relaxed">{subtitle}</p>

          {children && <div className="hero-children">{children}</div>}

          <div className="hero-scroll-cue" aria-hidden="true">
          </div>
        </div>
      </div>
    </section>
  );
}
