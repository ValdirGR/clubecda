'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Star, Plus, Loader2, AlertTriangle, DollarSign, Clock } from 'lucide-react';
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-dark-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : pontos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-dark-400">
                    Nenhum ponto registrado.
                  </td>
                </tr>
              ) : (
                pontos.map((p, index) => (
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
