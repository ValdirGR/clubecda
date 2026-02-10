export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import EmpresaCard from '@/components/empresas/EmpresaCard';
import {
  PageHeader,
  FadeInSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/Animations';
import type { Empresa } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Empresas Parceiras',
  description: 'Conheça todas as empresas parceiras do CDA – Clube da Decoração e Arquitetura.',
};

async function getEmpresas() {
  return prisma.empresa.findMany({
    where: { ativo: 's' },
    orderBy: { empresa: 'asc' },
  });
}

export default async function EmpresasPage() {
  const empresas = await getEmpresas();

  return (
    <>
      <PageHeader
        title="Empresas Parceiras"
        subtitle="As melhores empresas de decoração e acabamentos reunidas no CDA"
      />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {empresas.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {empresas.map((emp: Empresa) => (
                <StaggerItem key={emp.id}>
                  <EmpresaCard
                    id={emp.id}
                    nome={emp.empresa}
                    texto={emp.texto}
                    foto={emp.foto}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <FadeInSection className="text-center py-20">
              <p className="text-dark-400 text-lg">
                Nenhuma empresa cadastrada no momento.
              </p>
            </FadeInSection>
          )}
        </div>
      </section>
    </>
  );
}
