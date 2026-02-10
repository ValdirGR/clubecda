'use client';

import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="flex items-center gap-1 text-xs text-dark-500 hover:text-brand-400 transition-colors"
    >
      Voltar ao topo
      <ArrowUp className="w-3 h-3" />
    </button>
  );
}
