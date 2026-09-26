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
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-line-soft">
      <div className="h-0.5 bg-line-soft absolute bottom-0 left-0 right-0">
        <div
          className="h-full bg-accent transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between">
        <div className="text-sm font-semibold tracking-tight text-ink">
          Ketimpangan Pembangunan Indonesia
        </div>
        <nav className="hidden sm:flex items-center gap-1">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors duration-200 ${
                active === i
                  ? 'bg-accent-soft text-accent-deep font-semibold'
                  : 'text-ink-muted hover:text-ink-soft hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sm:hidden text-xs text-ink-muted font-medium">
          {active + 1} / {items.length}
        </div>
      </div>
    </div>
  );
}
