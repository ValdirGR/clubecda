'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Star, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Ponto {
  id: number;
  pontos: number | string | null;
  valor?: number | string | null;
  nota?: string | null;
  data?: string | Date | null;
}

export default function ProfissionalPontosPage() {
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPontos();
  }, []);

  async function fetchPontos() {
    try {
      const res = await fetch('/api/pontos');
      const data = await res.json();
      setPontos(data.pontos || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Erro ao buscar pontos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-white">Meus Pontos</h1>

      <div className="glass rounded-xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center">
          <Star className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{total.toLocaleString('pt-BR')}</p>
          <p className="text-sm text-dark-400">Total de pontos acumulados</p>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700 text-left">
                <th className="px-4 py-3 text-dark-400 font-medium">Data</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Pontos</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Valor</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Observação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-dark-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : pontos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-dark-400">
                    Nenhum ponto registrado.
                  </td>
                </tr>
              ) : (
                pontos.map((p) => (
                  <tr key={p.id} className="border-b border-dark-800 hover:bg-dark-700/30">
                    <td className="px-4 py-3 text-dark-300">{formatDate(p.data || null)}</td>
                    <td className="px-4 py-3 font-semibold text-brand-400">+{Number(p.pontos)}</td>
                    <td className="px-4 py-3 text-dark-300">{p.valor != null ? Number(p.valor) : '-'}</td>
                    <td className="px-4 py-3 text-dark-400 truncate max-w-[250px]">{p.nota || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
