import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Star, Building2, TrendingUp } from 'lucide-react';

export default async function EscritorioDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'escritorio') redirect('/area-restrita');

  const escritorioId = parseInt(session.user.id);

  const [escritorio, pontosData] = await Promise.all([
    prisma.escritorio.findUnique({ where: { id: escritorioId } }),
    prisma.ponto.findMany({ where: { id_profissional: escritorioId }, select: { pontos: true } }),
  ]);

  const totalPontos = pontosData.reduce((acc: number, p: { pontos: any }) => acc + (Number(p.pontos) || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1">
          Olá, {escritorio?.empresa || session.user.name}!
        </h1>
        <p className="text-dark-400">Painel do Escritório</p>
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
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {escritorio?.nome_contato || '-'}
          </p>
          <p className="text-xs text-dark-400 mt-1">Responsável</p>
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/area-restrita/escritorios/pontos" className="btn-outline text-center py-3">
            Ver Pontos
          </a>
          <a href="/area-restrita/escritorios/empresas" className="btn-outline text-center py-3">
            Minhas Empresas
          </a>
        </div>
      </div>
    </div>
  );
}
