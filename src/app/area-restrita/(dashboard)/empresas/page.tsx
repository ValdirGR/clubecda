import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Star, ShoppingBag, Tag, TrendingUp } from 'lucide-react';

export default async function EmpresaDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'empresa') redirect('/area-restrita');

  const empresaId = parseInt(session.user.id);

  const [empresa, pontosData, showroomCount, promoCount] = await Promise.all([
    prisma.empresa.findUnique({ where: { id: empresaId } }),
    prisma.ponto.findMany({ where: { id_empresa: empresaId }, select: { pontos: true } }),
    prisma.showroom.count({ where: { empresa: empresaId } }),
    prisma.promocao.count({ where: { empresa: empresaId } }),
  ]);

  const totalPontos = pontosData.reduce((acc: number, p: { pontos: any }) => acc + (Number(p.pontos) || 0), 0);

  const stats = [
    { label: 'Pontos Concedidos', value: totalPontos, icon: Star, color: 'text-yellow-400' },
    { label: 'Itens no Showroom', value: showroomCount, icon: ShoppingBag, color: 'text-blue-400' },
    { label: 'Promoções Ativas', value: promoCount, icon: Tag, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1">
          Olá, {empresa?.empresa || session.user.name}!
        </h1>
        <p className="text-dark-400">Painel da Empresa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <TrendingUp className="w-4 h-4 text-dark-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-dark-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a href="/area-restrita/empresas/pontos" className="btn-outline text-center py-3">
            Registrar Pontos
          </a>
          <a href="/area-restrita/empresas/showroom" className="btn-outline text-center py-3">
            Gerenciar Showroom
          </a>
          <a href="/area-restrita/empresas/promocoes" className="btn-outline text-center py-3">
            Nova Promoção
          </a>
        </div>
      </div>
    </div>
  );
}
