import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Shield,
  BarChart3,
  Activity,
  Clock,
  UserCheck,
} from 'lucide-react';

export default async function CasDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    redirect('/area-restrita');
  }

  const [
    totalUsuarios,
    totalModulos,
    totalAcessos,
    ultimosAcessos,
  ] = await Promise.all([
    prisma.casUsuario.count(),
    prisma.casModulo.count(),
    prisma.casLogAcesso.count(),
    prisma.casLogAcesso.findMany({
      include: {
        usuario: {
          select: { usuario_nome: true, usuario_tipo: true },
        },
      },
      orderBy: { log_acesso_login: 'desc' },
      take: 5,
    }),
  ]);

  const stats = [
    { label: 'Usuários', value: totalUsuarios, icon: Users, color: 'text-blue-400', href: '/admin/cas/usuarios' },
    { label: 'Módulos', value: totalModulos, icon: Shield, color: 'text-purple-400', href: '/admin/cas/usuarios' },
    { label: 'Total de Acessos', value: totalAcessos, icon: Activity, color: 'text-green-400', href: '/admin/cas/acessos' },
  ];

  const modules = [
    {
      label: 'Usuários',
      description: 'Gerenciar usuários do sistema, permissões e níveis de acesso',
      icon: Users,
      href: '/admin/cas/usuarios',
    },
    {
      label: 'Log de Acessos',
      description: 'Visualizar histórico de logins, logouts e endereços IP',
      icon: Clock,
      href: '/admin/cas/acessos',
    },
    {
      label: 'Relatórios',
      description: 'Relatórios por empresas, escritórios, profissionais e geral',
      icon: BarChart3,
      href: '/admin/cas/relatorios',
    },
  ];

  return (
    <div className="min-h-screen pt-24 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-1">
              CAS - Centro de Administração
            </h1>
            <p className="text-dark-400">
              Gerenciamento de usuários, permissões, acessos e relatórios
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="glass rounded-xl p-5 card-hover"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">
                {stat.value.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-dark-400 mt-1">{stat.label}</p>
            </Link>
          ))}
        </div>

        {/* Módulos */}
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-4">
            Módulos do CAS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {modules.map((mod) => (
              <Link
                key={mod.label}
                href={mod.href}
                className="glass rounded-xl p-6 card-hover group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-400/10 flex items-center justify-center shrink-0 group-hover:bg-brand-400/20 transition-colors">
                  <mod.icon className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">
                    {mod.label}
                  </h3>
                  <p className="text-xs text-dark-400 mt-0.5">
                    {mod.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Últimos acessos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-white">
              Últimos Acessos
            </h2>
            <Link
              href="/admin/cas/acessos"
              className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              Ver todos →
            </Link>
          </div>
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700 text-left">
                    <th className="px-4 py-3 text-dark-400 font-medium">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-dark-400 font-medium">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-dark-400 font-medium">
                      Login
                    </th>
                    <th className="px-4 py-3 text-dark-400 font-medium">
                      Logout
                    </th>
                    <th className="px-4 py-3 text-dark-400 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosAcessos.map((log) => (
                    <tr
                      key={log.log_acesso_id}
                      className="border-b border-dark-800 hover:bg-dark-700/30"
                    >
                      <td className="px-4 py-3 text-white font-medium">
                        {log.usuario?.usuario_nome || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3 text-dark-300">
                        {log.log_acesso_login
                          ? new Date(log.log_acesso_login).toLocaleString(
                              'pt-BR'
                            )
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-dark-300">
                        {log.log_acesso_logout
                          ? new Date(log.log_acesso_logout).toLocaleString(
                              'pt-BR'
                            )
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-dark-500 font-mono text-xs">
                        {log.log_acesso_IP || '-'}
                      </td>
                    </tr>
                  ))}
                  {ultimosAcessos.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-dark-500"
                      >
                        Nenhum acesso registrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
