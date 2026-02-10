export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import NoticiaCard from '@/components/noticias/NoticiaCard';
import {
  PageHeader,
  FadeInSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/Animations';
import type { Noticia } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Notícias',
  description: 'Fique por dentro das últimas novidades do mundo da decoração e arquitetura.',
};

async function getNoticias() {
  return prisma.noticia.findMany({
    orderBy: { data: 'desc' },
  });
}

export default async function NoticiasPage() {
  const noticias = await getNoticias();

  return (
    <>
      <PageHeader
        title="Notícias"
        subtitle="Fique por dentro das novidades do mundo da decoração e arquitetura"
      />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {noticias.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticias.map((noticia: Noticia) => (
                <StaggerItem key={noticia.id}>
                  <NoticiaCard
                    id={noticia.id}
                    titulo={noticia.titulo || ''}
                    data={noticia.data}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <FadeInSection className="text-center py-20">
              <p className="text-dark-400 text-lg">
                Nenhuma notícia publicada no momento.
              </p>
            </FadeInSection>
          )}
        </div>
      </section>
    </>
  );
}
