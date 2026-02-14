'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, User, Building2, X } from 'lucide-react';

interface SearchResult {
  id: number;
  label: string;
  detail: string;
  type: 'profissional' | 'escritorio';
}

interface SearchAutocompleteProps {
  type: 'profissional' | 'escritorio';
  value: string;
  selectedLabel?: string;
  onSelect: (result: SearchResult) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function SearchAutocomplete({
  type,
  value,
  selectedLabel,
  onSelect,
  onClear,
  placeholder,
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchResults = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?type=${type}&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [type]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => fetchResults(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function handleSelect(result: SearchResult) {
    onSelect(result);
    setQuery('');
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  const Icon = type === 'profissional' ? User : Building2;

  // If a value is selected, show the selected state
  if (value) {
    return (
      <div className="relative">
        <div className="form-input flex items-center gap-2 pr-8">
          <Icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <span className="text-white truncate">
            {selectedLabel || `#${value}`}
          </span>
          <span className="text-dark-500 text-xs">ID: {value}</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-dark-600 text-dark-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          className="form-input pl-9 pr-8"
          placeholder={placeholder || `Buscar ${type === 'profissional' ? 'profissional' : 'escritório'}...`}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 animate-spin" />
        )}
      </div>

      {open && (query.length >= 2) && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg bg-dark-800 border border-dark-600 shadow-xl">
          {results.length === 0 && !loading && (
            <div className="px-4 py-3 text-sm text-dark-400">
              Nenhum resultado encontrado
            </div>
          )}
          {results.map((result, index) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelect(result)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-dark-700 transition-colors border-b border-dark-700/50 last:border-0 ${
                index === activeIndex ? 'bg-dark-700' : ''
              }`}
            >
              <Icon className="w-5 h-5 text-brand-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {result.label}
                </div>
                {result.detail && (
                  <div className="text-xs text-dark-400 truncate">
                    {result.detail}
                  </div>
                )}
              </div>
              <span className="text-xs text-dark-500 flex-shrink-0">
                #{result.id}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
