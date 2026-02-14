import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Star,
  Newspaper,
  Settings,
  BarChart3,
  CalendarDays,
} from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    redirect('/area-restrita');
  }

  const [empresasCount, escritoriosCount, profissionaisCount, noticiasCount] =
    await Promise.all([
      prisma.empresa.count(),
      prisma.escritorio.count(),
      prisma.profissional.count(),
      prisma.noticia.count(),
    ]);

  const stats = [
    { label: 'Empresas', value: empresasCount, icon: Building2, color: 'text-blue-400', href: '/admin/empresas' },
    { label: 'Escritórios', value: escritoriosCount, icon: Briefcase, color: 'text-purple-400', href: '/admin/escritorios' },
    { label: 'Profissionais', value: profissionaisCount, icon: Users, color: 'text-green-400', href: '/admin/profissionais' },
    { label: 'Notícias', value: noticiasCount, icon: Newspaper, color: 'text-orange-400', href: '/admin/noticias' },
  ];

  const modules = [
    { label: 'Empresas', description: 'Gerenciar empresas parceiras', icon: Building2, href: '/admin/empresas' },
    { label: 'Escritórios', description: 'Gerenciar escritórios cadastrados', icon: Briefcase, href: '/admin/escritorios' },
    { label: 'Profissionais', description: 'Gerenciar profissionais', icon: Users, href: '/admin/profissionais' },
    { label: 'Notícias', description: 'Publicar e gerenciar notícias', icon: Newspaper, href: '/admin/noticias' },
    { label: 'Pontos', description: 'Gerenciar programa de pontos', icon: Star, href: '/admin/pontos' },
    { label: 'Dia Limite Pontuação', description: 'Definir prazo mensal para pontuação', icon: CalendarDays, href: '/admin/dia-limite' },
    { label: 'Relatórios', description: 'Visualizar relatórios do sistema', icon: BarChart3, href: '/admin/relatorios' },
    { label: 'CAS', description: 'Centro de Administração: usuários, acessos e relatórios', icon: Settings, href: '/admin/cas' },
  ];

  return (
    <div className="min-h-screen pt-24 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">
            Painel Administrativo
          </h1>
          <p className="text-dark-400">Bem-vindo, {session.user.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href} className="glass rounded-xl p-5 card-hover">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-dark-400 mt-1">{stat.label}</p>
            </Link>
          ))}
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-4">Módulos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <p className="text-xs text-dark-400 mt-0.5">{mod.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
