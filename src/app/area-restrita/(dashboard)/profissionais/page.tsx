import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Star, Building2, TrendingUp, User2 } from 'lucide-react';
import type { Ponto } from '@prisma/client';

export default async function ProfissionalDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'profissional') redirect('/area-restrita');

  const profId = parseInt(session.user.id);

  const [profissional, pontosData, recentPontos] = await Promise.all([
    prisma.profissional.findUnique({ where: { id: profId } }),
    prisma.ponto.findMany({ where: { id_profissional: profId }, select: { pontos: true } }),
    prisma.ponto.findMany({
      where: { id_profissional: profId },
      orderBy: { data: 'desc' },
      take: 5,
    }),
  ]);

  const totalPontos = pontosData.reduce((acc: number, p: { pontos: any }) => acc + (Number(p.pontos) || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1">
          Olá, {profissional?.nome || session.user.name}!
        </h1>
        <p className="text-dark-400">Painel do Profissional</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Star className="w-5 h-5 text-yellow-400" />
            <TrendingUp className="w-4 h-4 text-dark-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            {totalPontos.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-dark-400 mt-1">Seus Pontos</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <User2 className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {profissional?.crea || 'Profissional'}
          </p>
          <p className="text-xs text-dark-400 mt-1">Profissão</p>
        </div>
      </div>

      {/* Últimos pontos */}
      {recentPontos.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Últimos Pontos</h2>
          <div className="space-y-3">
            {recentPontos.map((p: Ponto) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                <div className="text-sm text-dark-300">
                  {p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '-'}
                </div>
                <div className="text-sm font-semibold text-brand-400">
                  +{Number(p.pontos)} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/area-restrita/profissionais/pontos" className="btn-outline text-center py-3">
            Ver Todos os Pontos
          </a>
          <a href="/area-restrita/profissionais/empresas" className="btn-outline text-center py-3">
            Ver Empresas Parceiras
          </a>
        </div>
      </div>
    </div>
  );
}
