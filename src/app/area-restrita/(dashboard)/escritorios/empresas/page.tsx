import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import EmpresaCard from '@/components/empresas/EmpresaCard';
import type { Empresa } from '@prisma/client';

export default async function EscritorioEmpresasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'escritorio') redirect('/area-restrita');

  const empresas = await prisma.empresa.findMany({
    where: { ativo: 's' },
    orderBy: { empresa: 'asc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-white">Empresas Parceiras</h1>
      <p className="text-dark-400 text-sm">Empresas parceiras do CDA onde você pode acumular pontos.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {empresas.map((emp: Empresa) => (
          <EmpresaCard
            key={emp.id}
            id={emp.id}
            nome={emp.empresa}
            texto={emp.texto}
            foto={emp.foto}
          />
        ))}
      </div>
    </div>
  );
}
