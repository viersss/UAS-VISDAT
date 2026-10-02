interface TabSwitcherProps {
  options: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}

export default function TabSwitcher({ options, active, onChange }: TabSwitcherProps) {
  return (
    <div className="story-tab-switcher inline-flex bg-canvas border border-line rounded-lg p-0.5">
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-md font-medium transition-colors ${
            active === opt.key
              ? 'bg-white text-ink shadow-sm border border-line'
              : 'text-ink-muted hover:text-ink-soft'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
