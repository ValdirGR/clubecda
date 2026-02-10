export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ArrowLeft,
  Tag,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { getImageUrl } from '@/lib/utils';
import {
  FadeInSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/Animations';
import type { Showroom, Promocao } from '@prisma/client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const empresa = await prisma.empresa.findUnique({
    where: { id: parseInt(id) },
  });
  if (!empresa) return { title: 'Empresa não encontrada' };
  return {
    title: empresa.empresa,
    description: empresa.texto || `Conheça ${empresa.empresa} no CDA.`,
  };
}

async function getEmpresaData(id: number) {
  const [empresa, showrooms, promocoes] = await Promise.all([
    prisma.empresa.findUnique({ where: { id } }),
    prisma.showroom.findMany({
      where: { empresa: id },
      take: 12,
    }),
    prisma.promocao.findMany({
      where: { empresa: id },
      take: 6,
    }),
  ]);

  return { empresa, showrooms, promocoes };
}

export default async function EmpresaPage({ params }: Props) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) notFound();

  const { empresa, showrooms, promocoes } = await getEmpresaData(numId);
  if (!empresa || empresa.ativo !== 's') notFound();

  return (
    <>
      {/* Hero */}
      <div className="relative pt-24 pb-16 bg-dark-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(199,153,84,0.08),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Link
            href="/empresas"
            className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-brand-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para Empresas
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo */}
            <div className="w-40 h-40 shrink-0 glass rounded-2xl overflow-hidden flex items-center justify-center p-4">
              {empresa.foto ? (
                <Image
                  src={getImageUrl('empresas', empresa.foto)}
                  alt={empresa.empresa}
                  width={160}
                  height={160}
                  className="object-contain"
                />
              ) : (
                <span className="text-5xl font-display text-dark-600">
                  {empresa.empresa.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                {empresa.empresa}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Descrição */}
        {empresa.texto && (
          <FadeInSection>
            <div className="glass rounded-xl p-8">
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                Sobre a Empresa
              </h2>
              <div
                className="prose-dark"
                dangerouslySetInnerHTML={{ __html: empresa.texto }}
              />
            </div>
          </FadeInSection>
        )}

        {/* Showroom */}
        {showrooms.length > 0 && (
          <FadeInSection>
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Showroom
            </h2>
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {showrooms.map((item: Showroom) => (
                <StaggerItem key={item.id}>
                  <div className="glass rounded-xl overflow-hidden card-hover group">
                    <div className="relative aspect-square bg-dark-800">
                      {item.foto ? (
                        <Image
                          src={getImageUrl('showroom', item.foto)}
                          alt={item.descricao || 'Showroom'}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-dark-600">
                          Sem imagem
                        </div>
                      )}
                    </div>
                    {item.descricao && (
                      <div className="p-3">
                        <h4 className="text-sm font-medium text-white truncate">
                          {item.descricao}
                        </h4>
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </FadeInSection>
        )}

        {/* Promoções */}
        {promocoes.length > 0 && (
          <FadeInSection>
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <Tag className="w-6 h-6 text-brand-400" />
              Promoções
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {promocoes.map((promo: Promocao) => (
                <div
                  key={promo.id}
                  className="glass rounded-xl overflow-hidden card-hover"
                >
                  {promo.foto && (
                    <div className="relative h-48">
                      <Image
                        src={getImageUrl('promocoes', promo.foto)}
                        alt={promo.titulo || 'Promoção'}
                        fill
                        className="object-cover"
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {promo.titulo}
                    </h4>
                    {promo.texto && (
                      <div
                        className="text-sm text-dark-400"
                        dangerouslySetInnerHTML={{ __html: promo.texto }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FadeInSection>
        )}
      </div>
    </>
  );
}
