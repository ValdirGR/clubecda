'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Clock,
  LogIn,
  LogOut,
  Monitor,
  Loader2,
  Filter,
  UserCheck,
} from 'lucide-react';

interface LogAcesso {
  log_acesso_id: number;
  log_acesso_login: string | null;
  log_acesso_logout: string | null;
  log_acesso_IP: string | null;
  usuario: {
    usuario_id: number;
    usuario_nome: string;
    usuario_user: string;
    usuario_tipo: string;
  } | null;
}

export default function CasAcessosPage() {
  const [logs, setLogs] = useState<LogAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (dataInicio) params.set('dataInicio', dataInicio);
      if (dataFim) params.set('dataFim', dataFim);

      const res = await fetch(`/api/cas/acessos?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch {
      console.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  }, [page, dataInicio, dataFim]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDateTime = (dt: string | null) => {
    if (!dt) return '-';
    return new Date(dt).toLocaleString('pt-BR');
  };

  const getDuration = (login: string | null, logout: string | null) => {
    if (!login || !logout) return '-';
    const diff = new Date(logout).getTime() - new Date(login).getTime();
    if (diff < 0) return '-';
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins}min`;
  };

  return (
    <div className="min-h-screen pt-24 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/cas" className="btn-ghost">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">
                Log de Acessos
              </h1>
              <p className="text-dark-400 text-sm">
                {total} registros de acesso ao sistema
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              showFilters
                ? 'bg-brand-400 text-dark-900'
                : 'glass text-dark-300 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="glass rounded-xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1.5">
                  Data Início
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => {
                    setDataInicio(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white focus:border-brand-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1.5">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => {
                    setDataFim(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white focus:border-brand-400 focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDataInicio('');
                    setDataFim('');
                    setPage(1);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-dark-400 hover:text-white transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700 text-left">
                  <th className="px-4 py-3 text-dark-400 font-medium">ID</th>
                  <th className="px-4 py-3 text-dark-400 font-medium">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-dark-400 font-medium text-center">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-dark-400 font-medium">
                    <div className="flex items-center gap-1">
                      <LogIn className="w-3.5 h-3.5" /> Login
                    </div>
                  </th>
                  <th className="px-4 py-3 text-dark-400 font-medium">
                    <div className="flex items-center gap-1">
                      <LogOut className="w-3.5 h-3.5" /> Logout
                    </div>
                  </th>
                  <th className="px-4 py-3 text-dark-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Duração
                    </div>
                  </th>
                  <th className="px-4 py-3 text-dark-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5" /> IP
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-dark-500"
                    >
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-dark-500"
                    >
                      Nenhum registro de acesso encontrado
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.log_acesso_id}
                      className="border-b border-dark-800 hover:bg-dark-700/30"
                    >
                      <td className="px-4 py-3 text-dark-500 font-mono">
                        {log.log_acesso_id}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        {log.usuario?.usuario_nome || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            log.usuario?.usuario_tipo === 'admin'
                              ? 'text-purple-400 bg-purple-400/10'
                              : 'text-blue-400 bg-blue-400/10'
                          }`}
                        >
                          <UserCheck className="w-3 h-3" />
                          {log.usuario?.usuario_tipo === 'admin'
                            ? 'Admin'
                            : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-dark-300 text-xs">
                        {formatDateTime(log.log_acesso_login)}
                      </td>
                      <td className="px-4 py-3 text-dark-300 text-xs">
                        {formatDateTime(log.log_acesso_logout)}
                      </td>
                      <td className="px-4 py-3 text-dark-400 text-xs">
                        {getDuration(
                          log.log_acesso_login,
                          log.log_acesso_logout
                        )}
                      </td>
                      <td className="px-4 py-3 text-dark-500 font-mono text-xs">
                        {log.log_acesso_IP || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-dark-700">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-dark-400 hover:text-white hover:bg-dark-700 disabled:opacity-30 transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-sm text-dark-400">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-dark-400 hover:text-white hover:bg-dark-700 disabled:opacity-30 transition-colors"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
