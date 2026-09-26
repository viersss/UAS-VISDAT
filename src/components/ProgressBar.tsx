import { useEffect, useState } from 'react';

interface NavItem {
  id: string;
  label: string;
}

interface ProgressBarProps {
  items: NavItem[];
}

export default function ProgressBar({ items }: ProgressBarProps) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);

      let current = 0;
      for (let i = 0; i < items.length; i++) {
        const el = document.getElementById(items[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.4) current = i;
        }
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl shadow-[0_10px_25px_rgba(19,43,61,0.04)]">
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-200/80">
        <div
          className="h-full bg-gradient-to-r from-accent via-warm to-orange-400 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-center px-6 sm:px-8">
        <nav className="hidden items-center justify-center gap-1 sm:flex">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
              className={`nav-pill rounded-full px-3 py-1.5 text-[11px] font-medium tracking-[0.02em] transition-all duration-200 ${
                active === i
                  ? 'bg-gradient-to-r from-accent-soft to-amber-50 text-accent-deep shadow-sm ring-1 ring-accent/10'
                  : 'text-ink-muted hover:bg-slate-100 hover:text-ink-soft'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="text-xs font-medium text-ink-muted sm:hidden">
          {active + 1} / {items.length}
        </div>
      </div>
    </div>
  );
}
