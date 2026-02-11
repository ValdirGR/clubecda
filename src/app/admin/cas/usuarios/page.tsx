'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  X,
  Check,
  Loader2,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Modulo {
  modulo_id: number;
  modulo_nome: string;
  modulo_nivel: string;
}

interface AcessoMod {
  modulo_id: number;
  modulo: Modulo;
}

interface Usuario {
  usuario_id: number;
  usuario_nome: string;
  usuario_user: string;
  usuario_tipo: string;
  acessos: AcessoMod[];
}

interface UsuarioForm {
  nome: string;
  login: string;
  senha: string;
  confirmSenha: string;
  modulosUser: number[];
  modulosAdmin: number[];
}

const initialForm: UsuarioForm = {
  nome: '',
  login: '',
  senha: '',
  confirmSenha: '',
  modulosUser: [],
  modulosAdmin: [],
};

export default function CasUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modulos, setModulos] = useState<{ modulosUser: Modulo[]; modulosAdmin: Modulo[] }>({
    modulosUser: [],
    modulosAdmin: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UsuarioForm>(initialForm);
  const [saving, setSaving] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/cas/usuarios?${params}`);
      const data = await res.json();
      setUsuarios(data.usuarios || []);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchModulos = useCallback(async () => {
    try {
      const res = await fetch('/api/cas/modulos');
      const data = await res.json();
      setModulos(data);
    } catch {
      console.error('Erro ao carregar módulos');
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    fetchModulos();
  }, [fetchModulos]);

  const openNew = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (user: Usuario) => {
    setEditingId(user.usuario_id);
    setForm({
      nome: user.usuario_nome || '',
      login: user.usuario_user || '',
      senha: '',
      confirmSenha: '',
      modulosUser: user.acessos
        .filter((a) => a.modulo.modulo_nivel === 'user')
        .map((a) => a.modulo_id),
      modulosAdmin: user.acessos
        .filter((a) => a.modulo.modulo_nivel === 'admin')
        .map((a) => a.modulo_id),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.login) {
      toast.error('Nome e login são obrigatórios');
      return;
    }

    if (!editingId && !form.senha) {
      toast.error('Senha é obrigatória para novos usuários');
      return;
    }

    if (form.senha && form.senha !== form.confirmSenha) {
      toast.error('As senhas não conferem');
      return;
    }

    setSaving(true);
    try {
      const body = {
        nome: form.nome,
        login: form.login,
        senha: form.senha || undefined,
        modulosUser: form.modulosUser.map(String),
        modulosAdmin: form.modulosAdmin.map(String),
      };

      const res = editingId
        ? await fetch(`/api/cas/usuarios/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/cas/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar');
        return;
      }

      toast.success(editingId ? 'Usuário atualizado!' : 'Usuário criado!');
      setShowModal(false);
      fetchUsuarios();
    } catch {
      toast.error('Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) return;

    try {
      const res = await fetch(`/api/cas/usuarios/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao excluir');
        return;
      }

      toast.success('Usuário excluído!');
      fetchUsuarios();
    } catch {
      toast.error('Erro ao excluir usuário');
    }
  };

  const toggleModulo = (tipo: 'user' | 'admin', moduloId: number) => {
    const key = tipo === 'user' ? 'modulosUser' : 'modulosAdmin';
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(moduloId)
        ? prev[key].filter((id) => id !== moduloId)
        : [...prev[key], moduloId],
    }));
  };

  const capitalize = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

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
                Usuários do Sistema
              </h1>
              <p className="text-dark-400 text-sm">
                Gerenciamento de usuários e permissões do CAS
              </p>
            </div>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-brand-400 text-dark-900 rounded-lg font-medium text-sm hover:bg-brand-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>

        {/* Search */}
        <div className="glass rounded-xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou login..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white placeholder:text-dark-500 focus:border-brand-400 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700 text-left">
                  <th className="px-4 py-3 text-dark-400 font-medium">Cód</th>
                  <th className="px-4 py-3 text-dark-400 font-medium">Nome</th>
                  <th className="px-4 py-3 text-dark-400 font-medium">
                    Login
                  </th>
                  <th className="px-4 py-3 text-dark-400 font-medium text-center">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-dark-400 font-medium text-center">
                    Módulos
                  </th>
                  <th className="px-4 py-3 text-dark-400 font-medium text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-dark-500"
                    >
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando...
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-dark-500"
                    >
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  usuarios.map((user) => (
                    <tr
                      key={user.usuario_id}
                      className="border-b border-dark-800 hover:bg-dark-700/30"
                    >
                      <td className="px-4 py-3 text-dark-500 font-mono">
                        {String(user.usuario_id).padStart(5, '0')}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        {user.usuario_nome}
                      </td>
                      <td className="px-4 py-3 text-dark-300">
                        {user.usuario_user}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            user.usuario_tipo === 'admin'
                              ? 'text-purple-400 bg-purple-400/10'
                              : 'text-blue-400 bg-blue-400/10'
                          }`}
                        >
                          {user.usuario_tipo === 'admin' ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          {user.usuario_tipo === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-dark-400">
                          {user.usuario_tipo === 'admin'
                            ? 'Todos'
                            : `${user.acessos?.length || 0} módulos`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-brand-400 hover:bg-dark-700 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.usuario_tipo !== 'admin' && (
                            <button
                              onClick={() =>
                                handleDelete(
                                  user.usuario_id,
                                  user.usuario_nome || ''
                                )
                              }
                              className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-dark-700 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-brand-400 text-dark-900'
                      : 'text-dark-400 hover:text-white hover:bg-dark-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
            <div className="sticky top-0 bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-display font-bold text-white">
                {editingId ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Dados básicos */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider">
                  Dados do Usuário
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-dark-400 mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, nome: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white placeholder:text-dark-500 focus:border-brand-400 focus:outline-none"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-400 mb-1.5">
                      Login *
                    </label>
                    <input
                      type="text"
                      value={form.login}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, login: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white placeholder:text-dark-500 focus:border-brand-400 focus:outline-none"
                      placeholder="Nome de usuário"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-400 mb-1.5">
                      Senha {editingId ? '(deixe vazio para manter)' : '*'}
                    </label>
                    <input
                      type="password"
                      value={form.senha}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, senha: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white placeholder:text-dark-500 focus:border-brand-400 focus:outline-none"
                      placeholder="••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-400 mb-1.5">
                      Confirme a Senha
                    </label>
                    <input
                      type="password"
                      value={form.confirmSenha}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          confirmSenha: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 bg-dark-700/50 border border-dark-600 rounded-lg text-sm text-white placeholder:text-dark-500 focus:border-brand-400 focus:outline-none"
                      placeholder="••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Permissões - Módulos de Usuário */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Módulos de Usuário
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {modulos.modulosUser.map((mod) => (
                    <label
                      key={mod.modulo_id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${
                        form.modulosUser.includes(mod.modulo_id)
                          ? 'bg-blue-400/10 border border-blue-400/30'
                          : 'bg-dark-700/30 border border-dark-600/50 hover:border-dark-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.modulosUser.includes(mod.modulo_id)}
                        onChange={() => toggleModulo('user', mod.modulo_id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          form.modulosUser.includes(mod.modulo_id)
                            ? 'bg-blue-400 border-blue-400'
                            : 'border-dark-500'
                        }`}
                      >
                        {form.modulosUser.includes(mod.modulo_id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-dark-200">
                        {capitalize(mod.modulo_nome || '')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Permissões - Módulos Admin */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Módulos de Administrador
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {modulos.modulosAdmin.map((mod) => (
                    <label
                      key={mod.modulo_id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${
                        form.modulosAdmin.includes(mod.modulo_id)
                          ? 'bg-purple-400/10 border border-purple-400/30'
                          : 'bg-dark-700/30 border border-dark-600/50 hover:border-dark-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.modulosAdmin.includes(mod.modulo_id)}
                        onChange={() => toggleModulo('admin', mod.modulo_id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          form.modulosAdmin.includes(mod.modulo_id)
                            ? 'bg-purple-400 border-purple-400'
                            : 'border-dark-500'
                        }`}
                      >
                        {form.modulosAdmin.includes(mod.modulo_id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-dark-200">
                        {capitalize(mod.modulo_nome || '')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-dark-800 border-t border-dark-700 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-dark-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-brand-400 text-dark-900 rounded-lg font-medium text-sm hover:bg-brand-300 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
