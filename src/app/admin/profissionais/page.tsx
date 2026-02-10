import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';
import type { Profissional } from '@prisma/client';

export default async function AdminProfissionaisPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    redirect('/area-restrita');
  }

  const profissionais = await prisma.profissional.findMany({
    orderBy: { nome: 'asc' },
  });

  return (
    <div className="min-h-screen pt-24 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="btn-ghost"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Profissionais</h1>
            <p className="text-dark-400 text-sm">{profissionais.length} profissionais cadastrados</p>
          </div>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700 text-left">
                  <th className="px-4 py-3 text-dark-400 font-medium">ID</th>
                  <th className="px-4 py-3 text-dark-400 font-medium">Nome</th>
                  <th className="px-4 py-3 text-dark-400 font-medium">CREA/Registro</th>
                  <th className="px-4 py-3 text-dark-400 font-medium">E-mail</th>
                  <th className="px-4 py-3 text-dark-400 font-medium">Cidade</th>
                  <th className="px-4 py-3 text-dark-400 font-medium text-center">Ativo</th>
                </tr>
              </thead>
              <tbody>
                {profissionais.map((prof: Profissional) => (
                  <tr key={prof.id} className="border-b border-dark-800 hover:bg-dark-700/30">
                    <td className="px-4 py-3 text-dark-500">{prof.id}</td>
                    <td className="px-4 py-3 text-white font-medium">{prof.nome}</td>
                    <td className="px-4 py-3 text-dark-300">{prof.crea || '-'}</td>
                    <td className="px-4 py-3 text-dark-300">{prof.email || '-'}</td>
                    <td className="px-4 py-3 text-dark-300">{prof.cidade || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {prof.ativo === 's' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                          <X className="w-3 h-3" /> Inativo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
