export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { PageHeader, FadeInSection, StaggerContainer, StaggerItem } from '@/components/ui/Animations';
import { User2, MapPin, Phone, Mail } from 'lucide-react';
import type { Profissional } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Profissionais',
  description: 'Profissionais de arquitetura, decoração e design de interiores cadastrados no CDA.',
};

async function getProfissionais() {
  return prisma.profissional.findMany({
    where: { ativo: 's' },
    orderBy: { nome: 'asc' },
  });
}

export default async function ProfissionaisPage() {
  const profissionais = await getProfissionais();

  return (
    <>
      <PageHeader
        title="Profissionais"
        subtitle="Arquitetos, designers e decoradores que fazem parte do CDA"
      />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {profissionais.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profissionais.map((prof: Profissional) => (
                <StaggerItem key={prof.id}>
                  <div className="glass rounded-xl p-6 card-hover">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-400/10 flex items-center justify-center shrink-0">
                        <User2 className="w-6 h-6 text-brand-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {prof.nome}
                        </h3>
                        {prof.crea && (
                          <p className="text-sm text-brand-400">
                            {prof.crea}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-dark-400">
                      {(prof.cidade || prof.uf) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-dark-500" />
                          <span>{[prof.cidade, prof.uf].filter(Boolean).join(' - ')}</span>
                        </div>
                      )}
                      {prof.telefone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-dark-500" />
                          <span>{prof.telefone}</span>
                        </div>
                      )}
                      {prof.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-dark-500" />
                          <span className="truncate">{prof.email}</span>
                        </div>
                      )}
                    </div>

                    {prof.empresa && (
                      <div className="mt-3 pt-3 border-t border-dark-700">
                        <p className="text-xs text-dark-500">
                          Escritório: <span className="text-dark-300">{prof.empresa}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <FadeInSection className="text-center py-20">
              <p className="text-dark-400 text-lg">Nenhum profissional cadastrado no momento.</p>
            </FadeInSection>
          )}
        </div>
      </section>
    </>
  );
}
