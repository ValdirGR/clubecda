export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Users, Building2, Gift } from 'lucide-react';
import prisma from '@/lib/prisma';
import { PageHeader, FadeInSection, StaggerContainer, StaggerItem } from '@/components/ui/Animations';

export const metadata: Metadata = {
  title: 'O Clube',
  description: 'Conheça o CDA – Clube da Decoração e Arquitetura. Um clube de fidelidade exclusivo para profissionais e empresas do setor.',
};

async function getOClubeData() {
  const informativo = await prisma.informativo.findFirst({
    orderBy: { data: 'desc' },
  });

  return { informativo };
}

export default async function OClubePage() {
  const { informativo } = await getOClubeData();

  const benefits = [
    { icon: Gift, title: 'Programa de Pontos', desc: 'Acumule pontos a cada compra nas lojas parceiras e troque por prêmios.' },
    { icon: Building2, title: 'Empresas Selecionadas', desc: 'Acesso a empresas de decoração e acabamentos criteriosamente selecionadas.' },
    { icon: Users, title: 'Rede Profissional', desc: 'Faça networking com outros profissionais do setor.' },
    { icon: CheckCircle2, title: 'Condições Exclusivas', desc: 'Descontos especiais e condições diferenciadas de pagamento.' },
  ];

  return (
    <>
      <PageHeader
        title="O Clube"
        subtitle="Conectando profissionais e empresas do mundo da decoração e arquitetura"
      />

      {/* About section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeInSection>
              <div className="relative">
                <div className="glass rounded-2xl overflow-hidden aspect-[4/3]">
                  <Image
                    src={'/images/placeholder.svg'}
                    alt="O Clube CDA"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-400/10 rounded-2xl -z-10" />
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-brand-400/5 rounded-2xl -z-10" />
              </div>
            </FadeInSection>

            <FadeInSection delay={0.2}>
              <h2 className="text-3xl font-display font-bold text-white mb-6">
                O que é o <span className="gradient-text">CDA</span>?
              </h2>
              {informativo?.descricao ? (
                <div
                  className="prose-dark"
                  dangerouslySetInnerHTML={{ __html: informativo.descricao }}
                />
              ) : (
                <div className="space-y-4 text-dark-300 leading-relaxed">
                  <p>
                    O CDA – Clube da Decoração e Arquitetura é um programa de fidelidade
                    que conecta profissionais do setor de decoração, arquitetura e design
                    de interiores a empresas parceiras que oferecem produtos de alta
                    qualidade.
                  </p>
                  <p>
                    Nosso objetivo é criar um ecossistema de benefícios mútuos, onde
                    profissionais cadastrados obtêm condições exclusivas de compra e
                    acumulam pontos que podem ser trocados por prêmios. As empresas
                    parceiras, por sua vez, ganham visibilidade e acesso a um público
                    qualificado.
                  </p>
                  <p>
                    O cadastro é gratuito e aberto a profissionais autônomos e escritórios
                    de arquitetura e design de interiores.
                  </p>
                </div>
              )}
              <div className="mt-8 flex gap-4 flex-wrap">
                <Link href="/cadastro" className="btn-primary">
                  Cadastre-se Agora
                </Link>
                <Link href="/empresas" className="btn-outline">
                  Ver Empresas
                </Link>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-dark-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                Benefícios <span className="gradient-text">Exclusivos</span>
              </h2>
              <div className="mt-4 gold-line max-w-xs mx-auto" />
            </div>
          </FadeInSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map((b) => (
              <StaggerItem key={b.title}>
                <div className="glass rounded-xl p-6 card-hover flex gap-5">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-brand-400/10 flex items-center justify-center">
                    <b.icon className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{b.title}</h3>
                    <p className="text-sm text-dark-400">{b.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                Como <span className="gradient-text">Funciona</span>
              </h2>
              <div className="mt-4 gold-line max-w-xs mx-auto" />
            </div>
          </FadeInSection>

          <div className="space-y-0">
            {[
              { step: '01', title: 'Cadastre-se', desc: 'Preencha o formulário online como profissional ou escritório.' },
              { step: '02', title: 'Aprovação', desc: 'Seu cadastro será analisado e aprovado pela equipe do CDA.' },
              { step: '03', title: 'Compre nas Parceiras', desc: 'Realize compras nas empresas parceiras do clube.' },
              { step: '04', title: 'Acumule Pontos', desc: 'A cada compra realizada, acumule pontos no seu saldo.' },
              { step: '05', title: 'Troque por Prêmios', desc: 'Troque seus pontos acumulados por prêmios exclusivos.' },
            ].map((item, i) => (
              <FadeInSection key={item.step} delay={i * 0.1}>
                <div className="flex items-start gap-6 py-6 border-b border-dark-800 last:border-0">
                  <span className="text-4xl font-display font-bold gradient-text shrink-0 w-14">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-dark-400">{item.desc}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
