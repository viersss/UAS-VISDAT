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

      <div className="hero-content relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1360px] items-end px-5 pb-12 pt-24 sm:px-8 lg:px-12 xl:px-16">
        <div className="hero-inner grid w-full items-end gap-8 lg:grid-cols-[minmax(0,1.35fr)_300px] xl:gap-10">
          <div className="hero-text-panel max-w-[760px]">
            {eyebrow && <div className="hero-eyebrow">{eyebrow}</div>}
            <div className="hero-rule" />
            <h1 className="hero-headline">{title}</h1>
            <p className="hero-subhead">{subtitle}</p>

            {children && <div className="hero-children">{children}</div>}

            <div className="hero-scroll-cue" aria-hidden="true">
              <span className="hero-scroll-line" />
              <span className="hero-scroll-label">Mulai membaca</span>
            </div>
          </div>

          <aside className="hero-aside">
            <div className="hero-aside-card">
              <span className="hero-aside-kicker">Snapshot</span>
              <h2 className="hero-aside-title">Pembangunan tidak merata, tapi polanya dapat dibaca.</h2>
              <div className="hero-aside-grid">
                <div>
                  <span className="hero-aside-label">Rentang IPM</span>
                  <strong>58.3 – 80.3</strong>
                </div>
                <div>
                  <span className="hero-aside-label">Kesenjangan</span>
                  <strong>22.0 poin</strong>
                </div>
              </div>
              <p className="hero-aside-copy">
                Keberhasilan pembangunan masih bergantung pada akses layanan dasar, pendidikan, dan keseimbangan antarwilayah.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
