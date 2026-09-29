import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLElement | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const nav = navRef.current;
      const button = buttonRefs.current[active];
      if (!nav || !button) return;
      setIndicator({ left: button.offsetLeft, width: button.offsetWidth });
    };

    updateIndicator();
    const observer = new ResizeObserver(updateIndicator);
    if (navRef.current) observer.observe(navRef.current);
    return () => observer.disconnect();
  }, [active, items.length]);

  return (
    <div className="story-nav-shell fixed left-1/2 top-3 z-50 w-[calc(100%-1rem)] max-w-[980px] -translate-x-1/2 overflow-hidden rounded-full">
      <div className="relative flex h-[54px] items-center justify-center px-1.5 sm:h-[58px] sm:px-2">
        <nav ref={navRef} aria-label="Navigasi cerita" className="relative flex w-full items-center justify-center gap-0.5 overflow-x-auto">
          <span
            aria-hidden="true"
            className="story-nav-indicator"
            style={{ left: indicator.left, width: indicator.width }}
          />
          {items.map((item, i) => (
            <button
              key={item.id}
              ref={node => { buttonRefs.current[i] = node; }}
              type="button"
              aria-current={active === i ? 'location' : undefined}
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
              className={`story-nav-link relative z-10 shrink-0 rounded-full px-2.5 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-[13px] ${
                active === i ? 'text-ink' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="story-nav-track absolute bottom-0 left-5 right-5 h-[2px] overflow-hidden rounded-full">
        <div
          className="story-nav-progress h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
