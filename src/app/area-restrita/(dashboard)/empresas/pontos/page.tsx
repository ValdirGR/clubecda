'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Star, Plus, Loader2, AlertTriangle, DollarSign, Clock, Pencil, Trash2, X } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import SearchAutocomplete from '@/components/common/SearchAutocomplete';

interface Ponto {
  id: number;
  pontos: number | string | null;
  valor?: number | string | null;
  nota?: string | null;
  data?: string | Date | null;
  id_profissional?: number | null;
  tipo?: string | null;
  estagio_obra?: string | null;
  cidade?: string | null;
  telefone?: string | null;
  email?: string | null;
}

interface EmpresaData {
  id: number;
  empresa: string;
  construtora: string | null;
  foto: string | null;
}

export default function EmpresaPontosPage() {
  const { data: session } = useSession();
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalValor, setTotalValor] = useState(0);
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [searchType, setSearchType] = useState<'profissional' | 'escritorio'>('profissional');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [formData, setFormData] = useState({
    id_profissional: '',
    valor: '',
    tipo: '1' as string,
    estagio_obra: '',
    nota: '',           // Nome Cliente NF
    cidade: '',
    telefone: '',
    email: '',
  });

  // Edição
  const [editingPonto, setEditingPonto] = useState<Ponto | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSearchType, setEditSearchType] = useState<'profissional' | 'escritorio'>('profissional');
  const [editSelectedLabel, setEditSelectedLabel] = useState('');
  const [editFormData, setEditFormData] = useState({
    id_profissional: '',
    valor: '',
    tipo: '1',
    estagio_obra: '',
    nota: '',
    cidade: '',
    telefone: '',
    email: '',
  });
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // Dia limite dinâmico (buscar do banco)
  const [diaLimite, setDiaLimite] = useState(10);
  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const formularioAtivo = diaAtual <= diaLimite;

  // Calcular pontos automaticamente baseado no valor e flag construtora
  const pontosCalculados = useMemo(() => {
    const valor = parseFloat(formData.valor);
    if (isNaN(valor) || valor <= 0) return 0;
    // construtora = 's' → valor / 400
    // construtora = 'n' (ou null) → valor / 100
    const divisor = empresa?.construtora === 's' ? 400 : 100;
    return valor / divisor;
  }, [formData.valor, empresa?.construtora]);

  useEffect(() => {
    fetchPontos();
    fetchDiaLimite();
  }, []);

  async function fetchDiaLimite() {
    try {
      const res = await fetch('/api/pontos/dia-limite');
      const data = await res.json();
      if (data.diaLimite) {
        setDiaLimite(data.diaLimite);
      }
    } catch {
      // Manter padrão 10 se falhar
    }
  }

  async function fetchPontos() {
    try {
      const res = await fetch('/api/pontos');
      const data = await res.json();
      setPontos(data.pontos || []);
      setTotal(data.total || 0);
      setTotalValor(data.totalValor || 0);
      if (data.empresa) {
        setEmpresa(data.empresa);
      }
    } catch {
      toast.error('Erro ao buscar pontos');
    } finally {
      setLoading(false);
    }
  }

  // Validação: não aceitar vírgula no valor
  function handleValorChange(value: string) {
    if (value.includes(',')) {
      toast.error('Não utilizar vírgula no valor, use ponto se necessário! Ex: 10500.50');
      return;
    }
    setFormData({ ...formData, valor: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formularioAtivo) {
      toast.error('Formulário desativado. Disponível apenas entre os dias 1 e ' + diaLimite + ' de cada mês.');
      return;
    }

    if (!formData.id_profissional) {
      toast.error('Selecione um profissional ou escritório.');
      return;
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toast.error('Informe o valor da NF.');
      return;
    }

    if (!formData.estagio_obra) {
      toast.error('Selecione o estágio da obra.');
      return;
    }

    if (!formData.nota) {
      toast.error('Informe o nome do cliente da NF.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch('/api/pontos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao registrar pontos');
      toast.success('Pontos registrados com sucesso!');
      setShowForm(false);
      setFormData({
        id_profissional: '',
        valor: '',
        tipo: '1',
        estagio_obra: '',
        nota: '',
        cidade: '',
        telefone: '',
        email: '',
      });
      setSelectedLabel('');
      fetchPontos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar pontos';
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  }

  // Resolver tipo para exibição na tabela
  function getTipoLabel(tipo: string | null | undefined): string {
    if (tipo === '1' || tipo === 'PR') return 'Profissional';
    if (tipo === '2' || tipo === 'ES') return 'Escritório';
    return tipo || '-';
  }

  // Verificar se a data do ponto é hoje (permite edição/exclusão)
  function isHoje(data: string | Date | null | undefined): boolean {
    if (!data) return false;
    const d = new Date(data);
    const hoje = new Date();
    return (
      d.getFullYear() === hoje.getFullYear() &&
      d.getMonth() === hoje.getMonth() &&
      d.getDate() === hoje.getDate()
    );
  }

  // Pontos calculados para edição
  const editPontosCalculados = useMemo(() => {
    const valor = parseFloat(editFormData.valor);
    if (isNaN(valor) || valor <= 0) return 0;
    const divisor = empresa?.construtora === 's' ? 400 : 100;
    return valor / divisor;
  }, [editFormData.valor, empresa?.construtora]);

  // Abrir modal de edição
  function handleEdit(ponto: Ponto) {
    const tipo = ponto.tipo === '2' || ponto.tipo === 'ES' ? 'escritorio' : 'profissional';
    setEditSearchType(tipo as 'profissional' | 'escritorio');
    setEditSelectedLabel(`#${ponto.id_profissional}`);
    setEditFormData({
      id_profissional: String(ponto.id_profissional || ''),
      valor: String(ponto.valor || ''),
      tipo: ponto.tipo || '1',
      estagio_obra: ponto.estagio_obra || '',
      nota: ponto.nota || '',
      cidade: ponto.cidade || '',
      telefone: ponto.telefone || '',
      email: ponto.email || '',
    });
    setEditingPonto(ponto);
  }

  // Submeter edição
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPonto) return;

    if (!editFormData.id_profissional || !editFormData.valor || !editFormData.estagio_obra || !editFormData.nota) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch(`/api/pontos/${editingPonto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao editar ponto');
      toast.success('Ponto editado com sucesso!');
      setEditingPonto(null);
      fetchPontos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao editar ponto';
      toast.error(message);
    } finally {
      setEditLoading(false);
    }
  }

  // Excluir ponto
  async function handleDelete(pontoId: number) {
    if (!confirm('Tem certeza que deseja excluir este ponto? Esta ação não pode ser desfeita.')) return;

    setDeleteLoading(pontoId);
    try {
      const res = await fetch(`/api/pontos/${pontoId}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao excluir ponto');
      toast.success('Ponto excluído com sucesso!');
      fetchPontos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir ponto';
      toast.error(message);
    } finally {
      setDeleteLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Pontuação</h1>
          {empresa && (
            <p className="text-dark-400 text-sm">
              Empresa Associada: <strong className="text-white">{empresa.empresa}</strong>
            </p>
          )}
        </div>
        {formularioAtivo && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary gap-2"
          >
            <Plus className="w-4 h-4" />
            Inserir Pontuação
          </button>
        )}
      </div>

      {/* Totais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center">
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{total.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-dark-400">Pontuação Total</p>
          </div>
        </div>
        <div className="glass rounded-xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalValor)}</p>
            <p className="text-sm text-dark-400">Total de Vendas</p>
          </div>
        </div>
      </div>

      {/* Aviso prazo */}
      <div className={`glass rounded-xl p-4 flex items-center gap-3 ${formularioAtivo ? 'border border-brand-500/30' : 'border border-red-500/30'}`}>
        <Clock className={`w-5 h-5 ${formularioAtivo ? 'text-brand-400' : 'text-red-400'}`} />
        <div>
          <p className={`text-sm font-medium ${formularioAtivo ? 'text-brand-300' : 'text-red-300'}`}>
            Prazo para Pontuar: até o dia {diaLimite} de cada mês
          </p>
          {!formularioAtivo && (
            <p className="text-xs text-red-400 mt-1">
              Formulário desativado. Disponível apenas entre os dias 1 e {diaLimite} de cada mês.
            </p>
          )}
        </div>
      </div>

      {/* Atenção construtora */}
      {empresa?.construtora === 's' && (
        <div className="glass rounded-xl p-4 flex items-center gap-3 border border-yellow-500/30">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <p className="text-sm text-yellow-300">
            Empresa construtora: pontos calculados como Valor / 400
          </p>
        </div>
      )}

      {/* Formulário */}
      {showForm && formularioAtivo && (
        <div className="glass rounded-xl p-6 animate-slide-down">
          <h3 className="text-lg font-semibold text-white mb-4">Inserir Pontuação</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo + Busca Profissional/Escritório */}
            <div>
              <label className="form-label">Selecione o Profissional/Escritório *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <select
                    value={searchType}
                    onChange={(e) => {
                      const tipo = e.target.value as 'profissional' | 'escritorio';
                      setSearchType(tipo);
                      setFormData({
                        ...formData,
                        id_profissional: '',
                        tipo: tipo === 'profissional' ? '1' : '2',
                      });
                      setSelectedLabel('');
                    }}
                    className="form-input"
                  >
                    <option value="profissional">Profissional</option>
                    <option value="escritorio">Escritório</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <SearchAutocomplete
                    type={searchType}
                    value={formData.id_profissional}
                    selectedLabel={selectedLabel}
                    onSelect={(result) => {
                      setFormData({ ...formData, id_profissional: String(result.id) });
                      setSelectedLabel(result.label);
                    }}
                    onClear={() => {
                      setFormData({ ...formData, id_profissional: '' });
                      setSelectedLabel('');
                    }}
                    placeholder="Buscar por nome, email ou ID..."
                  />
                </div>
              </div>
            </div>

            {/* Valor NF + Pontos (auto-calculado) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Valor NF * (sem vírgula ex: 1000.50)</label>
                <input
                  value={formData.valor}
                  onChange={(e) => handleValorChange(e.target.value)}
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="form-label">Pontos - Cálculo Automático do Sistema</label>
                <input
                  value={pontosCalculados > 0 ? pontosCalculados.toFixed(2) : '0'}
                  className="form-input bg-dark-700/50 cursor-not-allowed"
                  type="text"
                  readOnly
                  tabIndex={-1}
                />
                <p className="text-xs text-dark-500 mt-1">
                  {empresa?.construtora === 's' ? 'Valor ÷ 400' : 'Valor ÷ 100'}
                </p>
              </div>
            </div>

            {/* Estágio da Obra */}
            <div>
              <label className="form-label">Estágio da Obra *</label>
              <select
                value={formData.estagio_obra}
                onChange={(e) => setFormData({ ...formData, estagio_obra: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Selecione...</option>
                <option value="CONSTRUCAO">CONSTRUÇÃO</option>
                <option value="REFORMA">REFORMA</option>
                <option value="DECORACAO">DECORAÇÃO</option>
              </select>
            </div>

            {/* Nome Cliente NF */}
            <div>
              <label className="form-label">Nome Cliente NF *</label>
              <input
                value={formData.nota}
                onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                className="form-input"
                required
                placeholder="Nome do cliente na nota fiscal"
              />
            </div>

            {/* Cidade + Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Cidade Cliente</label>
                <input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="form-input"
                  placeholder="Cidade"
                />
              </div>
              <div>
                <label className="form-label">Telefone Cliente</label>
                <input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="form-input"
                  placeholder="Telefone"
                />
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label className="form-label">E-mail do Cliente</label>
              <input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
                type="email"
                placeholder="email@exemplo.com"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button type="submit" disabled={formLoading} className="btn-primary gap-2">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Adicionar Ponto
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Edição */}
      {editingPonto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Editar Ponto #{editingPonto.id}</h3>
              <button onClick={() => setEditingPonto(null)} className="text-dark-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="form-label">Profissional/Escritório *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <select
                    value={editSearchType}
                    onChange={(e) => {
                      const tipo = e.target.value as 'profissional' | 'escritorio';
                      setEditSearchType(tipo);
                      setEditFormData({ ...editFormData, id_profissional: '', tipo: tipo === 'profissional' ? '1' : '2' });
                      setEditSelectedLabel('');
                    }}
                    className="form-input"
                  >
                    <option value="profissional">Profissional</option>
                    <option value="escritorio">Escritório</option>
                  </select>
                  <div className="sm:col-span-2">
                    <SearchAutocomplete
                      type={editSearchType}
                      value={editFormData.id_profissional}
                      selectedLabel={editSelectedLabel}
                      onSelect={(result) => {
                        setEditFormData({ ...editFormData, id_profissional: String(result.id) });
                        setEditSelectedLabel(result.label);
                      }}
                      onClear={() => {
                        setEditFormData({ ...editFormData, id_profissional: '' });
                        setEditSelectedLabel('');
                      }}
                      placeholder="Buscar por nome, email ou ID..."
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Valor NF *</label>
                  <input
                    value={editFormData.valor}
                    onChange={(e) => {
                      if (e.target.value.includes(',')) {
                        toast.error('Use ponto, não vírgula! Ex: 10500.50');
                        return;
                      }
                      setEditFormData({ ...editFormData, valor: e.target.value });
                    }}
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Pontos (auto)</label>
                  <input
                    value={editPontosCalculados > 0 ? editPontosCalculados.toFixed(2) : '0'}
                    className="form-input bg-dark-700/50 cursor-not-allowed"
                    readOnly
                    tabIndex={-1}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Estágio da Obra *</label>
                <select
                  value={editFormData.estagio_obra}
                  onChange={(e) => setEditFormData({ ...editFormData, estagio_obra: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="CONSTRUCAO">CONSTRUÇÃO</option>
                  <option value="REFORMA">REFORMA</option>
                  <option value="DECORACAO">DECORAÇÃO</option>
                </select>
              </div>
              <div>
                <label className="form-label">Nome Cliente NF *</label>
                <input
                  value={editFormData.nota}
                  onChange={(e) => setEditFormData({ ...editFormData, nota: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Cidade Cliente</label>
                  <input
                    value={editFormData.cidade}
                    onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Telefone Cliente</label>
                  <input
                    value={editFormData.telefone}
                    onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">E-mail do Cliente</label>
                <input
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="form-input"
                  type="email"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={editLoading} className="btn-primary gap-2">
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                  Salvar Alterações
                </button>
                <button type="button" onClick={() => setEditingPonto(null)} className="btn-ghost">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela de pontos */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-dark-700">
          <h3 className="text-lg font-semibold text-white">Pontos Adicionados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700 text-left">
                <th className="px-4 py-3 text-dark-400 font-medium">ID</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Tipo</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Valor</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Pontos</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Nota (Cliente)</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Data</th>
                <th className="px-4 py-3 text-dark-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-dark-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : pontos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-dark-400">
                    Nenhum ponto registrado.
                  </td>
                </tr>
              ) : (
                pontos.map((p, index) => {
                  const podeMudar = isHoje(p.data);
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-dark-800 hover:bg-dark-700/30 ${
                        index % 2 === 0 ? 'bg-dark-800/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-dark-300">{p.id}</td>
                      <td className="px-4 py-3 text-dark-300">{getTipoLabel(p.tipo)}</td>
                      <td className="px-4 py-3 text-dark-300">
                        {p.valor != null ? formatCurrency(Number(p.valor)) : '-'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand-400">{Number(p.pontos)}</td>
                      <td className="px-4 py-3 text-dark-300 truncate max-w-[200px]">
                        {p.nota || '-'}
                      </td>
                      <td className="px-4 py-3 text-dark-300">{formatDate(p.data || null)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(p)}
                            disabled={!podeMudar}
                            title={podeMudar ? 'Editar ponto' : 'Edição permitida somente no dia da criação'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              podeMudar
                                ? 'text-blue-400 hover:bg-blue-400/10 hover:text-blue-300'
                                : 'text-dark-600 cursor-not-allowed'
                            }`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={!podeMudar || deleteLoading === p.id}
                            title={podeMudar ? 'Excluir ponto' : 'Exclusão permitida somente no dia da criação'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              podeMudar
                                ? 'text-red-400 hover:bg-red-400/10 hover:text-red-300'
                                : 'text-dark-600 cursor-not-allowed'
                            }`}
                          >
                            {deleteLoading === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
