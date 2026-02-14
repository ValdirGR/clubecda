'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Save,
  Loader2,
  History,
  User,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';

interface LogEntry {
  id: number;
  chave: string;
  valor_anterior: string | null;
  valor_novo: string;
  usuario_id: number | null;
  usuario_nome: string | null;
  created_at: string;
}

export default function DiaLimitePontuacaoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [diaLimite, setDiaLimite] = useState('10');
  const [diaOriginal, setDiaOriginal] = useState('10');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    if (session?.user && !['admin', 'user'].includes(session.user.role)) {
      router.push('/area-restrita');
    }
  }, [session, router]);

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch('/api/cas/configuracoes?chave=dia_limite_pontuacao');
      const data = await res.json();
      if (data.config) {
        setDiaLimite(data.config.valor);
        setDiaOriginal(data.config.valor);
      }
    } catch {
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs() {
    try {
      const res = await fetch('/api/cas/configuracoes/logs');
      const data = await res.json();
      setLogs(
        (data.logs || []).filter(
          (l: LogEntry) => l.chave === 'dia_limite_pontuacao'
        )
      );
    } catch {
      // silently fail
    } finally {
      setLogsLoading(false);
    }
  }

  async function handleSave() {
    const dia = parseInt(diaLimite);
    if (isNaN(dia) || dia < 1 || dia > 31) {
      toast.error('O dia deve ser entre 1 e 31.');
      return;
    }

    if (diaLimite === diaOriginal) {
      toast('Nenhuma alteração para salvar.', { icon: 'ℹ️' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/cas/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chave: 'dia_limite_pontuacao',
          valor: String(dia),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success(`Dia limite alterado de ${diaOriginal} para ${dia}`);
      setDiaOriginal(String(dia));
      fetchLogs(); // Atualizar logs
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = diaLimite !== diaOriginal;

  return (
    <div className="min-h-screen pt-24 bg-dark-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-1">
              Dia Limite Pontuação
            </h1>
            <p className="text-dark-400">
              Defina até qual dia do mês as empresas podem inserir pontuação
            </p>
          </div>
        </div>

        {/* Config Card */}
        <div className="glass rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-brand-400/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Configuração do Prazo
              </h2>
              <p className="text-sm text-dark-400">
                O formulário de pontuação ficará disponível do dia 1 até o dia
                informado abaixo
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-w-xs">
                <label className="form-label">
                  Dia Limite (1 a 31) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={diaLimite}
                    onChange={(e) => setDiaLimite(e.target.value)}
                    className="form-input text-center text-2xl font-bold w-24"
                  />
                  <span className="text-dark-400 text-sm">
                    de cada mês
                  </span>
                </div>
                <p className="text-xs text-dark-500 mt-2">
                  Empresas poderão pontuar do dia 1 até o dia{' '}
                  <strong className="text-brand-400">{diaLimite || '?'}</strong>{' '}
                  de cada mês
                </p>
              </div>

              {hasChanges && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
                  <ArrowRightLeft className="w-4 h-4 text-yellow-400" />
                  <p className="text-sm text-yellow-300">
                    Alterando de <strong>dia {diaOriginal}</strong> para{' '}
                    <strong>dia {diaLimite}</strong>
                  </p>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className={`gap-2 ${
                  hasChanges
                    ? 'btn-primary'
                    : 'px-4 py-2 rounded-lg bg-dark-700 text-dark-500 cursor-not-allowed inline-flex items-center'
                }`}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Alteração
              </button>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-700 flex items-center gap-3">
            <History className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-white">
              Histórico de Alterações
            </h2>
          </div>

          {logsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-dark-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="px-4 py-8 text-center text-dark-400 text-sm">
              Nenhuma alteração registrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700 text-left">
                    <th className="px-4 py-3 text-dark-400 font-medium">
                      Data/Hora
                    </th>
                    <th className="px-4 py-3 text-dark-400 font-medium">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-dark-400 font-medium">
                      Anterior
                    </th>
                    <th className="px-4 py-3 text-dark-400 font-medium">
                      Novo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-dark-800 hover:bg-dark-700/30"
                    >
                      <td className="px-4 py-3 text-dark-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-dark-500" />
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-dark-500" />
                          {log.usuario_nome || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-400/10 text-red-400">
                          Dia {log.valor_anterior || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-400/10 text-green-400">
                          Dia {log.valor_novo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
