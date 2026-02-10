import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/Animations';
import ContatoForm from '@/components/forms/ContatoForm';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Entre em contato com o CDA – Clube da Decoração e Arquitetura.',
};

export default function ContatoPage() {
  return (
    <>
      <PageHeader title="Contato" subtitle="Entre em contato conosco" />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Info */}
            <div className="space-y-6">
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Informações
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3 text-dark-300">
                    <MapPin className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Endereço</p>
                      <p>São Paulo, SP - Brasil</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-dark-300">
                    <Phone className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Telefone</p>
                      <p>(11) 3000-0000</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-dark-300">
                    <Mail className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">E-mail</p>
                      <p>contato@clubecda.com.br</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-dark-300">
                    <Clock className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Horário</p>
                      <p>Seg a Sex: 9h às 18h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="glass rounded-xl p-8">
                <h3 className="text-xl font-display font-bold text-white mb-6">
                  Envie sua mensagem
                </h3>
                <ContatoForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
