'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Briefcase,
  Users,
  FileText,
  Loader2,
  Download,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Star,
  Calendar,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

type TipoRelatorio = 'empresas' | 'escritorios' | 'profissionais' | 'geral';
type NivelDetalhe = 'detalhado' | 'simplificado';

interface Operacao {
  id: number;
  data: string;
  empresaId: number;
  empresaNome: string;
  profissionalId?: number;
  profissionalNome?: string;
  tipo?: string;
  valor: number;
  pontos: number;
  nota?: string;
  status?: string;
}

interface EmpresaRelatorio {
  empresaId: number;
  empresaNome: string;
  totalValor: number;
  totalPontos: number;
  pagamento: number;
  operacoes: Operacao[];
}

interface EscritorioRelatorio {
  escritorioId: number;
  escritorioNome: string;
  nomeFantasia?: string;
  totalValor: number;
  totalPontos: number;
  operacoes: Operacao[];
}

interface ProfissionalRelatorio {
  profissionalId: number;
  profissionalNome: string;
  totalValor: number;
  totalPontos: number;
  operacoes: Operacao[];
}

export default function CasRelatoriosPage() {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('empresas');
  const [nivelDetalhe, setNivelDetalhe] = useState<NivelDetalhe>('detalhado');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Seletor de entidade
  const [entidadeId, setEntidadeId] = useState('todas');
  const [empresas, setEmpresas] = useState<{ id: number; empresa: string }[]>([]);
  const [escritorios, setEscritorios] = useState<{ id: number; empresa: string }[]>([]);
  const [profissionais, setProfissionais] = useState<{ id: number; nome: string }[]>([]);

  // Resultados
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Ordenação
  type SortField = 'nome' | 'valor' | 'pontos';
  type SortDir = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-dark-600 ml-1 inline" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-brand-400 ml-1 inline" />
      : <ArrowDown className="w-3.5 h-3.5 text-brand-400 ml-1 inline" />;
  };

  const sortedEmpresas = useMemo(() => {
    if (!resultado?.empresas) return [];
    const arr = [...(resultado.empresas as EmpresaRelatorio[])];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'nome') cmp = (a.empresaNome || '').localeCompare(b.empresaNome || '', 'pt-BR');
      else if (sortField === 'valor') cmp = a.totalValor - b.totalValor;
      else cmp = a.totalPontos - b.totalPontos;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [resultado?.empresas, sortField, sortDir]);

  const sortedEscritorios = useMemo(() => {
    if (!resultado?.escritorios) return [];
    const arr = [...(resultado.escritorios as EscritorioRelatorio[])];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'nome') cmp = (a.escritorioNome || '').localeCompare(b.escritorioNome || '', 'pt-BR');
      else if (sortField === 'valor') cmp = a.totalValor - b.totalValor;
      else cmp = a.totalPontos - b.totalPontos;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [resultado?.escritorios, sortField, sortDir]);

  const sortedProfissionais = useMemo(() => {
    if (!resultado?.profissionais) return [];
    const arr = [...(resultado.profissionais as ProfissionalRelatorio[])];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'nome') cmp = (a.profissionalNome || '').localeCompare(b.profissionalNome || '', 'pt-BR');
      else if (sortField === 'valor') cmp = a.totalValor - b.totalValor;
      else cmp = a.totalPontos - b.totalPontos;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [resultado?.profissionais, sortField, sortDir]);

  const sortedOperacoes = useMemo(() => {
    if (!resultado?.operacoes) return [];
    const arr = [...(resultado.operacoes as Operacao[])];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'nome') cmp = (a.empresaNome || '').localeCompare(b.empresaNome || '', 'pt-BR');
      else if (sortField === 'valor') cmp = a.valor - b.valor;
      else cmp = a.pontos - b.pontos;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [resultado?.operacoes, sortField, sortDir]);

  // Buscar opções de seletores
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const res = await fetch('/api/cas/relatorios/entidades');
        if (res.ok) {
          const data = await res.json();
          setEmpresas(data.empresas || []);
          setEscritorios(data.escritorios || []);
          setProfissionais(data.profissionais || []);
        }
      } catch {
        // Fallback: buscar diretamente
      }
    };
    fetchEntities();
  }, []);

  const gerarRelatorio = async () => {
    if (!dataInicio || !dataFim) {
      toast.error('Selecione o período (data início e data fim)');
      return;
    }

    setLoading(true);
    setResultado(null);
    setExpandedRows(new Set());

    try {
      let url = '';
      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        tipo: nivelDetalhe,
      });

      switch (tipoRelatorio) {
        case 'empresas':
          params.set('empresa', entidadeId === 'todas' ? 'todas' : entidadeId);
          url = `/api/cas/relatorios/empresas?${params}`;
          break;
        case 'escritorios':
          params.set('escritorio', entidadeId === 'todas' ? 'todos' : entidadeId);
          url = `/api/cas/relatorios/escritorios?${params}`;
          break;
        case 'profissionais':
          params.set('profissional', entidadeId === 'todas' ? 'todos' : entidadeId);
          url = `/api/cas/relatorios/profissionais?${params}`;
          break;
        case 'geral':
          url = `/api/cas/relatorios/geral?${params}`;
          break;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao gerar relatório');
        return;
      }

      setResultado(data);
    } catch {
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('pt-BR');
  };

  const tipoOptions: { value: TipoRelatorio; label: string; icon: any }[] = [
    { value: 'empresas', label: 'Por Empresas', icon: Building2 },
    { value: 'escritorios', label: 'Por Escritórios', icon: Briefcase },
    { value: 'profissionais', label: 'Por Profissionais', icon: Users },
    { value: 'geral', label: 'Geral', icon: FileText },
  ];

  return (
    <div className="min-h-screen pt-24 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/cas" className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              Relatórios
            </h1>
            <p className="text-dark-400 text-sm">
              Gerar relatórios de pontuação por empresa, escritório, profissional ou geral
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="glass rounded-xl p-6 space-y-6">
          {/* Tipo de relatório */}
          <div>
            <label className="block text-sm text-dark-400 mb-2">
              Tipo de Relatório
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tipoOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTipoRelatorio(opt.value);
                    setEntidadeId('todas');
                    setResultado(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    tipoRelatorio === opt.value
                      ? 'bg-brand-400/10 text-brand-400 border border-brand-400/30'
                      : 'bg-dark-700/30 text-dark-300 border border-dark-600/50 hover:border-dark-500'
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Detalhamento */}
            <div>
              <label className="block text-sm text-dark-400 mb-1.5">
                Nível de Detalhe
              </label>
              <select
                value={nivelDetalhe}
                onChange={(e) =>
                  setNivelDetalhe(e.target.value as NivelDetalhe)
                }
                className="w-full px-3 py-2.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white focus:border-brand-400 focus:outline-none"
              >
                <option value="detalhado">Detalhado</option>
                <option value="simplificado">Simplificado</option>
              </select>
            </div>

            {/* Seletor de entidade */}
            {tipoRelatorio !== 'geral' && (
              <div>
                <label className="block text-sm text-dark-400 mb-1.5">
                  {tipoRelatorio === 'empresas'
                    ? 'Empresa'
                    : tipoRelatorio === 'escritorios'
                    ? 'Escritório'
                    : 'Profissional'}
                </label>
                <select
                  value={entidadeId}
                  onChange={(e) => setEntidadeId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white focus:border-brand-400 focus:outline-none"
                >
                  <option value="todas">
                    {tipoRelatorio === 'empresas'
                      ? 'Todas as Empresas'
                      : tipoRelatorio === 'escritorios'
                      ? 'Todos os Escritórios'
                      : 'Todos os Profissionais'}
                  </option>
                  {tipoRelatorio === 'empresas' &&
                    empresas.map((e) => (
                      <option key={e.id} value={String(e.id)}>
                        {e.empresa}
                      </option>
                    ))}
                  {tipoRelatorio === 'escritorios' &&
                    escritorios.map((e) => (
                      <option key={e.id} value={String(e.id)}>
                        {e.empresa}
                      </option>
                    ))}
                  {tipoRelatorio === 'profissionais' &&
                    profissionais.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.nome}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Período */}
            <div>
              <label className="block text-sm text-dark-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Data Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Data Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white focus:border-brand-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={gerarRelatorio}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-400 text-dark-900 rounded-lg font-medium text-sm hover:bg-brand-300 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              Gerar Relatório
            </button>
          </div>
        </div>

        {/* Resultados */}
        {resultado && (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-dark-400">Valor Total</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(resultado.totalGeral?.valor || 0)}
                </p>
              </div>
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-dark-400">Total Pontos</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {(resultado.totalGeral?.pontos || 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-dark-400">Registros</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {(resultado.totalGeral?.registros || 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Tabela por Empresa */}
            {tipoRelatorio === 'empresas' && resultado.empresas && (
              <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-700 text-left">
                        {nivelDetalhe === 'detalhado' && (
                          <th className="px-4 py-3 text-dark-400 font-medium w-8"></th>
                        )}
                        <th className="px-4 py-3 text-dark-400 font-medium cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('nome')}>Empresa <SortIcon field="nome" /></th>
                        <th className="px-4 py-3 text-dark-400 font-medium text-right cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('valor')}>
                          Valor (R$) <SortIcon field="valor" />
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium text-right cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('pontos')}>
                          Pontos <SortIcon field="pontos" />
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium text-right">
                          Pagamento
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEmpresas.map((emp) => (
                        <>
                          <tr
                            key={emp.empresaId}
                            className="border-b border-dark-800 hover:bg-dark-700/30 cursor-pointer"
                            onClick={() =>
                              nivelDetalhe === 'detalhado' &&
                              toggleRow(emp.empresaId)
                            }
                          >
                            {nivelDetalhe === 'detalhado' && (
                              <td className="px-4 py-3">
                                {expandedRows.has(emp.empresaId) ? (
                                  <ChevronDown className="w-4 h-4 text-dark-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-dark-500" />
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3 text-white font-medium">
                              <span className="text-dark-500 font-mono text-xs mr-2">
                                #{emp.empresaId}
                              </span>
                              {emp.empresaNome}
                            </td>
                            <td className="px-4 py-3 text-dark-300 text-right">
                              {formatCurrency(emp.totalValor)}
                            </td>
                            <td className="px-4 py-3 text-dark-300 text-right">
                              {emp.totalPontos.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-green-400 font-medium text-right">
                              {formatCurrency(emp.pagamento)}
                            </td>
                          </tr>
                          {/* Operações expandidas */}
                          {nivelDetalhe === 'detalhado' &&
                            expandedRows.has(emp.empresaId) &&
                            emp.operacoes.map((op) => (
                              <tr
                                key={`op-${op.id}`}
                                className="bg-dark-800/50 border-b border-dark-800/30"
                              >
                                <td className="px-4 py-2"></td>
                                <td className="px-4 py-2 text-xs">
                                  <span className="text-dark-500 font-mono">
                                    Op #{op.id}
                                  </span>
                                  <span className="text-dark-400 mx-2">
                                    {formatDate(op.data)}
                                  </span>
                                  <span className="text-dark-300">
                                    {op.profissionalNome}
                                  </span>
                                  {op.tipo && (
                                    <span className="ml-1 text-xs text-dark-500">
                                      ({op.tipo})
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-dark-400 text-right text-xs">
                                  {formatCurrency(op.valor)}
                                </td>
                                <td className="px-4 py-2 text-dark-400 text-right text-xs">
                                  {op.pontos}
                                </td>
                                <td className="px-4 py-2"></td>
                              </tr>
                            ))}
                        </>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-brand-400/30 bg-dark-800/80">
                        {nivelDetalhe === 'detalhado' && <td></td>}
                        <td className="px-4 py-3 text-white font-bold">
                          TOTAL GERAL
                        </td>
                        <td className="px-4 py-3 text-white font-bold text-right">
                          {formatCurrency(resultado.totalGeral?.valor || 0)}
                        </td>
                        <td className="px-4 py-3 text-white font-bold text-right">
                          {(resultado.totalGeral?.pontos || 0).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-green-400 font-bold text-right">
                          {formatCurrency(resultado.totalGeral?.pagamento || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Tabela por Escritório */}
            {tipoRelatorio === 'escritorios' && resultado.escritorios && (
              <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-700 text-left">
                        {nivelDetalhe === 'detalhado' && (
                          <th className="px-4 py-3 text-dark-400 font-medium w-8"></th>
                        )}
                        <th className="px-4 py-3 text-dark-400 font-medium cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('nome')}>
                          Escritório <SortIcon field="nome" />
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium text-right cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('valor')}>
                          Valor (R$) <SortIcon field="valor" />
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium text-right cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('pontos')}>
                          Pontos <SortIcon field="pontos" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEscritorios.map(
                        (esc) => (
                          <>
                            <tr
                              key={esc.escritorioId}
                              className="border-b border-dark-800 hover:bg-dark-700/30 cursor-pointer"
                              onClick={() =>
                                nivelDetalhe === 'detalhado' &&
                                toggleRow(esc.escritorioId)
                              }
                            >
                              {nivelDetalhe === 'detalhado' && (
                                <td className="px-4 py-3">
                                  {expandedRows.has(esc.escritorioId) ? (
                                    <ChevronDown className="w-4 h-4 text-dark-500" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-dark-500" />
                                  )}
                                </td>
                              )}
                              <td className="px-4 py-3 text-white font-medium">
                                <span className="text-dark-500 font-mono text-xs mr-2">
                                  #{esc.escritorioId}
                                </span>
                                {esc.escritorioNome}
                              </td>
                              <td className="px-4 py-3 text-dark-300 text-right">
                                {formatCurrency(esc.totalValor)}
                              </td>
                              <td className="px-4 py-3 text-dark-300 text-right">
                                {esc.totalPontos.toLocaleString('pt-BR')}
                              </td>
                            </tr>
                            {nivelDetalhe === 'detalhado' &&
                              expandedRows.has(esc.escritorioId) &&
                              esc.operacoes.map((op) => (
                                <tr
                                  key={`op-${op.id}`}
                                  className="bg-dark-800/50 border-b border-dark-800/30"
                                >
                                  <td className="px-4 py-2"></td>
                                  <td className="px-4 py-2 text-xs">
                                    <span className="text-dark-500 font-mono">
                                      Op #{op.id}
                                    </span>
                                    <span className="text-dark-400 mx-2">
                                      {formatDate(op.data)}
                                    </span>
                                    <span className="text-dark-300">
                                      {op.empresaNome}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-dark-400 text-right text-xs">
                                    {formatCurrency(op.valor)}
                                  </td>
                                  <td className="px-4 py-2 text-dark-400 text-right text-xs">
                                    {op.pontos}
                                  </td>
                                </tr>
                              ))}
                          </>
                        )
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-brand-400/30 bg-dark-800/80">
                        {nivelDetalhe === 'detalhado' && <td></td>}
                        <td className="px-4 py-3 text-white font-bold">
                          TOTAL GERAL
                        </td>
                        <td className="px-4 py-3 text-white font-bold text-right">
                          {formatCurrency(resultado.totalGeral?.valor || 0)}
                        </td>
                        <td className="px-4 py-3 text-white font-bold text-right">
                          {(resultado.totalGeral?.pontos || 0).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Tabela por Profissional */}
            {tipoRelatorio === 'profissionais' && resultado.profissionais && (
              <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-700 text-left">
                        {nivelDetalhe === 'detalhado' && (
                          <th className="px-4 py-3 text-dark-400 font-medium w-8"></th>
                        )}
                        <th className="px-4 py-3 text-dark-400 font-medium cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('nome')}>
                          Profissional <SortIcon field="nome" />
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium text-right cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('valor')}>
                          Valor (R$) <SortIcon field="valor" />
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium text-right cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('pontos')}>
                          Pontos <SortIcon field="pontos" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProfissionais.map(
                        (prof) => (
                          <>
                            <tr
                              key={prof.profissionalId}
                              className="border-b border-dark-800 hover:bg-dark-700/30 cursor-pointer"
                              onClick={() =>
                                nivelDetalhe === 'detalhado' &&
                                toggleRow(prof.profissionalId)
                              }
                            >
                              {nivelDetalhe === 'detalhado' && (
                                <td className="px-4 py-3">
                                  {expandedRows.has(prof.profissionalId) ? (
                                    <ChevronDown className="w-4 h-4 text-dark-500" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-dark-500" />
                                  )}
                                </td>
                              )}
                              <td className="px-4 py-3 text-white font-medium">
                                <span className="text-dark-500 font-mono text-xs mr-2">
                                  #{prof.profissionalId}
                                </span>
                                {prof.profissionalNome}
                              </td>
                              <td className="px-4 py-3 text-dark-300 text-right">
                                {formatCurrency(prof.totalValor)}
                              </td>
                              <td className="px-4 py-3 text-dark-300 text-right">
                                {prof.totalPontos.toLocaleString('pt-BR')}
                              </td>
                            </tr>
                            {nivelDetalhe === 'detalhado' &&
                              expandedRows.has(prof.profissionalId) &&
                              prof.operacoes.map((op) => (
                                <tr
                                  key={`op-${op.id}`}
                                  className="bg-dark-800/50 border-b border-dark-800/30"
                                >
                                  <td className="px-4 py-2"></td>
                                  <td className="px-4 py-2 text-xs">
                                    <span className="text-dark-500 font-mono">
                                      Op #{op.id}
                                    </span>
                                    <span className="text-dark-400 mx-2">
                                      {formatDate(op.data)}
                                    </span>
                                    <span className="text-dark-300">
                                      {op.empresaNome}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-dark-400 text-right text-xs">
                                    {formatCurrency(op.valor)}
                                  </td>
                                  <td className="px-4 py-2 text-dark-400 text-right text-xs">
                                    {op.pontos}
                                  </td>
                                </tr>
                              ))}
                          </>
                        )
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-brand-400/30 bg-dark-800/80">
                        {nivelDetalhe === 'detalhado' && <td></td>}
                        <td className="px-4 py-3 text-white font-bold">
                          TOTAL GERAL
                        </td>
                        <td className="px-4 py-3 text-white font-bold text-right">
                          {formatCurrency(resultado.totalGeral?.valor || 0)}
                        </td>
                        <td className="px-4 py-3 text-white font-bold text-right">
                          {(resultado.totalGeral?.pontos || 0).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Tabela Geral */}
            {tipoRelatorio === 'geral' && resultado.operacoes && (
              <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-700 text-left">
                        <th className="px-4 py-3 text-dark-400 font-medium">
                          ID
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium">
                          Data
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('nome')}>
                          Empresa <SortIcon field="nome" />
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium">
                          Profissional/Escritório
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium text-center">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium text-right cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('valor')}>
                          Valor <SortIcon field="valor" />
                        </th>
                        <th className="px-4 py-3 text-dark-400 font-medium text-right cursor-pointer select-none hover:text-white transition-colors" onClick={() => toggleSort('pontos')}>
                          Pontos <SortIcon field="pontos" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOperacoes.map((op) => (
                        <tr
                          key={op.id}
                          className="border-b border-dark-800 hover:bg-dark-700/30"
                        >
                          <td className="px-4 py-3 text-dark-500 font-mono">
                            {op.id}
                          </td>
                          <td className="px-4 py-3 text-dark-300 text-xs">
                            {formatDate(op.data)}
                          </td>
                          <td className="px-4 py-3 text-white">
                            {op.empresaNome}
                          </td>
                          <td className="px-4 py-3 text-dark-300">
                            {op.profissionalNome || '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {op.tipo && (
                              <span
                                className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                                  op.tipo === 'Profissional'
                                    ? 'text-green-400 bg-green-400/10'
                                    : 'text-purple-400 bg-purple-400/10'
                                }`}
                              >
                                {op.tipo}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-dark-300 text-right">
                            {formatCurrency(op.valor)}
                          </td>
                          <td className="px-4 py-3 text-dark-300 text-right">
                            {op.pontos}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-brand-400/30 bg-dark-800/80">
                        <td
                          colSpan={5}
                          className="px-4 py-3 text-white font-bold"
                        >
                          TOTAL ({resultado.totalGeral?.registros || 0} registros)
                        </td>
                        <td className="px-4 py-3 text-white font-bold text-right">
                          {formatCurrency(resultado.totalGeral?.valor || 0)}
                        </td>
                        <td className="px-4 py-3 text-white font-bold text-right">
                          {(resultado.totalGeral?.pontos || 0).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
