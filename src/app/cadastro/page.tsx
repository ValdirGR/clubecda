'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import CadastroEscritorio from '@/components/forms/CadastroEscritorio';
import CadastroProfissional from '@/components/forms/CadastroProfissional';
import { PageHeader } from '@/components/ui/Animations';
import { cn } from '@/lib/utils';

function CadastroContent() {
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get('tipo');
  const [tab, setTab] = useState<'profissional' | 'escritorio'>(
    tipoParam === 'escritorio' ? 'escritorio' : 'profissional'
  );

  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab selector */}
        <div className="flex rounded-xl glass overflow-hidden mb-10">
          {(['profissional', 'escritorio'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-4 text-sm font-semibold transition-all duration-200',
                tab === t
                  ? 'bg-brand-400 text-dark-900'
                  : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
              )}
            >
              {t === 'profissional' ? 'Profissional' : 'Escritório'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="glass rounded-xl p-8">
          <h2 className="text-2xl font-display font-bold text-white mb-2">
            Cadastro de {tab === 'profissional' ? 'Profissional' : 'Escritório'}
          </h2>
          <p className="text-dark-400 text-sm mb-8">
            Preencha os campos abaixo para se cadastrar no CDA.
          </p>

          {tab === 'profissional' ? (
            <CadastroProfissional />
          ) : (
            <CadastroEscritorio />
          )}
        </div>
      </div>
    </section>
  );
}

export default function CadastroPage() {
  return (
    <>
      <PageHeader
        title="Cadastre-se"
        subtitle="Faça parte do CDA e aproveite benefícios exclusivos"
      />
      <Suspense fallback={<div className="py-20 text-center text-dark-400">Carregando...</div>}>
        <CadastroContent />
      </Suspense>
    </>
  );
}
