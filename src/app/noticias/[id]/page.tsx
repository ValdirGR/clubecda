export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Share2 } from 'lucide-react';
import prisma from '@/lib/prisma';
import { formatDate, getImageUrl } from '@/lib/utils';
import { FadeInSection } from '@/components/ui/Animations';
import type { FotoNoticia, Noticia } from '@prisma/client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const noticia = await prisma.noticia.findUnique({ where: { id: parseInt(id) } });
  if (!noticia) return { title: 'Notícia não encontrada' };
  return {
    title: noticia.titulo,
    description: noticia.titulo || 'Notícia CDA',
  };
}

async function getNoticiaData(id: number) {
  const [noticia, fotos, recentes] = await Promise.all([
    prisma.noticia.findUnique({ where: { id } }),
    prisma.fotoNoticia.findMany({ where: { id_evento: id } }),
    prisma.noticia.findMany({
      where: { id: { not: id } },
      orderBy: { data: 'desc' },
      take: 4,
    }),
  ]);

  return { noticia, fotos, recentes };
}

export default async function NoticiaPage({ params }: Props) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) notFound();

  const { noticia, fotos, recentes } = await getNoticiaData(numId);
  if (!noticia) notFound();

  return (
    <div className="pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/noticias"
          className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-brand-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Notícias
        </Link>

        <FadeInSection>
          <article>
            {/* Header */}
            <header className="mb-8">
              {noticia.data && (
                <div className="flex items-center gap-1.5 text-sm text-dark-500 mb-3">
                  <Calendar className="w-4 h-4" />
                  <time>{formatDate(noticia.data)}</time>
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4 leading-tight">
                {noticia.titulo}
              </h1>
              <div className="mt-6 gold-line" />
            </header>

            {/* Content */}
            {noticia.texto && (
              <div
                className="prose-dark mb-10"
                dangerouslySetInnerHTML={{ __html: noticia.texto }}
              />
            )}

            {/* Photo Gallery */}
            {fotos.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-display font-bold text-white mb-4">
                  Galeria de Fotos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {fotos.map((foto: FotoNoticia) => (
                    <div key={foto.id} className="relative aspect-square rounded-lg overflow-hidden bg-dark-800">
                      <Image
                        src={getImageUrl('noticias', foto.foto || '')}
                        alt={foto.descricao || 'Foto'}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width:640px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </FadeInSection>

        {/* Mais notícias */}
        {recentes.length > 0 && (
          <FadeInSection>
            <div className="mt-16 pt-10 border-t border-dark-800">
              <h3 className="text-2xl font-display font-bold text-white mb-6">
                Outras Notícias
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentes.map((n: Noticia) => (
                  <Link
                    key={n.id}
                    href={`/noticias/${n.id}`}
                    className="glass rounded-lg p-4 flex gap-4 card-hover group"
                  >
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors line-clamp-2">
                        {n.titulo}
                      </h4>
                      {n.data && (
                        <p className="text-xs text-dark-500 mt-1">
                          {formatDate(n.data)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </FadeInSection>
        )}
      </div>
    </div>
  );
}
