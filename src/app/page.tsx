export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Users,
  Gift,
  Star,
  ArrowRight,
  Newspaper,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { getImageUrl, truncateText, formatDate } from '@/lib/utils';
import HeroSlider from '@/components/home/HeroSlider';
import EmpresaCard from '@/components/empresas/EmpresaCard';
import NoticiaCard from '@/components/noticias/NoticiaCard';
import {
  FadeInSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/Animations';
import type { Empresa, Noticia } from '@prisma/client';

async function getHomeData() {
  const [empresas, noticias] = await Promise.all([
    prisma.empresa.findMany({
      where: { ativo: 's' },
      orderBy: { empresa: 'asc' },
      take: 8,
    }),
    prisma.noticia.findMany({
      orderBy: { data: 'desc' },
      take: 3,
    }),
  ]);

  return { slides: [
    {
      id: 1,
      titulo: 'Clube da Decoração e Arquitetura',
      subtitulo: 'Conectando profissionais e empresas com benefícios exclusivos.',
      imagem: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80&auto=format&fit=crop',
      link: '/cadastro',
    },
    {
      id: 2,
      titulo: 'Ambientes que Inspiram',
      subtitulo: 'Descubra as melhores empresas de decoração e acabamentos.',
      imagem: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80&auto=format&fit=crop',
      link: '/empresas',
    },
    {
      id: 3,
      titulo: 'Programa de Fidelidade',
      subtitulo: 'Acumule pontos em suas compras e troque por prêmios exclusivos.',
      imagem: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80&auto=format&fit=crop',
      link: '/o-clube',
    },
  ], empresas, noticias };
}

export default async function HomePage() {
  const { slides, empresas, noticias } = await getHomeData();

  const features = [
    {
      icon: Building2,
      title: 'Empresas Parceiras',
      description:
        'As melhores lojas de decoração e acabamentos reunidas em um só lugar.',
    },
    {
      icon: Users,
      title: 'Profissionais Cadastrados',
      description:
        'Arquitetos, designers e decoradores com benefícios exclusivos.',
    },
    {
      icon: Gift,
      title: 'Programa de Pontos',
      description:
        'Acumule pontos em suas compras e troque por prêmios incríveis.',
    },
    {
      icon: Star,
      title: 'Showroom Virtual',
      description:
        'Conheça os produtos e lançamentos de nossas empresas parceiras.',
    },
  ];

  return (
    <>
      {/* Hero Slider */}
      {slides.length > 0 ? (
        <HeroSlider slides={slides} />
      ) : (
        <div className="h-[85vh] min-h-[600px] relative bg-dark-800 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(199,153,84,0.12),transparent_60%)]" />
          <div className="relative text-center px-4">
            <h1 className="text-5xl sm:text-7xl font-display font-bold text-white mb-4">
              Clube <span className="gradient-text">CDA</span>
            </h1>
            <p className="text-xl text-dark-300 max-w-xl mx-auto mb-8">
              Decoração & Arquitetura — Conectando profissionais e empresas com
              benefícios exclusivos.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/cadastro" className="btn-primary">
                Cadastre-se
              </Link>
              <Link href="/o-clube" className="btn-outline">
                Conheça o Clube
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(199,153,84,0.05),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat) => (
              <StaggerItem key={feat.title}>
                <div className="glass rounded-xl p-6 text-center card-hover h-full">
                  <div className="w-14 h-14 rounded-xl bg-brand-400/10 flex items-center justify-center mx-auto mb-4">
                    <feat.icon className="w-7 h-7 text-brand-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-dark-400">{feat.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Empresas Parceiras */}
      <section className="py-20 bg-dark-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                Empresas <span className="gradient-text">Parceiras</span>
              </h2>
              <p className="text-dark-400 max-w-xl mx-auto">
                Conheça as empresas que fazem parte do CDA e oferecem condições
                exclusivas para profissionais.
              </p>
              <div className="mt-4 gold-line max-w-xs mx-auto" />
            </div>
          </FadeInSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

          <FadeInSection className="text-center mt-10">
            <Link href="/empresas" className="btn-outline gap-2">
              Ver todas as empresas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* Últimas Notícias */}
      {noticias.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInSection>
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                    Últimas <span className="gradient-text">Notícias</span>
                  </h2>
                  <p className="text-dark-400">
                    Fique por dentro das novidades do mundo da decoração.
                  </p>
                </div>
                <Link
                  href="/noticias"
                  className="hidden sm:flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Ver todas
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeInSection>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            <div className="text-center mt-8 sm:hidden">
              <Link href="/noticias" className="btn-outline gap-2">
                Ver todas as notícias
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/30 via-dark-900 to-brand-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(199,153,84,0.1),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <FadeInSection>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white mb-6 leading-tight">
              Faça parte do Clube
              <br />
              <span className="gradient-text">CDA</span>
            </h2>
            <p className="text-lg text-dark-300 mb-8 max-w-2xl mx-auto">
              Cadastre-se como profissional ou escritório e tenha acesso a
              benefícios exclusivos, programa de pontos e muito mais.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/cadastro?tipo=profissional"
                className="btn-primary text-lg px-8 py-4"
              >
                Sou Profissional
              </Link>
              <Link
                href="/cadastro?tipo=escritorio"
                className="btn-outline text-lg px-8 py-4"
              >
                Sou Escritório
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>
    </>
  );
}
