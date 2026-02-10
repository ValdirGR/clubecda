'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Star, Plus, Loader2, Calendar, Building2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Ponto {
  id: number;
  pontos: number | string | null;
  valor?: number | string | null;
  nota?: string | null;
  data?: string | Date | null;
  id_profissional?: number | null;
}

export default function EmpresaPontosPage() {
  const { data: session } = useSession();
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    id_profissional: '',
    pontos: '',
    valor: '',
    nota: '',
  });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch('/api/pontos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Erro ao registrar pontos');
      toast.success('Pontos registrados com sucesso!');
      setShowForm(false);
      setFormData({ id_profissional: '', pontos: '', valor: '', nota: '' });
      fetchPontos();
    } catch {
      toast.error('Erro ao registrar pontos');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Pontos</h1>
          <p className="text-dark-400 text-sm">Gerencie os pontos concedidos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          Registrar Pontos
        </button>
      </div>

      {/* Total */}
      <div className="glass rounded-xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center">
          <Star className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{total.toLocaleString('pt-BR')}</p>
          <p className="text-sm text-dark-400">Pontos concedidos no total</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass rounded-xl p-6 animate-slide-down">
          <h3 className="text-lg font-semibold text-white mb-4">Novo Registro de Pontos</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">ID Profissional</label>
                <input
                  value={formData.id_profissional}
                  onChange={(e) => setFormData({ ...formData, id_profissional: e.target.value })}
                  className="form-input"
                  placeholder="ID do profissional"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Pontos *</label>
                <input
                  value={formData.pontos}
                  onChange={(e) => setFormData({ ...formData, pontos: e.target.value })}
                  className="form-input"
                  type="number"
                  required
                />
              </div>
              <div>
                <label className="form-label">Valor da Compra</label>
                <input
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="form-input"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <label className="form-label">Nota Fiscal</label>
                <input
                  value={formData.nota}
                  onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Nota / Observação</label>
              <textarea
                value={formData.nota}
                onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                className="form-input resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={formLoading} className="btn-primary gap-2">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Registrar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700 text-left">
                <th className="px-4 py-3 text-dark-400 font-medium">Data</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Pontos</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Valor</th>
                <th className="px-4 py-3 text-dark-400 font-medium">NF</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Obs</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-dark-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : pontos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-dark-400">
                    Nenhum ponto registrado.
                  </td>
                </tr>
              ) : (
                pontos.map((p) => (
                  <tr key={p.id} className="border-b border-dark-800 hover:bg-dark-700/30">
                    <td className="px-4 py-3 text-dark-300">{formatDate(p.data || null)}</td>
                    <td className="px-4 py-3 font-semibold text-brand-400">{Number(p.pontos)}</td>
                    <td className="px-4 py-3 text-dark-300">{p.valor != null ? Number(p.valor) : '-'}</td>
                    <td className="px-4 py-3 text-dark-300">{p.nota || '-'}</td>
                    <td className="px-4 py-3 text-dark-400 truncate max-w-[200px]">{'-'}</td>
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
