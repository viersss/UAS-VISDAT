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
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-emerald-200/80 bg-white/65 backdrop-blur-xl shadow-[0_8px_22px_rgba(16,84,67,0.08)]">
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-200/80">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-center px-6 sm:px-8">
        <nav className="hidden items-center justify-center gap-2 sm:flex">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
              className={`nav-pill rounded-full border px-4 py-2 text-[11px] font-medium tracking-[0.02em] transition-all duration-200 ${
                active === i
                  ? 'border-emerald-300/80 bg-[linear-gradient(135deg,rgba(224,247,233,0.9),rgba(236,253,245,0.7))] text-emerald-900 shadow-[0_8px_22px_rgba(16,185,129,0.12)]'
                  : 'border-emerald-100/80 bg-[rgba(255,255,255,0.28)] text-emerald-900/75 hover:bg-[rgba(255,255,255,0.42)] hover:text-emerald-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="text-xs font-medium text-emerald-900/80 sm:hidden">
          {active + 1} / {items.length}
        </div>
      </div>
    </div>
  );
}
