'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Percent,
  Plus,
  Save,
  Trash2,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MultiplierRow {
  id: number;
  range_min: number;
  range_max: number | null;
  multiplier: number;
  bonus_percent: number;
}

export default function BonusMultipliersPage() {
  const [rows, setRows] = useState<MultiplierRow[]>([]);
  const [original, setOriginal] = useState<MultiplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Nova faixa
  const [newRow, setNewRow] = useState({ range_min: 0, range_max: '', multiplier: 1, bonus_percent: 0 });
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bonus-multipliers');
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setRows(data);
      setOriginal(JSON.parse(JSON.stringify(data)));
      setHasChanges(false);
    } catch {
      toast.error('Erro ao carregar multiplicadores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Detectar mudanças
  useEffect(() => {
    setHasChanges(JSON.stringify(rows) !== JSON.stringify(original));
  }, [rows, original]);

  const updateField = (id: number, field: keyof MultiplierRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === 'range_max') {
          return { ...r, [field]: value === '' ? null : Number(value) };
        }
        return { ...r, [field]: Number(value) };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/bonus-multipliers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar');
        return;
      }

      toast.success('Multiplicadores salvos!');
      setOriginal(JSON.parse(JSON.stringify(rows)));
      setHasChanges(false);
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      const res = await fetch('/api/admin/bonus-multipliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          range_min: newRow.range_min,
          range_max: newRow.range_max === '' ? null : Number(newRow.range_max),
          multiplier: newRow.multiplier,
          bonus_percent: newRow.bonus_percent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao adicionar');
        return;
      }

      toast.success('Faixa adicionada!');
      setShowAddForm(false);
      setNewRow({ range_min: 0, range_max: '', multiplier: 1, bonus_percent: 0 });
      fetchData();
    } catch {
      toast.error('Erro ao adicionar');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta faixa?')) return;

    try {
      const res = await fetch(`/api/admin/bonus-multipliers/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Erro ao excluir');
        return;
      }

      toast.success('Faixa removida');
      fetchData();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const handleCancel = () => {
    setRows(JSON.parse(JSON.stringify(original)));
    setHasChanges(false);
  };

  return (
    <div className="min-h-screen pt-24 bg-dark-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="btn-ghost">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">
                Bônus Multiplicadores
              </h1>
              <p className="text-dark-400 text-sm">
                Gerenciar faixas de índice multiplicador por quantidade de empresas únicas/mês
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn-ghost"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Info box */}
        <div className="glass rounded-xl p-4 border border-brand-400/20">
          <div className="flex items-start gap-3">
            <Percent className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" />
            <div className="text-sm text-dark-300">
              <p className="font-medium text-white mb-1">Como funciona o índice multiplicador</p>
              <p>
                Cada faixa define quantas empresas únicas um escritório/profissional precisa atender em um mês
                para receber o multiplicador correspondente no cálculo do valor com índice.
              </p>
              <p className="mt-1">
                <strong className="text-brand-400">Exemplo:</strong> Se um escritório atende 5 empresas no mês,
                o multiplicador é <strong>1.30</strong> (30% de bônus), aplicado sobre o valor acumulado.
              </p>
            </div>
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="glass rounded-xl p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            <span className="ml-3 text-dark-400">Carregando...</span>
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700 text-left">
                    <th className="px-4 py-3 text-dark-400 font-medium w-32">Mín. Empresas</th>
                    <th className="px-4 py-3 text-dark-400 font-medium w-32">Máx. Empresas</th>
                    <th className="px-4 py-3 text-dark-400 font-medium w-36">Multiplicador</th>
                    <th className="px-4 py-3 text-dark-400 font-medium w-32">Bônus %</th>
                    <th className="px-4 py-3 text-dark-400 font-medium text-center w-24">Faixa</th>
                    <th className="px-4 py-3 text-dark-400 font-medium text-center w-20">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-dark-800 hover:bg-dark-700/30"
                    >
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          value={row.range_min}
                          onChange={(e) => updateField(row.id, 'range_min', e.target.value)}
                          className="w-full px-2 py-1.5 bg-dark-700/50 border border-dark-600 rounded text-white text-sm focus:border-brand-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          value={row.range_max ?? ''}
                          placeholder="∞"
                          onChange={(e) => updateField(row.id, 'range_max', e.target.value)}
                          className="w-full px-2 py-1.5 bg-dark-700/50 border border-dark-600 rounded text-white text-sm focus:border-brand-400 focus:outline-none placeholder:text-dark-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            max={99}
                            value={row.multiplier}
                            onChange={(e) => updateField(row.id, 'multiplier', e.target.value)}
                            className="w-full px-2 py-1.5 bg-dark-700/50 border border-dark-600 rounded text-white text-sm focus:border-brand-400 focus:outline-none"
                          />
                          <span className="text-dark-500 text-xs">x</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={row.bonus_percent}
                            onChange={(e) => updateField(row.id, 'bonus_percent', e.target.value)}
                            className="w-full px-2 py-1.5 bg-dark-700/50 border border-dark-600 rounded text-white text-sm focus:border-brand-400 focus:outline-none"
                          />
                          <span className="text-dark-500 text-xs">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-400/10 text-brand-400">
                          {row.range_min}{row.range_max !== null ? `–${row.range_max}` : '+'} emp.
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="p-1.5 text-dark-500 hover:text-red-400 transition-colors"
                          title="Excluir faixa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Adicionar nova faixa */}
            {showAddForm && (
              <div className="border-t border-dark-700 p-4 bg-dark-800/50">
                <p className="text-sm font-medium text-white mb-3">Nova Faixa</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Mín. Empresas</label>
                    <input
                      type="number"
                      min={0}
                      value={newRow.range_min}
                      onChange={(e) => setNewRow({ ...newRow, range_min: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-dark-700/50 border border-dark-600 rounded text-white text-sm focus:border-brand-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Máx. Empresas</label>
                    <input
                      type="number"
                      min={0}
                      value={newRow.range_max}
                      placeholder="vazio = sem limite"
                      onChange={(e) => setNewRow({ ...newRow, range_max: e.target.value })}
                      className="w-full px-2 py-1.5 bg-dark-700/50 border border-dark-600 rounded text-white text-sm focus:border-brand-400 focus:outline-none placeholder:text-dark-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Multiplicador</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={newRow.multiplier}
                      onChange={(e) => setNewRow({ ...newRow, multiplier: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-dark-700/50 border border-dark-600 rounded text-white text-sm focus:border-brand-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Bônus %</label>
                    <input
                      type="number"
                      min={0}
                      value={newRow.bonus_percent}
                      onChange={(e) => setNewRow({ ...newRow, bonus_percent: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-dark-700/50 border border-dark-600 rounded text-white text-sm focus:border-brand-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-400 text-dark-900 rounded-lg text-sm font-medium hover:bg-brand-300 transition-colors disabled:opacity-50"
                  >
                    {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Adicionar
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-dark-400 hover:text-white text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="border-t border-dark-700 p-4 flex items-center justify-between">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-dark-300 hover:text-brand-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Faixa
              </button>

              <div className="flex items-center gap-3">
                {hasChanges && (
                  <div className="flex items-center gap-1.5 text-yellow-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Alterações não salvas
                  </div>
                )}
                {hasChanges && (
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-dark-400 hover:text-white text-sm transition-colors"
                  >
                    Descartar
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="flex items-center gap-1.5 px-5 py-2 bg-brand-400 text-dark-900 rounded-lg text-sm font-medium hover:bg-brand-300 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
