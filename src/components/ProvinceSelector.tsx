import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

interface ProvinceSelectorProps {
  provinces: string[];
  selected: Set<string>;
  onToggle: (provinsi: string) => void;
  onClear: () => void;
}

export default function ProvinceSelector({ provinces, selected, onToggle, onClear }: ProvinceSelectorProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return provinces;
    return provinces.filter(p => p.toLowerCase().includes(query.toLowerCase()));
  }, [provinces, query]);

  const selectedList = Array.from(selected);

  return (
    <div className="province-selector bg-white border border-line rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">Sorot Provinsi</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Pilih provinsi untuk menonjolkannya di seluruh visualisasi
          </p>
        </div>
        {selectedList.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-ink-muted hover:text-warm transition-colors flex items-center gap-1"
          >
            <X size={14} /> Hapus
          </button>
        )}
      </div>

      {selectedList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {selectedList.map(p => (
            <button
              key={p}
              onClick={() => onToggle(p)}
              className="inline-flex items-center gap-1.5 text-xs bg-accent-soft text-accent-deep px-2.5 py-1 rounded-full font-medium hover:bg-accent hover:text-white transition-colors"
            >
              {p}
              <X size={12} />
            </button>
          ))}
        </div>
      )}

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari provinsi…"
          className="w-full text-sm bg-canvas border border-line rounded-lg pl-9 pr-3 py-2 text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
        {filtered.map(p => {
          const isOn = selected.has(p);
          return (
            <button
              key={p}
              onClick={() => onToggle(p)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                isOn
                  ? 'bg-accent text-white border-accent font-medium'
                  : 'bg-white text-ink-soft border-line hover:border-accent hover:text-accent-deep'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}
