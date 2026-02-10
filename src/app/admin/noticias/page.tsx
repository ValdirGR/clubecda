import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function AdminNoticiasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'user'].includes(session.user.role)) {
    redirect('/area-restrita');
  }

  const noticias = await prisma.noticia.findMany({
    orderBy: { data: 'desc' },
  });

  return (
    <div className="min-h-screen pt-24 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="btn-ghost"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Notícias</h1>
            <p className="text-dark-400 text-sm">{noticias.length} notícias cadastradas</p>
          </div>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700 text-left">
                  <th className="px-4 py-3 text-dark-400 font-medium">ID</th>
                  <th className="px-4 py-3 text-dark-400 font-medium">Título</th>
                  <th className="px-4 py-3 text-dark-400 font-medium">Data</th>
                  <th className="px-4 py-3 text-dark-400 font-medium text-center">Publicado</th>
                </tr>
              </thead>
              <tbody>
                {noticias.map((n) => (
                  <tr key={n.id} className="border-b border-dark-800 hover:bg-dark-700/30">
                    <td className="px-4 py-3 text-dark-500">{n.id}</td>
                    <td className="px-4 py-3 text-white font-medium max-w-md truncate">{n.titulo}</td>
                    <td className="px-4 py-3 text-dark-300">{formatDate(n.data)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Publicado
                        </span>
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
